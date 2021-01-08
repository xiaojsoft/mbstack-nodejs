//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspTcpMasterConnection = require("./tcpmaster-connection");
const MbTspTcpTransaction = require("./../tcp-transaction");
const MbTspTcpTransceiver = require("./../tcp-transceiver");
const MbError = require("./../../../../error");
const XRTLibAsync = require("xrtlibrary-async");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const XRTLibTCPUtilities = require("xrtlibrary-tcputilities");
const Util = require("util");

//  Imported classes.
const MBTCPMasterConnection = 
    MbTspTcpMasterConnection.MBTCPMasterConnection;
const MBTCPTransactionManager = 
    MbTspTcpTransaction.MBTCPTransactionManager;
const MBTCPTransceiver = 
    MbTspTcpTransceiver.MBTCPTransceiver;
const MBTCPTransceiverOption = 
    MbTspTcpTransceiver.MBTCPTransceiverOption;
const MBError = 
    MbError.MBError;
const MBBugError = 
    MbError.MBBugError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBParameterError = 
    MbError.MBParameterError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const EventFlags = 
    XRTLibAsync.Synchronize.Event.EventFlags;
const TCPConnection = 
    XRTLibTCPUtilities.TCPConnection;
const TCPConnectOption = 
    XRTLibTCPUtilities.Client.TCPConnectOption;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const CreateTimeoutPromiseEx = 
    XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromiseEx;
const TCPConnect = 
    XRTLibTCPUtilities.Client.TCPConnect;

//
//  Constants.
//

//  Signal bit masks (event group 1).
const SIGBITMASK_WANTED = 0x01;
const SIGBITMASK_READY  = 0x02;

//  Signal bit masks (event group 2).
const SIGBITMASK_TCPOPENED    = 0x01;
const SIGBITMASK_TCPERROR     = 0x02

//  Default values.
const DFLT_ESTABLISH_TIMEOUT = 6 * 1000;
const DFLT_IDLE_TIMEOUT = 30 * 1000;
const DFLT_RETRY_TIMEOUT = 1 * 1000;
const DFLT_MAX_PARALLEL = 65536;

//  States.
const STATE_DISCONNECTED = 0;
const STATE_CONNECTING = 1;
const STATE_CONNECTED = 2;
const STATE_RETRY = 3;
const STATE_CLOSING = 4;
const STATE_CLOSED = -1;

//
//  Classes
//

/**
 *  Modbus TCP master connection manager options.
 * 
 *  @constructor
 */
function MBTCPMasterConnectionManagerOption() {
    //
    //  Members.
    //

    //  Timeout values.
    let timeoutEstablish = DFLT_ESTABLISH_TIMEOUT;
    let timeoutIdle = DFLT_IDLE_TIMEOUT;
    let timeoutRetry = DFLT_RETRY_TIMEOUT;

    //  Maximum parallel transactions per connection.
    let nMaxParallel = DFLT_MAX_PARALLEL;

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
     *    [1] The count of maximum parallel transactions should between 1 and 
     *        65536.
     * 
     *  @throws {MBParameterError}
     *    - The maximum transactions count is invalid.
     *  @param {Number} value 
     *    - The count.
     */
    this.setMaxParallelTransactions = function(value) {
        if (!(Number.isInteger(value) && value >= 1 && value <= 65536)) {
            throw new MBParameterError(
                "Invalid maximum parallel transactions count."
            );
        }
        nMaxParallel = value;
    };

    /**
     *  Get the establish timeout.
     * 
     *  @return {Number}
     *    - The establish timeout (unit: milliseconds).
     */
    this.getEstablishTimeout = function() {
        return timeoutEstablish;
    };

    /**
     *  Set the establish timeout.
     * 
     *  Note(s):
     *    [1] The timeout value must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - The timeout is invalid.
     *  @param {Number} millis 
     *    - The establish timeout (unit: milliseconds).
     */
    this.setEstablishTimeout = function(millis) {
        if ((!Number.isInteger(millis)) || millis <= 0) {
            throw new MBParameterError("Invalid timeout.");
        }
        timeoutEstablish = millis;  
    };

    /**
     *  Get the idle timeout.
     * 
     *  @return {Number}
     *    - The idle timeout (unit: milliseconds).
     */
    this.getIdleTimeout = function() {
        return timeoutIdle;
    };

    /**
     *  Set the idle timeout.
     * 
     *  Note(s):
     *    [1] The timeout value must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - The timeout is invalid.
     *  @param {Number} millis 
     *    - The idle timeout (unit: milliseconds).
     */
    this.setIdleTimeout = function(millis) {
        if ((!Number.isInteger(millis)) || millis <= 0) {
            throw new MBParameterError("Invalid timeout.");
        }
        timeoutIdle = millis;
    };

    /**
     *  Get the retry timeout.
     * 
     *  @return {Number}
     *    - The retry timeout (unit: milliseconds).
     */
    this.getRetryTimeout = function() {
        return timeoutRetry;
    };

    /**
     *  Set the retry timeout.
     * 
     *  Note(s):
     *    [1] The timeout value must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - The timeout is invalid.
     *  @param {Number} millis 
     *    - The retry timeout (unit: milliseconds).
     */
    this.setRetryTimeout = function(millis) {
        if ((!Number.isInteger(millis)) || millis <= 0) {
            throw new MBParameterError("Invalid timeout.");
        }
        timeoutRetry = millis;
    };
}

