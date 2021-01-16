//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlRtuFrame = 
    require("./../slrtu-frame");
const MbTspSlRtuTransceiver = 
    require("./../slrtu-transceiver");
const MbTspSlDriverGeneric = 
    require("./../../driver/generic/sl-drivergeneric");
const MbTspSlDriverCore = 
    require("./../../driver/sl-drivercore");
const MbTspSlDriverRegistry = 
    require("./../../driver/sl-driverregistry");
const MbTspCore = 
    require("./../../../core");
const MbCounters = 
    require("./../../../../counters");
const MbError = 
    require("./../../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const XRTLibTraverse = 
    require("xrtlibrary-traverse");
const Util = 
    require("util");

//  Imported classes.
const MBRtuFrame = 
    MbTspSlRtuFrame.MBRtuFrame;
const MBRtuTransceiver = 
    MbTspSlRtuTransceiver.MBRtuTransceiver;
const MBRtuTransceiverOption = 
    MbTspSlRtuTransceiver.MBRtuTransceiverOption;
const MBSerialPortOption = 
    MbTspSlDriverCore.MBSerialPortOption;
const MBSerialPortDriverRegistry = 
    MbTspSlDriverRegistry.MBSerialPortDriverRegistry;
const MBGenericSerialPortDriver = 
    MbTspSlDriverGeneric.MBGenericSerialPortDriver;
const MBTransportQuery = 
    MbTspCore.MBTransportQuery;
const MBTransportAnswer = 
    MbTspCore.MBTransportAnswer;
const IMBSlaveTransaction = 
    MbTspCore.IMBSlaveTransaction;
const IMBSlaveTransport = 
    MbTspCore.IMBSlaveTransport;
const IMBSlaveTransportFactory = 
    MbTspCore.IMBSlaveTransportFactory;
const MBError = 
    MbError.MBError;
const MBBugError = 
    MbError.MBBugError;
const MBConfigurationError = 
    MbError.MBConfigurationError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBParameterError = 
    MbError.MBParameterError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBCommunicationError = 
    MbError.MBCommunicationError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const EventFlags = 
    XRTLibAsync.Synchronize.Event.EventFlags;
const SemaphoreSynchronizer = 
    XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;

//  Imported constants.
const MBSL_DATABIT_7 = 
    MbTspSlDriverCore.MBSL_DATABIT_7;
const MBSL_DATABIT_8 = 
    MbTspSlDriverCore.MBSL_DATABIT_8;
const MBSL_PARITY_NONE = 
    MbTspSlDriverCore.MBSL_PARITY_NONE;
const MBSL_PARITY_ODD = 
    MbTspSlDriverCore.MBSL_PARITY_ODD;
const MBSL_PARITY_EVEN = 
    MbTspSlDriverCore.MBSL_PARITY_EVEN;
const MBSL_STOPBIT_1 = 
    MbTspSlDriverCore.MBSL_STOPBIT_1;
const MBSL_STOPBIT_2 = 
    MbTspSlDriverCore.MBSL_STOPBIT_2;
const CHRTMSCL_MIN = 
    MbTspSlRtuTransceiver.CHRTMSCL_MIN;
const CHRTMSCL_MAX = 
    MbTspSlRtuTransceiver.CHRTMSCL_MAX;
const CHRTMSCL_DFLT = 
    MbTspSlRtuTransceiver.CHRTMSCL_DFLT;
const CNTRNO_BUSMESSAGE = 
    MbCounters.CNTRNO_BUSMESSAGE;
const CNTRNO_BUSCOMERROR = 
    MbCounters.CNTRNO_BUSCOMERROR;
const CNTRNO_BUSCHROVR = 
    MbCounters.CNTRNO_BUSCHROVR;
    
//
//  Constants.
//

//  Signal bit masks (group 1).
const SIGBITMASK_TR_CANCELLED = 0x01;
const SIGBITMASK_TR_COMPLETE  = 0x02;
const SIGBITMASK_TR_COMPLETE_WITH_ERROR = 0x04;

//
//  Classes.
//

/**
 *  Modbus RTU slave transaction.
 * 
 *  @constructor
 *  @extends {IMBSlaveTransaction}
 *  @param {MBTransportQuery} query 
 *    - The query.
 *  @param {EventFlags} queryStateBits 
 *    - The query state bits synchronizer.
 *  @param {(ans: MBTransportAnswer) => void} cbResponseAnswer 
 *    - The answer callback.
 *  @param {() => void} cbResponseIgnore 
 *    - The ignore callback.
 */
function MBRtuSlaveTransaction(
    query, 
    queryStateBits,
    cbResponseAnswer, 
    cbResponseIgnore
) {
    //  Let parent class initialize.
    IMBSlaveTransaction.call(this);

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Answered/ignored flag.
    let answered = false;

    //
    //  Public methods.
    //

    /**
     *  Get the the query.
     * 
     *  @returns {MBTransportQuery}
     *    - The query.
     */
    this.getQuery = function() {
        return query;
    };

    /**
     *  Get current transaction state.
     * 
     *  Note(s):
     *    [1] The slave have following states:
     * 
     *          - IMBSlaveTransaction.STATE_INCOMPLETE:
     * 
     *              The transaction is still waiting.
     * 
     *          - IMBSlaveTransaction.STATE_CANCELLED:
     * 
     *              The transaction was cancelled by the transport-layer.
     * 
     *          - IMBSlaveTransaction.STATE_COMPLETE:
     * 
     *              The transaction was completed.
     * 
     *          - IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR:
     * 
     *              The transaction was completed but an error occurred while 
     *              completing the transaction.
     * 
     *  @returns {Number}
     *    - The transaction state (one of IMBSlaveTransaction.STATE_*).
     */
    this.getState = function() {
        let sv = queryStateBits.value;
        if ((sv & SIGBITMASK_TR_COMPLETE) != 0) {
            if ((sv & SIGBITMASK_TR_COMPLETE_WITH_ERROR) != 0) {
                return IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR;
            } else {
                return IMBSlaveTransaction.STATE_COMPLETE;
            }
        } else if ((sv & SIGBITMASK_TR_CANCELLED) != 0) {
            return IMBSlaveTransaction.STATE_CANCELLED;
        } else {
            return IMBSlaveTransaction.STATE_INCOMPLETE;
        }
    };

    /**
     *  Wait for the transaction to complete or be cancelled.
     * 
     *  Note(s):
     *    [1] This method waits for the transaction to fall in one of following 
     *        states:
     * 
     *          - IMBSlaveTransaction.STATE_COMPLETE
     *          - IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR
     *          - IMBSlaveTransaction.STATE_CANCELLED
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<Number>}
     *    - The promise object (resolves with the state if succeed, rejects if 
     *      error occurred).
     */
    this.wait = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        try {
            await queryStateBits.pend(
                (SIGBITMASK_TR_COMPLETE | SIGBITMASK_TR_CANCELLED), 
                EventFlags.PEND_FLAG_SET_ANY,
                cancellator
            );
            return self.getState();
        } catch(error) {
            let msg = (error.message || "Unknown error.");
            if (error instanceof EventFlags.OperationCancelledError) {
                throw new MBOperationCancelledError(msg);
            }
            throw new MBError(msg);
        }
    };

    /**
     *  Answer the transaction.
     * 
     *  Note(s):
     *    [1] Assumes that class X is an implementation of this interface, 
     *        any call to this method would take no effect if either 
     *        X.prototype.answer() or X.prototype.ignore() was called before.
     * 
     *  @param {MBTransportAnswer} ans 
     *    - The answer.
     */
    this.answer = function(ans) {
        if (answered) {
            return;
        }
        answered = true;
        cbResponseAnswer.call(self, ans);
    };

    /**
     *  Ignore the transaction.
     * 
     *  Note(s):
     *    [1] Assumes that class X is an implementation of this interface, 
     *        any call to this method would take no effect if either 
     *        X.prototype.answer() or X.prototype.ignore() was called before.
     */
    this.ignore = function() {
        if (answered) {
            return;
        }
        answered = true;
        cbResponseIgnore.call(self);
    };
}

