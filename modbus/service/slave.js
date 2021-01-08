//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbMdCore = require("./../model/core");
const MbPrCore = require("./../protocol/core");
const MbPrSlaveLayer = require("./../protocol/slave/layer");
const MbTrCore = require("./../transport/core");
const MbError = require("./../../error");
const XRTLibAsync = require("xrtlibrary-async");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const Util = require("util");

//  Imported classes.
const MBPDU = 
    MbPrCore.MBPDU;
const MBTransportAnswer = 
    MbTrCore.MBTransportAnswer;
const IMBSlaveTransaction = 
    MbTrCore.IMBSlaveTransaction;
const IMBDataModel = 
    MbMdCore.IMBDataModel;
const MBSlaveProtocolLayer = 
    MbPrSlaveLayer.MBSlaveProtocolLayer;
const IMBSlaveTransport = 
    MbTrCore.IMBSlaveTransport;
const MBError = 
    MbError.MBError;
const MBInvalidNodeError = 
    MbError.MBInvalidNodeError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInitiateError = 
    MbError.MBInitiateError;
const MBBugError = 
    MbError.MBBugError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const PreemptReject = 
    XRTLibAsync.Asynchronize.Preempt.PreemptReject;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;

//
//  Classes.
//

/**
 *  Modbus slave service.
 * 
 *  @constructor
 *  @param {IMBDataModel} model 
 *    - The data model.
 *  @param {MBSlaveProtocolLayer} layerProtocol 
 *    - The protocol layer.
 *  @param {IMBSlaveTransport} layerTransport 
 *    - The transport layer.
 */
function MBSlaveService(model, layerProtocol, layerTransport) {
    //
    //  Members.
    //

    //  Protocol-layer service host.
    let serviceHost = layerProtocol.getServiceHost();

    //  Synchronizers.
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();
    
    //
    //  Public methods.
    //

    /**
     *  Wait for the service to be closed.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred).
     */
    this.wait = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        try {
            await syncClosed.waitWithCancellator(cancellator);
        } catch(error) {
            let msg = (error.message || "Unknown error.");
            if (
                error instanceof ConditionalSynchronizer.OperationCancelledError
            ) {
                throw new MBOperationCancelledError(msg);
            }
            throw new MBError(msg);
        }
    };

    /**
     *  Get whether the service was already closed.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        return syncClosed.isFullfilled();
    };

    /**
     *  Close the service.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The service was already closed.
     *  @param {Boolean} [forcibly] 
     *    - True if the service should be closed forcibly.
     */
    this.close = function(forcibly = false) {
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The service was already closed."
            );
        }
        if (forcibly) {
            syncCmdTerminate.fullfill();
        } else {
            syncCmdClose.fullfill();
        }
    };

    //
    //  Coroutine(s).
    //

    //  Main coroutine.
    (async function() {
        while (true) {
            //  Poll for a transaction.
            /**
             *  @type {?IMBSlaveTransaction}
             */
            let transaction = null;
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = layerTransport.poll(cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    if (error instanceof MBInvalidOperationError) {
                        break;
                    }
                    throw error;
                }
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    transaction = rsv.getValue();
                } else if (wh == wh2) {
                    if (!layerTransport.isClosed()) {
                        layerTransport.close(false);
                    }
                    break;
                } else if (wh == wh3) {
                    if (!layerTransport.isClosed()) {
                        layerTransport.close(true);
                        await layerTransport.wait();
                    }
                    return;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }

            //  Get the query.
            let query = transaction.getQuery();

            //  Get and select the unit ID.
            let queryUnitID = query.getUnitID();
            try {
                model.select(queryUnitID);
            } catch(error) {
                //  Skip this transaction if select node is not accepted by the 
                //  data model.
                transaction.ignore();
                if (!(error instanceof MBInvalidNodeError)) {
                    ReportBug(
                        "Not a MBInvalidNodeError exception.", 
                        false, 
                        MBBugError
                    );
                }
                continue;
            }

            //  Get the query PDU.
            let queryPDU = new MBPDU(query.getFunctionCode(), query.getData());

            //  Handle the query.
            let answerPDU = serviceHost.handle(model, queryPDU);
            if (answerPDU === null) {
                transaction.ignore();
                continue;
            }

            //  Answer the transaction (currently no need to wait for the 
            //  transaction).
            transaction.answer(new MBTransportAnswer(
                answerPDU.getFunctionCode(), 
                answerPDU.getData()
            ));
        }

        {
            let cts = new ConditionalSynchronizer();
            let wh1 = layerTransport.wait(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Do nothing.
            } else if (wh == wh2) {
                if (!layerTransport.isClosed()) {
                    layerTransport.close(true);
                    await layerTransport.wait();
                }
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        if (!layerTransport.isClosed()) {
            layerTransport.close(true);
        }
        syncClosed.fullfill();
    });
}

