//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspTcpConstants = require("./../tcp-constants");
const MbTspTcpFrame = require("./../tcp-frame");
const MbTspTcpTransceiver = require("./../tcp-transceiver");
const MbTspCore = require("./../../core");
const MbError = require("./../../../../error");
const XRTLibAsync = require("xrtlibrary-async");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const XRTLibTCPUtilities = require("xrtlibrary-tcputilities");
const XRTLibTraverse = require("xrtlibrary-traverse");
const Util = require("util");

//  Imported classes.
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
const MBTCPTransceiverOption = 
    MbTspTcpTransceiver.MBTCPTransceiverOption;
const MBTCPTransceiver = 
    MbTspTcpTransceiver.MBTCPTransceiver;
const MBTCPFrame = 
    MbTspTcpFrame.MBTCPFrame;
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
const TCPError = 
    XRTLibTCPUtilities.Error.TCPError;
const TCPListenOption = 
    XRTLibTCPUtilities.Server.TCPListenOption;
const TCPServerOption = 
    XRTLibTCPUtilities.Server.TCPServerOption;
const TCPServer = 
    XRTLibTCPUtilities.Server.TCPServer;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;

//  Imported constants.
const TRANSPORT_NAME = 
    MbTspTcpConstants.TRANSPORT_NAME;
const MBAP_PROTOID_MODBUS = 
    MbTspTcpConstants.MBAP_PROTOID_MODBUS;

//
//  Constants.
//

//  Default values.
const DFLT_TCPIDLE_TIMEOUT = 30 * 1000;
const DFLT_MAXPARALLEL = 1024;

//  Signal bit masks (group 1).
const SIGBITMASK_TR_CANCELLED = 0x01;
const SIGBITMASK_TR_COMPLETE  = 0x02;
const SIGBITMASK_TR_COMPLETE_WITH_ERROR = 0x04;

//
//  Classes.
//

/**
 *  Modbus TCP slave transaction.
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
function MBTCPSlaveTransaction(
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
 *  Modbus TCP slave transport options.
 * 
 *  @constructor
 */
function MBTCPSlaveTransportOption() {
    //
    //  Members.
    //

    //  Timeout values.
    let timeoutTcpIdle = DFLT_TCPIDLE_TIMEOUT;

    //  Maximum parallel transactions per connection.
    let nMaxParallel = DFLT_MAXPARALLEL;

    //
    //  Public methods.
    //

    /**
     *  Get the count of maximum parallel transactions.
     * 
     *  @returns {Number}
     *    - The count.
     */
    this.getMaxParallelTransactions = function() {
        return nMaxParallel;
    };

    /**
     *  Set the count of maximum parallel transactions.
     * 
     *  Note(s):
     *    [1] The count of maximum parallel transactions should between 
     *        positive.
     * 
     *  @throws {MBParameterError}
     *    - The maximum transactions count is invalid.
     *  @param {Number} value 
     *    - The count.
     */
    this.setMaxParallelTransactions = function(value) {
        if (!(Number.isInteger(value) && value >= 1)) {
            throw new MBParameterError(
                "Invalid maximum parallel transactions count."
            );
        }
        nMaxParallel = value;
    };

    /**
     *  Get the TCP idle timeout.
     * 
     *  @return {Number}
     *    - The TCP idle timeout (unit: milliseconds).
     */
    this.getIdleTimeout = function() {
        return timeoutTcpIdle;
    };

    /**
     *  Set the TCP idle timeout.
     * 
     *  Note(s):
     *    [1] The timeout value must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - The timeout is invalid.
     *  @param {Number} millis 
     *    - The TCP idle timeout (unit: milliseconds).
     */
    this.setIdleTimeout = function(millis) {
        if ((!Number.isInteger(millis)) || millis <= 0) {
            throw new MBParameterError("Invalid timeout.");
        }
        timeoutTcpIdle = millis;
    };
}

/**
 *  Modbus TCP slave transport.
 * 
 *  @constructor
 *  @extends {IMBSlaveTransport}
 *  @param {String} serverBindAddress 
 *    - The server bind address.
 *  @param {Number} serverBindPort 
 *    - The server bind port.
 *  @param {TCPServer} server 
 *    - The server object.
 *  @param {MBTCPSlaveTransportOption} options 
 *    - The transport options.
 */
