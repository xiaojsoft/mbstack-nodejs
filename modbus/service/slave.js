//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbMdCore = 
    require("./../model/core");
const MbPrCore = 
    require("./../protocol/core");
const MbPrSlaveLayer = 
    require("./../protocol/slave/layer");
const MbTrCore = 
    require("./../transport/core");
const MbCounters = 
    require("./../counters");
const MbError = 
    require("./../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const Util = 
    require("util");

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
const MBParameterError = 
    MbError.MBParameterError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInitiateError = 
    MbError.MBInitiateError;
const MBBugError = 
    MbError.MBBugError;
const MBFunctionProhibitedError = 
    MbError.MBFunctionProhibitedError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const PreemptReject = 
    XRTLibAsync.Asynchronize.Preempt.PreemptReject;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;

//  Imported constants.
const CNTRNO_SLVEXCERROR = 
    MbCounters.CNTRNO_SLVEXCERROR;
const CNTRNO_SLVMESSAGE = 
    MbCounters.CNTRNO_SLVMESSAGE;
const CNTRNO_SLVNORESP = 
    MbCounters.CNTRNO_SLVNORESP;

//
//  Constants.
//

//  Default worker settings.
const DFLT_WORKER_COUNT = 1;

//
//  Classes.
//

/**
 *  Modbus slave service options.
 * 
 *  @constructor
 */
function MBSlaveServiceOption() {
    //
    //  Members.
    //

    //  Worker count.
    let nWorkers = DFLT_WORKER_COUNT;

    //
    //  Public methods.
    //

    /**
     *  Set the worker count.
     * 
     *  Note(s):
     *    [1] The worker count must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - Invalid worker count.
     *  @param {Number} wkn
     *    - The new worker count.
     */
    this.setWorkerCount = function(wkn) {
        if (!(Number.isInteger(wkn) && wkn >= 1)) {
            throw new MBParameterError("Invalid worker count.");
        }
        nWorkers = wkn;
    };

    /**
     *  Get the worker count.
     * 
     *  @returns {Number}
     *    - The worker count.
     */
    this.getWorkerCount = function() {
        return nWorkers;
    };
}

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
 *  @param {MBSlaveServiceOption} [options]
 *    - The service options.
 */
function MBSlaveService(
    model, 
    layerProtocol, 
    layerTransport,
    options = new MBSlaveServiceOption()
) {
    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Protocol-layer service host.
    let serviceHost = layerProtocol.getServiceHost();

    //  Synchronizers.
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();
    
    //  Counters.
    let cntrSlaveMessage = 0n;
    let cntrSlaveNoResp  = 0n;
    let cntrSlaveExError = 0n;

    //  Worker count.
    let nWorkers = options.getWorkerCount();

    //  Listen-only mode switch.
    let swListenOnly = false;

    //
    //  Public methods.
    //

    /**
     *  Reset the Slave Message Count counter.
     */
    this.resetSlaveMessageCount = function() {
        cntrSlaveMessage = 0n;
    };

    /**
     *  Get the value of the Slave Message Count counter.
     * 
     *  Note(s):
     *    [1] The Slave Message Count counter saves the quantity of messages 
     *        addressed to the slave (including broadcast messages).
     * 
     *  @returns {BigInt}
     *    - The value.
     */
    this.getSlaveMessageCount = function() {
        return cntrSlaveMessage;
    };

    /**
     *  Reset the Slave No Response Count counter.
     */
    this.resetSlaveNoResponseCount = function() {
        cntrSlaveNoResp = 0n;
    };

    /**
     *  Get the value of the Slave No Response Count counter.
     * 
     *  Note(s):
     *    [1] The Slave No Response Count counter saves the quantity of messages
     *        addressed to the slave (including broadcast messages) and the 
     *        slave returned no response (neither a normal response nor an 
     *        exception response).
     * 
     *  @returns {BigInt}
     *    - The value.
     */
    this.getSlaveNoResponseCount = function() {
        return cntrSlaveNoResp;
    };

    /**
     *  Reset the Slave Exception Error Count counter.
     */
    this.resetSlaveExceptionErrorCount = function() {
        cntrSlaveExError = 0n;
    };

    /**
     *  Get the value of the Slave Exception Error Count counter.
     * 
     *  @returns {BigInt}
     *    - The value.
     */
    this.getSlaveExceptionErrorCount = function() {
        return cntrSlaveExError;
    };

    /**
     *  Reset the value of specified counter.
     * 
     *  Note(s):
     *    [1] No action if the counter is not available.
     * 
     *  @param {Number} cntrid
     *    - The counter ID.
     */
    this.resetCounterValue = function(cntrid) {
        switch (cntrid) {
        case CNTRNO_SLVEXCERROR:
            self.resetSlaveExceptionErrorCount();
            break;
        case CNTRNO_SLVMESSAGE:
            self.resetSlaveMessageCount();
            break;
        case CNTRNO_SLVNORESP:
            self.resetSlaveNoResponseCount();
            break;
        default:
            break;
        }
        layerTransport.resetCounterValue(cntrid);
    };

    /**
     *  Get the value of specified counter.
     * 
     *  Note(s):
     *    [1] 0n would be returned if the counter is not available.
     * 
     *  @param {Number} cntrid
     *    - The counter ID.
     *  @returns {BigInt}
     *    - The counter value.
     */
    this.getCounterValue = function(cntrid) {
        let cntrval = 0n;
        switch (cntrid) {
        case CNTRNO_SLVEXCERROR:
            cntrval = self.getSlaveExceptionErrorCount();
            break;
        case CNTRNO_SLVMESSAGE:
            cntrval = self.getSlaveMessageCount();
            break;
        case CNTRNO_SLVNORESP:
            cntrval = self.getSlaveNoResponseCount();
            break;
        default:
            break;
        }
        cntrval += layerTransport.getCounterValue(cntrid);
        return cntrval;
    };

    /**
     *  Get available counters.
     * 
     *  @returns {Set<Number>}
     *    - The set that contains the ID of all available counters.
     */
    this.getAvailableCounters = function() {
        let ret = new Set([
            CNTRNO_SLVEXCERROR,
            CNTRNO_SLVMESSAGE,
            CNTRNO_SLVNORESP
        ]);
        layerTransport.getAvailableCounters().forEach(function(cntrid) {
            ret.add(cntrid);
        });
        return ret;
    };

    /**
     *  Reset the value of all available counters.
     */
    this.resetAllCounters = function() {
        self.getAvailableCounters().forEach(function(cntrid) {
            self.resetCounterValue(cntrid);
        });
    };

    /**
     *  Get the value of the listen-only mode switch.
     * 
     *  @returns {Boolean}
     *    - True if the listen-only mode switch is on.
     */
    this.getListenOnlySwitch = function() {
        return swListenOnly;
    };

    /**
     *  Set the value of the listen-only mode switch.
     * 
     *  @param {Boolean} en
     *    - True if the listen-only mode switch should be turned on.
     */
    this.setListenOnlySwitch = function(en) {
        swListenOnly = en;
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

    //  Worker coroutines.
    let syncWorkerExits = [];
    for (let workerId = 0; workerId < nWorkers; ++workerId) {
        let syncWorkerExited = new ConditionalSynchronizer();
        (function(_workerId) {
            (async function() {
                /*
                 *  Here is the diagram of the worker state machine:
                 * 
                 *                                  [4]      +----------+
                 *                             +-----------> | FINALIZE |
                 *                             |             +----------+
                 *                             |
                 *          +------------------+-------------------+
                 *          |                  |                   |
                 *          |                  |                   |
                 *       +------+  [1]   +-----------+  [2]   +---------+
                 *  ---> | POLL | -----> | TR_HANDLE | -----> | TR_WAIT |
                 *       +------+        +-----------+        +---------+
                 *          ^                                      |
                 *          |                                      |
                 *          +--------------------------------------+
                 *                             [3]
                 * 
                 *  Transition condition:
                 * 
                 *    [1] Got one transaction.
                 *    [2] Two posibilities:
                 *          - The unit ID is not accepted by the data model.
                 *            The transaction was ignored.
                 *          - No answer needed. The transaction was ignored.
                 *          - Answer needed. The transaction was answered.
                 *    [3] Transaction settled.
                 *    [4] Close/terminate signal was received.
                 * 
                 */

                const WKSTATE_POLL = 1;
                const WKSTATE_TRANSACTION_HANDLE = 2;
                const WKSTATE_TRANSACTION_WAIT = 3;
                const WKSTATE_FINALIZE = 4;

                //  Transaction.
                /**
                 *  @type {?IMBSlaveTransaction}
                 */
                let transaction = null;

                //  Run the state machine.
                let state = WKSTATE_POLL;
                while(true) {
                    if (state == WKSTATE_POLL) {
                        //
                        //  Poll for a transaction.
                        //

                        //  Wait for signals.
                        let cts = new ConditionalSynchronizer();
                        let wh1 = layerTransport.poll(cts);
                        let wh2 = syncCmdClose.waitWithCancellator(cts);
                        let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                        let rsv = null;
                        try {
                            rsv = await CreatePreemptivePromise([
                                wh1, 
                                wh2, 
                                wh3
                            ]);
                        } catch(error) {
                            if (error instanceof PreemptReject) {
                                error = error.getReason();
                            }
                            if (error instanceof MBInvalidOperationError) {
                                //  Go to FINALIZE state.
                                state = WKSTATE_FINALIZE;
                                continue;
                            }
                            throw error;
                        } finally {
                            cts.fullfill();
                        }

                        //  Handle the signal.
                        let wh = rsv.getPromiseObject();
                        if (wh == wh1) {
                            //  Get the transaction.
                            transaction = rsv.getValue();

                            //  Go to TRANSACTION_HANDLE state.
                            state = WKSTATE_TRANSACTION_HANDLE;
                        } else {
                            //  Wait for wait handler 1 to be settled.
                            try {
                                transaction = await wh1;
                                transaction.ignore();
                                await transaction.wait();
                            } catch(error) {
                                //  Operation cancelled. Do nothing.
                            }

                            //  Handle other signals.
                            if (wh == wh2 || wh == wh3) {
                                //  Go to FINALIZE state.
                                state = WKSTATE_FINALIZE;
                            } else {
                                ReportBug(
                                    "Invalid wait handler.", 
                                    true, 
                                    MBBugError
                                );
                            }
                        }
                    } else if (state == WKSTATE_TRANSACTION_HANDLE) {
                        //  Get the query.
                        let query = transaction.getQuery();

                        //  Get and select the unit ID.
                        let queryUnitID = query.getUnitID();
                        try {
                            model.select(queryUnitID);
                        } catch(error) {
                            //  Skip this transaction if select node is not 
                            //  accepted by the data model.
                            transaction.ignore();
                            if (!(error instanceof MBInvalidNodeError)) {
                                ReportBug(
                                    "Not a MBInvalidNodeError exception.", 
                                    false, 
                                    MBBugError
                                );
                            }

                            //  Go to TRANSACTION_WAIT state.
                            state = WKSTATE_TRANSACTION_WAIT;
                            continue;
                        }

                        //  Increase the value of the Slave Message Count 
                        //  counter.
                        ++(cntrSlaveMessage);

                        //  Get the query PDU.
                        let queryPDU = new MBPDU(
                            query.getFunctionCode(), 
                            query.getData()
                        );

                        //  Acquire the transaction lock.
                        {
                            //  Wait for signals.
                            let cts = new ConditionalSynchronizer();
                            let wh1 = model.transactionLock(cts);
                            let wh2 = syncCmdClose.waitWithCancellator(cts);
                            let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                            let rsv = await CreatePreemptivePromise([
                                wh1, 
                                wh2, 
                                wh3
                            ]);
                            cts.fullfill();

                            //  Handle the signal.
                            let wh = rsv.getPromiseObject();
                            if (wh == wh1) {
                                //  Do nothing.
                            } else {
                                //  Wait for wait handler 1 to be settled.
                                try {
                                    await wh1;
                                    model.transactionUnlock();
                                } catch(error) {
                                    //  Operation cancelled. Do nothing.
                                }

                                if (wh == wh2 || wh == wh3) {
                                    //  Go to FINALIZE state.
                                    state = WKSTATE_FINALIZE;
                                    continue;
                                } else {
                                    ReportBug(
                                        "Invalid wait handler.", 
                                        true, 
                                        MBBugError
                                    );
                                }
                            }
                        }

                        //  Handle the query.
                        let answerPDU = null;
                        try {
                            //  Wait for signals.
                            let cts = new ConditionalSynchronizer();
                            let wh1 = serviceHost.handle(
                                model, 
                                queryPDU, 
                                swListenOnly,
                                cts
                            );
                            let wh2 = syncCmdClose.waitWithCancellator(cts);
                            let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                            let rsv = null;
                            try {
                                rsv = await CreatePreemptivePromise([
                                    wh1, 
                                    wh2, 
                                    wh3
                                ]);
                            } catch(error) {
                                if (error instanceof PreemptReject) {
                                    error = error.getReason();
                                }
                                if (
                                    error instanceof MBFunctionProhibitedError
                                ) {
                                    //  No response.
                                    transaction.ignore();
    
                                    //  Increase the Slave Exception Error Count 
                                    //  counter.
                                    ++(cntrSlaveExError);
    
                                    //  Go to TRANSACTION_WAIT state.
                                    state = WKSTATE_TRANSACTION_WAIT;
    
                                    continue;
                                } else {
                                    throw error;
                                }
                            } finally {
                                cts.fullfill();
                            }

                            //  Handle the signal.
                            let wh = rsv.getPromiseObject();
                            if (wh == wh1) {
                                answerPDU = rsv.getValue();
                            } else {
                                //  Wait for wait handler 1 to be settled.
                                try {
                                    await wh1;
                                } catch(error) {
                                    //  Operation cancelled. Do nothing.
                                }

                                //  Handle other signals.
                                if (wh == wh2 || wh == wh3) {
                                    //  Go to FINALIZE state.
                                    state = WKSTATE_FINALIZE;
                                    continue;
                                } else {
                                    ReportBug(
                                        "Invalid wait handler.", 
                                        true, 
                                        MBBugError
                                    );
                                }
                            }
                        } finally {
                            //  Release the transaction lock.
                            model.transactionUnlock();
                        }

                        //  Answer the transaction.
                        if (answerPDU === null) {
                            transaction.ignore();

                            //  Increase the Slave No Response Count counter.
                            ++(cntrSlaveNoResp);
                        } else {
                            let answerFnCode = answerPDU.getFunctionCode();
                            if ((answerFnCode & 0x80) != 0) {
                                //  Increase the Slave Exception Error Count 
                                //  counter.
                                ++(cntrSlaveExError);
                            }
                            transaction.answer(new MBTransportAnswer(
                                answerFnCode, 
                                answerPDU.getData()
                            ));
                        }

                        //  Go to TRANSACTION_WAIT state.
                        state = WKSTATE_TRANSACTION_WAIT;
                    } else if (state == WKSTATE_TRANSACTION_WAIT) {
                        //
                        //  Wait for the transaction to be settled.
                        //

                        //  Wait for signals.
                        let cts = new ConditionalSynchronizer();
                        let wh1 = transaction.wait(cts);
                        let wh2 = syncCmdClose.waitWithCancellator(cts);
                        let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                        let rsv = await CreatePreemptivePromise([
                            wh1, 
                            wh2, 
                            wh3
                        ]);
                        cts.fullfill();

                        //  Handle the signal.
                        let wh = rsv.getPromiseObject();
                        if (wh == wh1) {
                            //  Go to POLL state.
                            state = WKSTATE_POLL;
                        } else if (wh == wh2 || wh == wh3) {
                            //  Go to FINALIZE state.
                            state = WKSTATE_FINALIZE;
                        } else {
                            ReportBug(
                                "Invalid wait handler.", 
                                true, 
                                MBBugError
                            );
                        }
                    } else if (state == WKSTATE_FINALIZE) {
                        break;
                    } else {
                        ReportBug("Invalid state.", true, MBBugError);
                    }
                }
            })().catch(function(error) {
                ReportBug(Util.format(
                    "Worker %d coroutine throw an exception (error=\"%s\").",
                    _workerId,
                    error.message || "Unknown error."
                ), false, MBBugError);
            }).finally(function() {
                syncWorkerExited.fullfill();
            });
        })(workerId);
        syncWorkerExits.push(syncWorkerExited);
    }

    //  Main coroutine.
    (async function() {
        /* 
         *  Here is the diagram of the main coroutine state machine:
         * 
         *       +------+  [2]   +---------+  [1]   +--------+
         *  ---> | WAIT | -----> | CLOSING | -----> | CLOSED | ---> ...
         *       +------+        +---------+        +--------+
         *          |                                    ^
         *          |                                    |
         *          +------------------------------------+
         *                           [1]
         * 
         *  Transition conditions:
         * 
         *    [1] Terminate signal was received.
         *    [2] Close signal was received.
         * 
         */
        const CRTSTATE_WAIT = 0;
        const CRTSTATE_CLOSING = 1;
        const CRTSTATE_CLOSED = 2;

        //  Run the state machine.
        let state = CRTSTATE_WAIT;
        while(true) {
            if (state == CRTSTATE_WAIT) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = syncCmdClose.waitWithCancellator(cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Close the transport.
                    if (!layerTransport.isClosed()) {
                        layerTransport.close(false);
                    }

                    //  Go to CLOSING state.
                    state = CRTSTATE_CLOSING;
                } else if (wh == wh2) {
                    //  Close the transport (forcibly).
                    if (!layerTransport.isClosed()) {
                        layerTransport.close(true);
                        await layerTransport.wait();
                    }

                    //  Go to CLOSED state.
                    state = CRTSTATE_CLOSED;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == CRTSTATE_CLOSING) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = layerTransport.wait(cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Go to CLOSED state.
                    state = CRTSTATE_CLOSED;
                } else if (wh == wh2) {
                    //  Close the transport (forcibly).
                    if (!layerTransport.isClosed()) {
                        layerTransport.close(true);
                        await layerTransport.wait();
                    }

                    //  Go to CLOSED state.
                    state = CRTSTATE_CLOSED;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == CRTSTATE_CLOSED) {
                break;
            } else {
                ReportBug("Invalid state.", true, MBBugError);
            }
        }

        //  Wait for worker coroutines to be exited.
        for (let i = 0; i < syncWorkerExits.length; ++i) {
            await syncWorkerExits[i].wait();
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
    "MBSlaveServiceOption": MBSlaveServiceOption,
    "MBSlaveService": MBSlaveService,
    "IMBSlaveServiceInitiator": IMBSlaveServiceInitiator
};