/**
 *  Modbus TCP master connection manager.
 * 
 *  @constructor
 *  @param {String} slaveHost 
 *    - The host of the Modbus TCP slave endpoint.
 *  @param {Number} slavePort 
 *    - The port of the Modbus TCP slave endpoint.
 *  @param {MBTCPMasterConnectionManagerOption} options 
 *    - The options.
 */
function MBTCPMasterConnectionManager(
    slaveHost, 
    slavePort, 
    options = new MBTCPMasterConnectionManagerOption()
) {
    //
    //  Members.
    //

    // //  Self reference.
    // let self = this;

    //  Timeout values.
    let timeoutEstablish = options.getEstablishTimeout();
    let timeoutIdle = options.getIdleTimeout();
    let timeoutRetry = options.getRetryTimeout();

    //  Maximum parallel transactions.
    let nMaxParallel = options.getMaxParallelTransactions();

    //  Active connection.
    let acRxTx = null;
    let acTrMgr = null;
    let ac = null;

    //  Signals.
    let bitEvents = new EventFlags(0x00);
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Get an active master connection.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<?MBTCPMasterConnection>}
     *    - The promise object (resolves with the master connection if succeed, 
     *      resolves with NULL if the manager was closed and no active 
     *      connection could be created anymore, rejects if error occurred).
     */
    this.get = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        while (true) {
            //  Return the active connection if "READY" flag is set.
            if ((bitEvents.value & SIGBITMASK_READY) != 0) {
                return ac;
            }

            //  Mark the "WANTED" flag.
            bitEvents.post(SIGBITMASK_WANTED, EventFlags.POST_FLAG_SET);

            //  Wait for "READY" flag to be set.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = bitEvents.pend(
                    SIGBITMASK_READY, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let wh2 = cancellator.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    continue;
                } else if (wh == wh2) {
                    throw new MBOperationCancelledError(
                        "The cancellator was activated."
                    );
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
        }
    };
    
    /**
     *  Wait for the manager to be closed.
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
     *  Get whether the manager was already closed.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        return syncClosed.isFullfilled();
    };

    /**
     *  Close the manager.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The manager was already closed.
     *  @param {Boolean} [forcibly] 
     *    - True if the manager should be closed forcibly.
     */
    this.close = function(forcibly = false) {
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError("Already closed.");
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
        /*
         *  State diagram:
         *
         *         +--------------+  P(WANTED)  +--------------+
         *  -----> | DISCONNECTED | ----------> |  CONNECTING  |
         *         +--------------+             +--------------+
         *            ^        ^                  |          |
         *            |        |     +-------+    |          |
         *            |        +---- | RETRY | <--+          |
         *            |      TIMEOUT +-------+ P(TCP_ERROR)  | P(TCP_OPENED)
         *            |                                      V
         *            |                          +-------------+
         *            +------------------------- |  CONNECTED  |
         *                        P(TCP_CLOSED)  +-------------+
         *                                         ^         |
         *                                         |         |
         *                                         +---------+
         *                                          P(WANTED)
         * 
         *  Note(s) about the state diagram:
         *    [1] "CLOSING" and "CLOSED" state was ignored intentionally to make
         *        the diagram simple.
         *    [2] P([SIGNAL]) means the positive edge of the signal.
         *    [3] Signal names might be slightly different from what you see in 
         *        the actual code.
         * 
         */

        //  Initialize the state machine.
        let state = STATE_DISCONNECTED;

        //  Initialize TCP connection establishment context.
        /**
         *  @type {?TCPConnection}
         */
        let tcpConnection = null;
        let tcpError = null;
        let tcpEvents = new EventFlags(0x00);
        let syncLocalTcpCancelled = new ConditionalSynchronizer();

        //  Run the state machine.
        while(true) {
            if (state == STATE_DISCONNECTED) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = bitEvents.pend(
                    SIGBITMASK_WANTED, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  New connection.
                    let clientOpt = new TCPConnectOption(
                        slaveHost, 
                        slavePort
                    );
                    clientOpt.setConnectTimeout(timeoutEstablish);
                    clientOpt.setIdleTimeout(timeoutIdle);
                    clientOpt.setHalfOpen(false);
                    tcpEvents.value = 0x00;
                    syncLocalTcpCancelled.unfullfill();
                    TCPConnect(
                        clientOpt, 
                        syncLocalTcpCancelled
                    ).then(function(conn) {
                        //  Store the connection.
                        tcpConnection = conn;

                        //  Configure TCP options.
                        try {
                            conn.setKeepalive(true, 0);
                            conn.setNoDelay(true);
                        } catch(error) {
                            //  Ignore this error.
                        }

                        //  Set the "TCP_OPENED" bit.
                        tcpEvents.post(
                            SIGBITMASK_TCPOPENED, 
                            EventFlags.POST_FLAG_SET
                        );
                    }).catch(function(error) {
                        //  Store the error.
                        tcpError = error;

                        //  Set the "TCP_ERROR" bit.
                        tcpEvents.post(
                            SIGBITMASK_TCPERROR, 
                            EventFlags.POST_FLAG_SET
                        );
                    });

                    //  Go to "CONNECTING" state.
                    state = STATE_CONNECTING;
                } else if (wh == wh2 || wh == wh3) {
                    //  Go to "CLOSED" state.
                    state = STATE_CLOSED;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_CONNECTING) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = tcpEvents.pend(
                    SIGBITMASK_TCPOPENED, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let wh2 = tcpEvents.pend(
                    SIGBITMASK_TCPERROR, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let wh3 = syncCmdClose.waitWithCancellator(cts);
                let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Create active connection context.
                    acTrMgr = new MBTCPTransactionManager(nMaxParallel);
                    acRxTx = new MBTCPTransceiver(
                        tcpConnection, 
                        new MBTCPTransceiverOption(), 
                        true
                    );
                    ac = new MBTCPMasterConnection(acRxTx, acTrMgr);

                    //  Cleanup the TCP connection establishment context.
                    tcpEvents.value = 0x00;
                    tcpConnection = null;
                    tcpError = null;
                    syncLocalTcpCancelled.unfullfill();

                    //  Set the "READY" bit.
                    bitEvents.post(SIGBITMASK_READY, EventFlags.POST_FLAG_SET);

                    //  Go to "CONNECTED" state.
                    state = STATE_CONNECTED;
                } else if (wh == wh2) {
                    //  Cleanup the TCP connection establishment context.
                    tcpEvents.value = 0x00;
                    tcpConnection = null;
                    tcpError = null;
                    syncLocalTcpCancelled.unfullfill();

                    //  Go to "RETRY" state.
                    state = STATE_RETRY;
                } else if (wh == wh3 || wh == wh4) {
                    //  Cancel establishing the TCP connection and wait.
                    syncLocalTcpCancelled.fullfill();
                    await tcpEvents.pend(
                        (SIGBITMASK_TCPOPENED | SIGBITMASK_TCPERROR), 
                        EventFlags.PEND_FLAG_SET_ANY
                    );
                    if (tcpConnection !== null && !tcpConnection.isClosed()) {
                        tcpConnection.close(true);
                        await tcpConnection.whenClosed();
                    }

                    //  Cleanup the TCP connection establishment context.
                    tcpEvents.value = 0x00;
                    tcpConnection = null;
                    tcpError = null;
                    syncLocalTcpCancelled.unfullfill();

                    //  Go to "CLOSED" state.
                    state = STATE_CLOSED;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_CONNECTED) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = acRxTx.wait(cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let wh4 = bitEvents.pend(
                    SIGBITMASK_WANTED, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Clear the active connection context.
                    ac = null;
                    acRxTx = null;
                    acTrMgr = null;

                    //  Unset the "READY" bit.
                    bitEvents.post(SIGBITMASK_READY, EventFlags.POST_FLAG_CLR);

                    //  Go to "DISCONNECTED" state.
                    state = STATE_DISCONNECTED;
                } else if (wh == wh2) {
                    //  Close the active connection gracefully.
                    if (!acRxTx.isClosed()) {
                        acRxTx.close();
                    }

                    //  Go to "CLOSING" state.
                    state = STATE_CLOSING;
                } else if (wh == wh3) {
                    //  Terminate the active connection and wait.
                    if (!acRxTx.isClosed()) {
                        acRxTx.close(true);
                        await acRxTx.wait();
                    }

                    //  Go to "CLOSED" state.
                    state = STATE_CLOSED;
                } else if (wh == wh4) {
                    //  Unset the "WANTED" bit.
                    bitEvents.post(SIGBITMASK_WANTED, EventFlags.POST_FLAG_CLR);

                    //  No state change is needed under this condition.
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_RETRY) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = CreateTimeoutPromiseEx(timeoutRetry, cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Go to "DISCONNECTED" state.
                    state = STATE_DISCONNECTED;
                } else if (wh == wh2 || wh == wh3) {
                    //  Go to "CLOSED" state.
                    state = STATE_CLOSED;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_CLOSING) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = acRxTx.wait(cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Go to "CLOSED" state.
                    state = STATE_CLOSED;
                } else if (wh == wh2) {
                    //  Terminate the active connection and wait.
                    if (!acRxTx.isClosed()) {
                        acRxTx.close(true);
                        await acRxTx.wait();
                    }

                    //  Go to "CLOSED" state.
                    state = STATE_CLOSED;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_CLOSED) {
                //  Clear active connection context and set the "READY" bit 
                //  forever.
                ac = null;
                acRxTx = null;
                acTrMgr = null;
                bitEvents.post(SIGBITMASK_READY, EventFlags.POST_FLAG_SET);

                break;
            } else {
                ReportBug("Invalid state.", true, MBBugError);
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        //  Set the closed signal.
        syncClosed.fullfill();

        //  Fatal ensurance.
        if (acRxTx !== null && !acRxTx.isClosed()) {
            acRxTx.close(true);
            ac = null;
            acRxTx = null;
            acTrMgr = null;
            bitEvents.post(SIGBITMASK_READY, EventFlags.POST_FLAG_SET);
        }
    });
}

//  Export public APIs.
module.exports = {
    "MBTCPMasterConnectionManagerOption": MBTCPMasterConnectionManagerOption, 
    "MBTCPMasterConnectionManager": MBTCPMasterConnectionManager
};