/**
 *  Create a new slave service.
 * 
 *  @throws {MBOperationCancelledError}
 *    - The cancellator was activated.
 *  @throws {MBInitiateError}
 *    - Failed to initiate transport-layer, protocol-layer or data model.
 *  @param {IMBSlaveServiceInitiator} initiator
 *    - The service initiator.
 *  @param {ConditionalSynchronizer} [cancellator]
 *    - The cancellator.
 */
MBSlaveService.Create = async function(
    initiator, 
    cancellator = new ConditionalSynchronizer()
) {
    //  Initiate data model.
    let model = await initiator.initiateDataModel(cancellator);

    //  Initiate transport layer.
    let layerTransport = await initiator.initiateTransportLayer(
        cancellator
    );

    //  Initiate protocol layer.
    let layerProtocol = null;
    try {
        layerProtocol = await initiator.initiateProtocolLayer(cancellator);
    } catch(error) {
        //  Dispose the transport layer.
        layerTransport.close(true);
        await layerTransport.wait();

        //  Throw.
        throw error;
    }

    //  Create service.
    return new MBSlaveService(model, layerProtocol, layerTransport);
};

/**
 *  Interface of all Modbus slave service initiator classes.
 * 
 *  @constructor
 */
function IMBSlaveServiceInitiator() {
    //
    //  Public methods.
    //

    /**
     *  Initiate transport-layer.
     * 
     *  Note(s) to the implementer:
     *    [1] Once this function returned, the transport object would be totally
     *        managed by the slave service. It is highly NOT recommended for 
     *        your upper application to do any operation on the transport 
     *        object directly.
     *    [2] To close the transport, call MBSlaveService.prototype.close() 
     *        instead of closing the transport directly.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate transport-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBSlaveTransport>}
     *    - The promise object (resolves with the transport if succeed, rejects 
     *      if error occurred).
     */
    this.initiateTransportLayer = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };

    /**
     *  Initiate protocol-layer.
     * 
     *  Note(s) to the implementer:
     *    [1] The protocol-layer returned by this method can be modified on-fly.
     *        It means that your application can change the protocol-layer even 
     *        the slave service is still running.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate protocol-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<MBSlaveProtocolLayer>}
     *    - The promise object (resolves with the protocol-layer if succeed, 
     *      rejects if error occurred).
     */
    this.initiateProtocolLayer = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };

    /**
     *  Initiate data model.
     * 
     *  Note(s) to the implementer:
     *    [1] The data model returned by this method is NOT managed by the slave
     *        service and can be modified on-fly.
     *        It means that your application can change the data model even the 
     *        slave service is still running. It also means that it is your 
     *        upper application's responsibility to dispose resources used by 
     *        the data model.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate protocol-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBDataModel>}
     *    - The promise object (resolves with the data model if succeed, rejects
     *      if error occurred).
     */
    this.initiateDataModel = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };
}

//  Export public APIs.
module.exports = {
    "MBSlaveService": MBSlaveService,
    "IMBSlaveServiceInitiator": IMBSlaveServiceInitiator
};