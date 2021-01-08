//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrCore = require("./../protocol/core");
const MbPrMasterCmd = require("./../protocol/master/cmd");
const MbTrCore = require("./../transport/core");
const MbError = require("./../../error");
const XRTLibAsync = require("xrtlibrary-async");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const Util = require("util");

//  Imported classes.
const MBTransportQuery = 
    MbTrCore.MBTransportQuery;
const MBPDU = 
    MbPrCore.MBPDU;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const IMBMasterTransport = 
    MbTrCore.IMBMasterTransport;
const MBError = 
    MbError.MBError;
const MBParameterError = 
    MbError.MBParameterError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInitiateError = 
    MbError.MBInitiateError;
const MBPeerError = 
    MbError.MBPeerError;
const MBTimeoutError = 
    MbError.MBTimeoutError;
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
const CreateTimeoutPromiseEx = 
    XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromiseEx;

//
//  Classes.
//

/**
 *  Modbus master service.
 * 
 *  @constructor
 *  @param {IMBMasterTransport} layerTransport 
 *    - The transport layer.
 */
function MBMasterService(layerTransport) {
    //
    //  Members.
    //

    //  Synchronizers.
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();
    
    //
    //  Public methods.
    //

    /**
     *  Query one peer (slave).
     * 
     *  @throws {MBParameterError}
     *    - Either the unit identifier or the timeout is invalid.
     *  @throws {MBParseError}
     *    - Failed to parse the answer from the peer (slave).
     *  @throws {MBPeerError}
     *    - Peer (slave) threw an exception.
     *  @throws {MBCommunicationError}
     *    - Communication failed.
     *  @throws {MBInvalidOperationError}
     *    - The service was already closed or is going to be closed.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {Number} unitID 
     *    - The unit identifier of the slave.
     *  @param {MBMasterProtocolCommand} cmd 
     *    - The command.
     *  @param {?Number} [timeout] 
     *    - The timeout (NULL if not limited).
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     */
    this.query = async function(
        unitID, 
        cmd,
        timeout = null,
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Check the unit ID.
        if (!(Number.isInteger(unitID) && unitID >= 0x00 && unitID <= 0xFF)) {
            throw new MBParameterError("Invalid unit identifier.");
        }

        //  Check the timeout.
        if (!(timeout === null || (Number.isInteger(timeout) && timeout > 0))) {
            throw new MBParameterError("Invalid timeout.");
        }

        //  Build query.
        let queryPDU = cmd.getQueryPDU();
        let query = new MBTransportQuery(
            unitID, 
            queryPDU.getFunctionCode(), 
            queryPDU.getData()
        );

        //  Get the parser.
        let parser = cmd.getAnswerParser();
        let noAnswer = (parser === null);

        //  Query the slave.
        let answer = null;
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = layerTransport.query(query, noAnswer, cts);
            let wh2 = cancellator.waitWithCancellator(cts);
            let wh3 = null;
            if (timeout === null) {
                wh3 = new Promise(function() {});
            } else {
                wh3 = CreateTimeoutPromiseEx(timeout, cts);
            }
            let rsv = null;
            try {
                rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
            } catch(error) {
                if (error instanceof PreemptReject) {
                    error = error.getReason();
                }
                throw error;
            }
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                answer = rsv.getValue();
            } else if (wh == wh2) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else if (wh == wh3) {
                throw new MBTimeoutError("Timeout exceed.");
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
        if (noAnswer) {
            return null;
        }

        //  Parser the answer.
        let answerPDU = new MBPDU(answer.getFunctionCode(), answer.getData());
        let answerParseOut = parser.parse(answerPDU);

        //  Throw if peer failed.
        if (answerParseOut.hasException()) {
            let ec = answerParseOut.getExceptionCode();
            let error = new MBPeerError(Util.format(
                "An exception was thrown from the peer (code=%d).",
                ec
            ));
            error.exception_code = ec;
            throw error;
        }

        return answerParseOut.getData();
    };

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
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = layerTransport.wait(cts);
            let wh2 = syncCmdClose.waitWithCancellator(cts);
            let wh3 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                return;
            } else if (wh == wh2) {
                if (!layerTransport.isClosed()) {
                    layerTransport.close(false);
                }
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
 *  Create a new master service.
 * 
 *  @throws {MBOperationCancelledError}
 *    - The cancellator was activated.
 *  @throws {MBInitiateError}
 *    - Failed to initiate transport-layer.
 *  @param {IMBMasterServiceInitiator} initiator
 *    - The service initiator.
 *  @param {ConditionalSynchronizer} [cancellator]
 *    - The cancellator.
 */
MBMasterService.Create = async function(
    initiator, 
    cancellator = new ConditionalSynchronizer()
) {
    //  Initiate transport layer.
    let layerTransport = await initiator.initiateTransportLayer(
        cancellator
    );

    //  Create service.
    return new MBMasterService(layerTransport);
};

/**
 *  Interface of all Modbus master service initiator classes.
 * 
 *  @constructor
 */
function IMBMasterServiceInitiator() {
    //
    //  Public methods.
    //

    /**
     *  Initiate transport-layer.
     * 
     *  Note(s) to the implementer:
     *    [1] Once this function returned, the transport object would be totally
     *        managed by the master service. It is highly NOT recommended for 
     *        your upper application to do any operation on the transport 
     *        object directly.
     *    [2] To close the transport, call MBMasterService.prototype.close() 
     *        instead of closing the transport directly.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate transport-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBMasterTransport>}
     *    - The promise object (resolves with the transport if succeed, rejects 
     *      if error occurred).
     */
    this.initiateTransportLayer = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };
}

//  Export public APIs.
module.exports = {
    "MBMasterService": MBMasterService,
    "IMBMasterServiceInitiator": IMBMasterServiceInitiator
};