function MBTCPSlaveTransport(
    serverBindAddress, 
    serverBindPort, 
    server, 
    options = new MBTCPSlaveTransportOption()
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
    let semPendingTransactionsToken = 
        new SemaphoreSynchronizer(options.getMaxParallelTransactions());
    let semPendingTransactionsItems = 
        new SemaphoreSynchronizer(0);

    //
    //  Private methods.
    //

    /**
     *  Handle connection.
     * 
     *  Note(s):
     *    [1] This function generally does not throw an exception.
     * 
     *  @param {MBTCPTransceiver} rxtx 
     *    - The transceiver.
     *  @returns {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred).
     */
    async function _HandleConnection(rxtx) {
        while(true) {
            //  Receive one query frame.
            let queryFrame = null;
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = rxtx.frameReceive(cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    /**
                     *  @type {?MBTCPFrame}
                     */
                    queryFrame = rsv.getValue();
                    if (queryFrame === null) {
                        break;
                    }
                } else {
                    //  Wait for the frame receive wait handler to be settled.
                    try {
                        await wh1;
                    } catch(error) {
                        //  Do nothing.
                    }

                    //  Handle other signals.
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
                        break;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }

            //  Skip if the query frame is not a Modbus frame.
            if (queryFrame.getProtocolID() != MBAP_PROTOID_MODBUS) {
                continue;
            }

            //  Skip if the length of the query frame is too short (short than 8
            //  bytes means that this frame is corrupted, currently we just 
            //  simply drop it).
            let queryProtocolPayload = queryFrame.getProtocolPayload();
            if (queryProtocolPayload.length < 2) {
                continue;
            }

            //  Skip if the length of the query frame is too long (longer than 
            //  260 bytes means that this frame may be corrupted, currently we 
            //  just simply drop it).
            if (queryProtocolPayload.length > 254) {
                continue;
            }

            //  Parse the query frame.
            let queryTransactionID = queryFrame.getTransactionID();
            let queryUnitID = queryProtocolPayload.readUInt8(0);
            let queryFunctionCode = queryProtocolPayload.readUInt8(1);
            let queryData = queryProtocolPayload.slice(2);
            
            //  Create transaction coroutine.
            let transactionCrt = (function(
                _queryTransactionID, 
                _queryUnitID, 
                _queryFunctionCode, 
                _queryData
            ) {
                return async function() {
                    //  Get a token to pend on a transaction.
                    {
                        let cts = new ConditionalSynchronizer();
                        let wh1 = semPendingTransactionsToken.wait(cts);
                        let wh2 = syncCmdClose.waitWithCancellator(cts);
                        let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                        let rsv = await CreatePreemptivePromise([
                            wh1, wh2, wh3
                        ]);
                        cts.fullfill();
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

                            if (wh == wh2 || wh == wh3) {
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

                    //  Create local synchronizers.
                    let syncLocalQueryAnswered = new ConditionalSynchronizer();
                    let syncLocalQueryIgnored = new ConditionalSynchronizer();
                    let syncLocalQueryStateBits = new EventFlags(0x00);

                    //  Build transaction object.
                    let transaction = new MBTCPSlaveTransaction(
                        new MBTransportQuery(
                            _queryUnitID, 
                            _queryFunctionCode, 
                            _queryData
                        ),
                        syncLocalQueryStateBits,
                        function(ans) {
                            syncLocalQueryAnswered.fullfill(ans);
                        },
                        function() {
                            syncLocalQueryIgnored.fullfill();
                        }
                    );
                    
                    //  Append the transaction object to pending transaction 
                    //  list.
                    pendingTransactions.push(transaction);
                    semPendingTransactionsItems.signal();

                    //  Wait for answer.
                    let answer = null;
                    {
                        let cts = new ConditionalSynchronizer();
                        let wh1 = 
                            syncLocalQueryAnswered.waitWithCancellator(cts);
                        let wh2 = 
                            syncLocalQueryIgnored.waitWithCancellator(cts);
                        let wh3 = 
                            syncCmdClose.waitWithCancellator(cts);
                        let wh4 = 
                            syncCmdTerminate.waitWithCancellator(cts);
                        let rsv = await CreatePreemptivePromise([
                            wh1, wh2, wh3, wh4
                        ]);
                        cts.fullfill();
                        let wh = rsv.getPromiseObject();
                        if (wh == wh1) {
                            answer = rsv.getValue();
                        } else if (wh == wh2) {
                            syncLocalQueryStateBits.post(
                                SIGBITMASK_TR_COMPLETE,
                                EventFlags.POST_FLAG_SET
                            );
                            return;
                        } else if (wh == wh3 || wh == wh4) {
                            syncLocalQueryStateBits.post(
                                (
                                    SIGBITMASK_TR_CANCELLED | 
                                    SIGBITMASK_TR_COMPLETE
                                ), 
                                EventFlags.POST_FLAG_SET
                            );
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
                    let ansFunctionCode = answer.getFunctionCode();
                    let ansData = answer.getData();
                    let ansProtocolPayload = Buffer.allocUnsafe(
                        2 + ansData.length
                    );
                    ansProtocolPayload.writeUInt8(_queryUnitID, 0);
                    ansProtocolPayload.writeUInt8(ansFunctionCode, 1);
                    ansData.copy(ansProtocolPayload, 2);
                    let ansFrame = new MBTCPFrame(
                        _queryTransactionID, 
                        MBAP_PROTOID_MODBUS, 
                        ansProtocolPayload
                    );

                    //  Transmit the response frame.
                    try {
                        await rxtx.frameTransmit(ansFrame);
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
                };
            })(queryTransactionID, queryUnitID, queryFunctionCode, queryData);

            //  Start the transaction coroutine.
            transactionCrt().catch(function(error) {
                ReportBug(Util.format(
                    "Transaction coroutine throw an exception (error=\"%s\").",
                    error.message || "Unknown error."
                ));
            });
        }

        //  Wait for the transceiver to be closed or the termination signal.
        if (!rxtx.isClosed()) {
            let cts = new ConditionalSynchronizer();
            let wh1 = rxtx.wait(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                return;
            } else if (wh == wh2) {
                if (!rxtx.isClosed()) {
                    rxtx.close(true);
                    await rxtx.wait();
                }
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    }

    //
    //  Public methods.
    //

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

    //  TCP connection acceptor coroutine.
    let syncCrtAcceptorExited = new ConditionalSynchronizer();
    (async function() {
        try {
            while(true) {
                let connection = await server.accept();
                let rxtxopt = new MBTCPTransceiverOption();
                rxtxopt.setRxFrameQueueSize(1);
                rxtxopt.setTxFrameQueueSize(1);
                let rxtx = new MBTCPTransceiver(connection, rxtxopt, false);
                _HandleConnection(rxtx).catch(function(error) {
                    ReportBug(Util.format(
                        "Connection coroutine throw an exception (error=\"%s\").",
                        error.message || "Unknown error."
                    ), false, MBBugError);
                }).finally(function() {
                    if (!rxtx.isClosed()) {
                        rxtx.close(true);
                    }
                });
            }
        } catch(error) {
            if (error instanceof TCPError) {
                return;
            }
            throw error;
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Acceptor coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        syncCrtAcceptorExited.fullfill();
    });

    //  TCP server coroutine.
    let syncCrtServerExited = new ConditionalSynchronizer();
    (async function() {
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = server.whenClosed(cts);
            let wh2 = syncCmdClose.waitWithCancellator(cts);
            let wh3 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                return;
            } else if (wh == wh2) {
                if (!server.isClosed()) {
                    server.close(false);
                }
            } else if (wh == wh3) {
                if (!server.isClosed()) {
                    server.close(true);
                    await server.whenClosed();
                }
                return;
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

        {
            let cts = new ConditionalSynchronizer();
            let wh1 = server.whenClosed(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Do nothing.
            } else if (wh == wh2) {
                if (!server.isClosed()) {
                    server.close(true);
                    await server.whenClosed();
                }
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Server coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        // syncClosed.fullfill();
        syncCrtServerExited.fullfill();
        if (!server.isClosed()) {
            server.close(true);
        }
    });

    //  Main coroutine.
    (async function() {
        await syncCrtAcceptorExited.wait();
        await syncCrtServerExited.wait();
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        syncClosed.fullfill();
    });
}

/**
 *  Modbus TCP slave transport factory.
 * 
 *  @constructor
 *  @extends {IMBSlaveTransportFactory}
 */
function MBTCPSlaveTransportFactory() {
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
        return TRANSPORT_NAME;
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
        let srvOpt = null;
        let srvListenOpt = null;
        let transportOpt = null;
        try {
            //  Wrap the configuration.
            let root = XRTLibTraverse.WrapObject(configdict, false)
                                     .notNull()
                                     .typeOf(Object);

            //  Get the bind endpoint.
            let bindRoot = root.optionalSub("bind", {})
                               .notNull()
                               .typeOf(Object);
            let bindAddress = bindRoot.optionalSub("address", "0.0.0.0")
                                      .notNull()
                                      .string()
                                      .unwrap();
            let bindPort = bindRoot.optionalSub("port", 502)
                                   .notNull()
                                   .integer()
                                   .range(0, 65535)
                                   .unwrap();

            //  Get server settings.
            let exclusive = root.optionalSub("exclusive", false)
                                .notNull()
                                .boolean()
                                .unwrap();
            let dualstack = root.optionalSub("dualstack", true)
                                .notNull()
                                .boolean()
                                .unwrap();
            let maxConnections = root.optionalSub("max-connections", null)
                                     .integer()
                                     .min(1)
                                     .unwrap();

            //  Get parallel settings.
            let parallel = root.optionalSub("parallel", DFLT_MAXPARALLEL)
                               .notNull()
                               .integer()
                               .min(1)
                               .unwrap();

            //  Get timeout settings.
            let timeoutRoot = root.optionalSub("timeout", {})
                                  .notNull()
                                  .typeOf(Object);
            let timeoutIdle = timeoutRoot.optionalSub(
                "idle", 
                DFLT_TCPIDLE_TIMEOUT
            ).notNull().integer().min(1).unwrap();

            //  Build TCP server option.
            srvOpt = new TCPServerOption();
            srvOpt.setHalfOpen(false);
            srvOpt.setMaxConnectionLimit(maxConnections);

            //  Build TCP server listen option.
            srvListenOpt = new TCPListenOption(bindAddress, bindPort);
            srvListenOpt.setPortExclusive(exclusive);
            srvListenOpt.setDualStack(dualstack);

            //  Build transport option.
            transportOpt = new MBTCPSlaveTransportOption();
            transportOpt.setIdleTimeout(timeoutIdle);
            transportOpt.setMaxParallelTransactions(parallel);
        } catch(error) {
            // if (error instanceof MBConfigurationError) {
            //     throw error;
            // }
            throw new MBConfigurationError(error.message || "Unknown error.");
        }

        //
        //  Stage 2: Create TCP server.
        //

        //  Create server.
        let srv = new TCPServer(srvOpt);

        //  Bind on specified endpoint.
        //
        //  Note(s):
        //    [1] This shall be relatively fast and there is no need to use 
        //        cancellable token.
        let srvListenEndpoint = null;
        try {
            srvListenEndpoint = await srv.listen(srvListenOpt);
        } catch(error) {
            if (!srv.isClosed()) {
                srv.close(true);
            }
            throw new MBCommunicationError(Util.format(
                "Unable to bind TCP server (error=\"%s\").",
                error.message || "Unknown error."
            ));
        }

        //  Create the slave transport.
        return new MBTCPSlaveTransport(
            srvListenEndpoint.address,
            srvListenEndpoint.port,
            srv,
            transportOpt
        );
    };
}

//
//  Inheritances.
//
Util.inherits(MBTCPSlaveTransaction, IMBSlaveTransaction);
Util.inherits(MBTCPSlaveTransport, IMBSlaveTransport);
Util.inherits(MBTCPSlaveTransportFactory, IMBSlaveTransportFactory);

//  Export public APIs.
module.exports = {
    "MBTCPSlaveTransport": MBTCPSlaveTransport,
    "MBTCPSlaveTransportFactory": MBTCPSlaveTransportFactory
};