/**
 *  Modbus RTU slave transport options.
 * 
 *  @constructor
 */
function MBRtuSlaveTransportOption() {
    //  Nothing.
}

/**
 *  Modbus RTU slave transport.
 * 
 *  @constructor
 *  @extends {IMBSlaveTransport}
 *  @param {MBRtuTransceiver} rxtx
 *    - The transceiver.
 *  @param {MBRtuSlaveTransportOption} [options]
 *    - The transport options.
 */
function MBRtuSlaveTransport(
    rxtx,
    options = new MBRtuSlaveTransportOption()
) {
    //  Let parent class initialize.
    IMBSlaveTransport.call(this);

    //
    //  Members.
    //

    // //  Self reference.
    // let self = this;

    //  Synchronizers.
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();

    //  Pending transaction list.
    let pendingTransactions = [];
    let semPendingTransactionsToken = new SemaphoreSynchronizer(1);
    let semPendingTransactionsItems = new SemaphoreSynchronizer(0);

    //
    //  Public methods.
    //

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
        case CNTRNO_BUSMESSAGE:
            rxtx.resetBusMessageCount();
            break;
        case CNTRNO_BUSCOMERROR:
            rxtx.resetBusErrorCount();
            break;
        case CNTRNO_BUSCHROVR:
            rxtx.resetBusOverrunCount();
            break;
        default:
            break;
        }
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
        switch (cntrid) {
        case CNTRNO_BUSMESSAGE:
            return rxtx.getBusMessageCount();
        case CNTRNO_BUSCOMERROR:
            return rxtx.getBusErrorCount();
        case CNTRNO_BUSCHROVR:
            return rxtx.getBusOverrunCount();
        default:
            return 0n;
        }
    };

    /**
     *  Get available counters.
     * 
     *  @returns {Set<Number>}
     *    - The set that contains the ID of all available counters.
     */
    this.getAvailableCounters = function() {
        return new Set([
            CNTRNO_BUSMESSAGE, 
            CNTRNO_BUSCOMERROR, 
            CNTRNO_BUSCHROVR
        ]);
    };

    /**
     *  Poll for a transaction.
     * 
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed or is going to be closed.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBSlaveTransaction>}
     *    - The promise object (resolves with a transaction if succeed, rejects 
     *      if error occurred).
     */
    this.poll = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Throw if the transport was already closed.
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError("Transport was already closed.");
        }

        //  Wait for one pending transaction.
        let cts = new ConditionalSynchronizer();
        let wh1 = semPendingTransactionsItems.wait(cts);
        let wh2 = cancellator.waitWithCancellator(cts);
        let wh3 = syncCmdClose.waitWithCancellator(cts);
        let wh4 = syncCmdTerminate.waitWithCancellator(cts);
        let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
        cts.fullfill();
        let wh = rsv.getPromiseObject();
        if (wh == wh1) {
            let transaction = pendingTransactions.shift();
            semPendingTransactionsToken.signal();
            return transaction;
        } else {
            //  Wait for the pending transaction semaphore wait handler to be 
            //  settled.
            try {
                await wh1;
                semPendingTransactionsItems.signal();
            } catch(error) {
                //  Do nothing.
            }

            //  Handle other signals.
            if (wh == wh2) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else if (wh == wh3 || wh == wh4) {
                throw new MBInvalidOperationError(
                    "Transport is going to be closed."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    };

    /**
     *  Wait for the transport to be closed.
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
            let msg = error.message || "Unknown error.";
            if (
                error instanceof ConditionalSynchronizer.OperationCancelledError
            ) {
                throw new MBOperationCancelledError(msg);
            }
            throw new MBError(msg);
        }
    };

    /**
     *  Get whether the transport was already closed.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        return syncClosed.isFullfilled();
    };

    /**
     *  Close the transport.
     * 
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed.
     *  @param {Boolean} [forcibly] 
     *    - True if the transport should be closed forcibly.
     */
    this.close = function(forcibly = false) {
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError(
                "Transport was already closed."
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
        //  Create RX frame handler.
        let syncLocalRx = new ConditionalSynchronizer();
        rxtx.on("frame", function(frame) {
            if (!syncLocalRx.isFullfilled()) {
                syncLocalRx.fullfill(frame);
            }
        });

        //  Poll queries.
        while(true) {
            //  Receive one query.
            /**
             *  @type {?MBRtuFrame}
             */
            let frameQuery = null;
            {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = syncLocalRx.waitWithCancellator(cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    frameQuery = rsv.getValue();
                } else if (wh == wh2) {
                    if (!rxtx.isClosed()) {
                        rxtx.close(false);
                    }
                    break;
                } else if (wh == wh3) {
                    if (!rxtx.isClosed()) {
                        rxtx.close(true);
                        await rxtx.wait();
                    }
                    return;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }

            //  Get the query information.
            let queryAddress = frameQuery.getAddress();
            let queryFnCode = frameQuery.getFunctionCode();
            let queryData = frameQuery.getData();

            //  Get a transaction token.
            {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = semPendingTransactionsToken.wait(cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();

                //  Handle the signals.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Do nothing.
                } else {
                    //  Wait for the tokening wait handler to be 
                    //  settled.
                    try {
                        await wh1;
                        semPendingTransactionsToken.signal();
                    } catch(error) {
                        //  Do nothing.
                    }

                    if (wh == wh2) {
                        if (!rxtx.isClosed()) {
                            rxtx.close(false);
                        }
                        break;
                    } else if (wh == wh3) {
                        if (!rxtx.isClosed()) {
                            rxtx.close(true);
                            await rxtx.wait();
                        }
                        return;
                    } else {
                        ReportBug(
                            "Invalid wait handler.", 
                            true, 
                            MBBugError
                        );
                    }
                }
            }

            //  Create transaction synchronizers.
            let syncLocalQueryAnswered = new ConditionalSynchronizer();
            let syncLocalQueryIgnored = new ConditionalSynchronizer();
            let syncLocalQueryStateBits = new EventFlags(0x00);

            //  Build transaction object.
            let transaction = new MBRtuSlaveTransaction(
                new MBTransportQuery(queryAddress, queryFnCode, queryData),
                syncLocalQueryStateBits,
                function(ans) {
                    syncLocalQueryAnswered.fullfill(ans);
                },
                function() {
                    syncLocalQueryIgnored.fullfill();
                }
            );
    
            //  Append the transaction object to pending transaction list.
            pendingTransactions.push(transaction);
            semPendingTransactionsItems.signal();

            //  Wait for answer.
            let answer = null;
            {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = syncLocalQueryAnswered.waitWithCancellator(cts);
                let wh2 = syncLocalQueryIgnored.waitWithCancellator(cts);
                let wh3 = syncCmdClose.waitWithCancellator(cts);
                let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    answer = rsv.getValue();
                } else if (wh == wh2) {
                    syncLocalQueryStateBits.post(
                        SIGBITMASK_TR_COMPLETE,
                        EventFlags.POST_FLAG_SET
                    );
                    if (!rxtx.isClosed()) {
                        rxtx.close(false);
                    }
                    break;
                } else if (wh == wh3 || wh == wh4) {
                    syncLocalQueryStateBits.post(
                        (
                            SIGBITMASK_TR_CANCELLED | 
                            SIGBITMASK_TR_COMPLETE
                        ), 
                        EventFlags.POST_FLAG_SET
                    );
                    if (!rxtx.isClosed()) {
                        rxtx.close(true);
                        await rxtx.wait();
                    }
                    return;
                } else {
                    ReportBug(
                        "Invalid wait handler.", 
                        true, 
                        MBBugError
                    );
                }
            }

            //  Build response frame.
            let frameAnswer = new MBRtuFrame(
                queryAddress, 
                answer.getFunctionCode(), 
                answer.getData()
            );

            //  Transmit the response frame.
            try {
                await rxtx.frameTransmit(frameAnswer);
            } catch(error) {
                syncLocalQueryStateBits.post(
                    SIGBITMASK_TR_COMPLETE_WITH_ERROR, 
                    EventFlags.POST_FLAG_SET
                );
            }

            //  Mark the completion flag.
            syncLocalQueryStateBits.post(
                SIGBITMASK_TR_COMPLETE, 
                EventFlags.POST_FLAG_SET
            );

            //  Clean up.
            syncLocalRx.unfullfill();
        }

        //  Wait for the transceiver to be closed.
        {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = rxtx.wait(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                return;
            } else if (wh == wh2) {
                if (!rxtx.isClosed()) {
                    rxtx.close(true);
                    await rxtx.wait();
                }
                return;
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
        //  Close the transceiver.
        if (!rxtx.isClosed()) {
            rxtx.close(true);
        }

        //  Mark the closed flag.
        syncClosed.fullfill();
    });
}

/**
 *  Modbus RTU slave transport factory.
 * 
 *  @constructor
 *  @extends {IMBSlaveTransportFactory}
 */
function MBRtuSlaveTransportFactory() {
    //  Let parent class initialize.
    IMBSlaveTransportFactory.call(this);

    //
    //  Public methods.
    //

    /**
     *  Get the name of the transport.
     * 
     *  @returns {String}
     *    - The name.
     */
    this.getName = function() {
        return "serial/rtu";
    };

    /**
     *  Create a transport instance.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBConfigurationError}
     *    - Bad transport configuration.
     *  @throws {MBCommunicationError}
     *    - Communication error.
     *  @param {Object} configdict 
     *    - The transport configuration dictionary.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<IMBSlaveTransport>}
     *    - The promise object (resolves with the transport object if succeed, 
     *      rejects if error occurred).
     */
    this.create = async function(
        configdict, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //
        //  Stage 1: Read/parse the configuration dictionary.
        //
        let portPath = null;
        let portDriver = null;
        let portOptions = null;
        let portCharTimeScale = null;
        try {
            //  Wrap the configuration.
            let root = XRTLibTraverse.WrapObject(configdict, false)
                                     .notNull()
                                     .typeOf(Object);

            //  Read device settings.
            let devRoot = root.sub("device")
                              .notNull()
                              .typeOf(Object);
            let devDriverName = devRoot.optionalSub(
                "driver", 
                MBGenericSerialPortDriver.DRIVER_NAME
            ).string().unwrap();
            portPath = devRoot.sub("path")
                              .notNull()
                              .string()
                              .unwrap();
            let devBaudrate = devRoot.sub("baudrate")
                                     .notNull()
                                     .integer()
                                     .min(1)
                                     .unwrap();
            let devDataBits = devRoot.optionalSub("data-bits", MBSL_DATABIT_7)
                                     .integer()
                                     .oneOf([MBSL_DATABIT_7, MBSL_DATABIT_8])
                                     .unwrap();
            let devParity = devRoot.optionalSub(
                "parity", 
                "even"
            ).selectFromObject({
                "none": MBSL_PARITY_NONE,
                "even": MBSL_PARITY_EVEN,
                "odd": MBSL_PARITY_ODD
            }).unwrap();
            let devStopBits = devRoot.optionalSub("stop-bits", MBSL_STOPBIT_1)
                                     .integer()
                                     .oneOf([MBSL_STOPBIT_1, MBSL_STOPBIT_2])
                                     .unwrap();

            //  Get timing settings.
            let timingRoot = root.optionalSub("timing", {})
                                 .notNull()
                                 .typeOf(Object);
            portCharTimeScale = timingRoot.optionalSub("scale", CHRTMSCL_DFLT)
                                          .notNull()
                                          .integer()
                                          .range(CHRTMSCL_MIN, CHRTMSCL_MAX)
                                          .unwrap();

            //  Build serial port options.
            portOptions = new MBSerialPortOption(
                devBaudrate, 
                devDataBits, 
                devStopBits, 
                devParity
            );

            //  Find the driver.
            portDriver = MBSerialPortDriverRegistry.GetGlobal()
                                                   .getDriver(devDriverName);
            if (portDriver === null) {
                throw new MBConfigurationError(Util.format(
                    "No such driver (name=\"%s\").",
                    devDriverName
                ));
            }
        } catch(error) {
            // if (error instanceof MBConfigurationError) {
            //     throw error;
            // }
            throw new MBConfigurationError(error.message || "Unknown error.");
        }

        //
        //  Open serial port.
        //
        let port = null;
        try {
            port = await portDriver.open(portPath, portOptions);
        } catch(error) {
            throw new MBCommunicationError(Util.format(
                "Failed to open device (error=\"%s\").",
                error.message || "Unknown error."
            ))
        }

        //  Create the slave transport.
        let rxtxopt = new MBRtuTransceiverOption();
        rxtxopt.setCharTimeScale(portCharTimeScale);
        return new MBRtuSlaveTransport(
            new MBRtuTransceiver(port, rxtxopt),
            new MBRtuSlaveTransportOption()
        );
    };
}

//
//  Inheritances.
//
Util.inherits(MBRtuSlaveTransaction, IMBSlaveTransaction);
Util.inherits(MBRtuSlaveTransport, IMBSlaveTransport);
Util.inherits(MBRtuSlaveTransportFactory, IMBSlaveTransportFactory);

//  Export public APIs.
module.exports = {
    "MBRtuSlaveTransport": MBRtuSlaveTransport,
    "MBRtuSlaveTransportFactory": MBRtuSlaveTransportFactory
};