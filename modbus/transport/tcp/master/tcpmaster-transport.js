//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspTcpMasterConnection = 
    require("./tcpmaster-connection");
const MbTspTcpMasterConnectionMgr = 
    require("./tcpmaster-connectionmgr");
const MbTspTcpConstants = 
    require("./../tcp-constants");
const MbTspTcpFrame = 
    require("./../tcp-frame");
const MbTspCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const XRTLibTraverse = 
    require("xrtlibrary-traverse");
const Util = 
    require("util");

//  Imported classes.
const MBTCPFrame = 
    MbTspTcpFrame.MBTCPFrame;
const MBTransportQuery = 
    MbTspCore.MBTransportQuery;
const MBTransportAnswer = 
    MbTspCore.MBTransportAnswer;
const MBTCPMasterConnection = 
    MbTspTcpMasterConnection.MBTCPMasterConnection;
const MBTCPMasterConnectionManager = 
    MbTspTcpMasterConnectionMgr.MBTCPMasterConnectionManager;
const MBTCPMasterConnectionManagerOption = 
    MbTspTcpMasterConnectionMgr.MBTCPMasterConnectionManagerOption;
const IMBMasterTransport = 
    MbTspCore.IMBMasterTransport;
const IMBMasterTransportFactory = 
    MbTspCore.IMBMasterTransportFactory;
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
const PreemptReject = 
    XRTLibAsync.Asynchronize.Preempt.PreemptReject;

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
const DFLT_TCPESTABLISH_TIMEOUT = 6 * 1000;
const DFLT_TCPIDLE_TIMEOUT = 30 * 1000;
const DFLT_TCPRETRY_TIMEOUT = 1 * 1000;
const DFLT_MAXPARALLEL = 65536;

//  Signal bit masks (group 1).
const SIGBITMASK_RCVFRAME = 0x01;
const SIGBITMASK_EARLYCLOSE = 0x02;

//
//  Classes.
//

/**
 *  Modbus TCP master transport options.
 * 
 *  @constructor
 */
function MBTCPMasterTransportOption() {
    //
    //  Members.
    //

    //  Timeout values.
    let timeoutTcpEstablish = DFLT_TCPESTABLISH_TIMEOUT;
    let timeoutTcpIdle = DFLT_TCPIDLE_TIMEOUT;
    let timeoutTcpRetry = DFLT_TCPRETRY_TIMEOUT;

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
     *  Get the TCP establish timeout.
     * 
     *  @return {Number}
     *    - The TCP establish timeout (unit: milliseconds).
     */
    this.getEstablishTimeout = function() {
        return timeoutTcpEstablish;
    };

    /**
     *  Set the TCP establish timeout.
     * 
     *  Note(s):
     *    [1] The timeout value must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - The timeout is invalid.
     *  @param {Number} millis 
     *    - The TCP establish timeout (unit: milliseconds).
     */
    this.setEstablishTimeout = function(millis) {
        if ((!Number.isInteger(millis)) || millis <= 0) {
            throw new MBParameterError("Invalid timeout.");
        }
        timeoutTcpEstablish = millis;  
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

    /**
     *  Get the TCP retry timeout.
     * 
     *  @return {Number}
     *    - The TCP retry timeout (unit: milliseconds).
     */
    this.getRetryTimeout = function() {
        return timeoutTcpRetry;
    };

    /**
     *  Set the TCP retry timeout.
     * 
     *  Note(s):
     *    [1] The timeout value must be a positive integer.
     * 
     *  @throws {MBParameterError}
     *    - The timeout is invalid.
     *  @param {Number} millis 
     *    - The TCP retry timeout (unit: milliseconds).
     */
    this.setRetryTimeout = function(millis) {
        if ((!Number.isInteger(millis)) || millis <= 0) {
            throw new MBParameterError("Invalid timeout.");
        }
        timeoutTcpRetry = millis;
    };
}

/**
 *  Modbus TCP master transport.
 * 
 *  @constructor
 *  @extends {IMBMasterTransport}
 *  @param {String} slaveHost 
 *    - The host of the Modbus TCP slave endpoint.
 *  @param {Number} slavePort 
 *    - The port of the Modbus TCP slave endpoint.
 *  @param {MBTCPMasterTransportOption} options 
 *    - The options.
 */
function MBTCPMasterTransport(
    slaveHost, 
    slavePort, 
    options = new MBTCPMasterTransportOption()
) {
    //  Let parent class initialize.
    IMBMasterTransport.call(this);

    //
    //  Members.
    //

    //  Connection manager.
    let connmgrOpt = new MBTCPMasterConnectionManagerOption();
    connmgrOpt.setMaxParallelTransactions(options.getMaxParallelTransactions());
    connmgrOpt.setEstablishTimeout(options.getEstablishTimeout());
    connmgrOpt.setIdleTimeout(options.getIdleTimeout());
    connmgrOpt.setRetryTimeout(options.getRetryTimeout());
    let connmgr = new MBTCPMasterConnectionManager(
        slaveHost, 
        slavePort, 
        connmgrOpt
    );

    //  Signals.
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Query the slave.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed or is going to be closed.
     *  @throws {MBCommunicationError}
     *    - Transport-layer communication failed.
     *  @param {MBTransportQuery} query 
     *    - The query object.
     *  @param {Boolean} [noAnswer] 
     *    - True if response from the slave is not needed.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<?MBTransportAnswer>}
     *    - The promise object (resolves with the answer if succeed and 
     *      answer from the slave is needed, resolves with NULL if succeed and 
     *      answer from the slave is not needed, rejects if error occurred).
     */
    this.query = async function(
        query, 
        noAnswer = false, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Throw if the transport was already closed.
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError("Transport was already closed.");
        }

        //
        //  Stage 1: Get an active connection.
        //

        let rxtx = null;
        let trmgr = null;
        let transId = null;
        while(true) {
            //  Get one active connection.
            /**
             *  @type {?MBTCPMasterConnection}
             */
            let conn = null;
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = connmgr.get(cts);
                let wh2 = cancellator.waitWithCancellator(cts);
                let wh3 = syncCmdClose.waitWithCancellator(cts);
                let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    conn = rsv.getValue();
                    if (conn === null) {
                        let msg = null;
                        if (syncClosed.isFullfilled()) {
                            msg = "Transport was already closed.";
                        } else {
                            msg = "Transport is going to be closed.";
                        }
                        throw new MBInvalidOperationError(msg);
                    }
                } else if (wh == wh2) {
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
            rxtx = conn.getTransceiver();
            trmgr = conn.getTransactionManager();

            //  Allocate transaction ID.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = trmgr.allocate(cts);
                let wh2 = cancellator.waitWithCancellator(cts);
                let wh3 = rxtx.wait(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    transId = rsv.getValue();
                    break;
                } else {
                    //  Wait for the transaction manager wait handler to be 
                    //  settled.
                    try {
                        transId = await wh1;
                        trmgr.free(transId);
                    } catch(error) {
                        //  Do nothing.
                    }

                    if (wh == wh2) {
                        throw new MBOperationCancelledError(
                            "The cancellator was activated."
                        );
                    } else if (wh == wh3) {
                        //  The transceiver closed. We need a new one.
                        continue;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }
        }

        //
        //  Stage 2: Transmit the request frame and wait for response frame.
        //

        //  Create events.
        let bitEvents = new EventFlags(0x00);

        //  Register response frame handler.
        let blRspFrameHandlerRegistered = true;
        let frameResponse = null;

        /**
         *  Internal response frame handler.
         * 
         *  @param {MBTCPFrame} _frame 
         */
        function _RspFrameHandler(_frame) {
            if (_frame.getTransactionID() == transId) {
                frameResponse = _frame;
                blRspFrameHandlerRegistered = false;
                rxtx.off("frame", _RspFrameHandler);
                bitEvents.post(SIGBITMASK_RCVFRAME, EventFlags.POST_FLAG_SET);
            }
        }

        rxtx.on("frame", _RspFrameHandler);

        //  Register early close handler.
        let blEarlyCloseHandlerRegistered = false;

        /**
         *  Internal early close handler.
         */
        function _EarlyCloseHandler() {
            blEarlyCloseHandlerRegistered = false;
            rxtx.off("end", _EarlyCloseHandler);
            bitEvents.post(SIGBITMASK_EARLYCLOSE, EventFlags.POST_FLAG_SET);
        }

        if (!rxtx.isEnded()) {
            rxtx.on("end", _EarlyCloseHandler);
            blEarlyCloseHandlerRegistered = true;
        } else {
            bitEvents.post(SIGBITMASK_EARLYCLOSE, EventFlags.POST_FLAG_SET);
        }

        try {
            //  Build the request frame.
            let queryUnitID = query.getUnitID();
            let queryFunctionCode = query.getFunctionCode();
            let queryData = query.getData();
            let frameProtoPayload = Buffer.allocUnsafe(2 + queryData.length);
            frameProtoPayload.writeUInt8(queryUnitID, 0);
            frameProtoPayload.writeUInt8(queryFunctionCode, 1);
            queryData.copy(frameProtoPayload, 2);
            let frameRequest = new MBTCPFrame(
                transId,
                MBAP_PROTOID_MODBUS,
                frameProtoPayload
            );

            //  Transmit the request frame.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = rxtx.frameTransmit(frameRequest, cts);
                let wh2 = cancellator.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    throw error;
                } finally {
                    cts.fullfill();
                }
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Do nothing.
                } else {
                    //  Wait for the transmit wait handler to be settled.
                    try {
                        await wh1;
                    } catch(error) {
                        //  Do nothing.
                    }

                    if (wh == wh2) {
                        throw new MBOperationCancelledError(
                            "The cancellator was activated."
                        );
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }

            //  Wait for the response frame.
            if (!noAnswer) {
                let cts = new ConditionalSynchronizer();
                let wh1 = bitEvents.pend(
                    (SIGBITMASK_RCVFRAME | SIGBITMASK_EARLYCLOSE), 
                    EventFlags.PEND_FLAG_SET_ANY, 
                    cts
                );
                let wh2 = cancellator.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Throw an exception if there is no response received.
                    let signal = rsv.getValue();
                    if ((signal & SIGBITMASK_RCVFRAME) == 0) {
                        throw new MBCommunicationError("No response.");
                    }
                } else if (wh == wh2) {
                    throw new MBOperationCancelledError(
                        "The cancellator was activated."
                    );
                } else {
                    ReportBug("Invalid wait handler.");
                }

                //  Get and check the response (answer) protocol payload.
                frameProtoPayload = frameResponse.getProtocolPayload();
                if (frameProtoPayload.length < 2) {
                    throw new MBCommunicationError(
                        "Response frame is too short (< 7)."
                    );
                }
                if (frameProtoPayload.length > 254) {
                    throw new MBCommunicationError(
                        "Response frame is too long (> 260)."
                    );
                }

                //  Extract unit identifier, function code and data from the 
                //  protocol payload.
                let ansUnitID = frameProtoPayload.readUInt8(0);
                if (ansUnitID != queryUnitID) {
                    throw new MBCommunicationError(
                        "Response frame contains a mismatched unit identifier."
                    );
                }
                let ansFunctionCode = frameProtoPayload.readUInt8(1);
                let ansData = frameProtoPayload.slice(2);
                return new MBTransportAnswer(ansFunctionCode, ansData);
            }

            return null;
        } finally {
            //  Deallocate the transaction ID.
            trmgr.free(transId);

            //  Unregister the response frame handler (if needed).
            if (blRspFrameHandlerRegistered) {
                rxtx.off("frame", _RspFrameHandler);
            }

            //  Unregister the early close handler (if needed).
            if (blEarlyCloseHandlerRegistered) {
                rxtx.off("end", _EarlyCloseHandler);
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
     *  @return {Promise<void>}
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
     *  Get whether the transport was closed.
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
     *    - True if the transport shall be closed forcibly.
     */
    this.close = function(
        forcibly = false
    ) {
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError("Transport was already closed.");
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
        //  Wait for close signal.
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = syncCmdClose.waitWithCancellator(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                if (!connmgr.isClosed()) {
                    connmgr.close(false);
                }
            } else if (wh == wh2) {
                if (!connmgr.isClosed()) {
                    connmgr.close(true);
                    await connmgr.wait();
                }
                return;
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

        //  Wait for terminate signal.
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = connmgr.wait(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Do nothing.
            } else if (wh == wh2) {
                if (!connmgr.isClosed()) {
                    connmgr.close(true);
                    await connmgr.wait();
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
        //  Set the closed signal.
        syncClosed.fullfill();

        //  Clean up.
        if (!connmgr.isClosed()) {
            connmgr.close(true);
        }
    });
}

/**
 *  Modbus TCP master transport factory.
 * 
 *  @constructor
 *  @extends {IMBMasterTransportFactory}
 */
function MBTCPMasterTransportFactory() {
    //  Let parent class initialize.
    IMBMasterTransportFactory.call(this);

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
     *  @returns {Promise<IMBMasterTransport>}
     *    - The promise object (resolves with the transport object if succeed, 
     *      rejects if error occurred).
     */
    this.create = async function(
        configdict, 
        cancellator = new ConditionalSynchronizer()
    ) {
        try {
            //  Wrap the configuration.
            let root = XRTLibTraverse.WrapObject(configdict, false)
                                     .notNull()
                                     .typeOf(Object);

            //  Get the slave endpoint.
            let slaveRoot = root.sub("slave")
                                .notNull()
                                .typeOf(Object);
            let slaveHost = slaveRoot.sub("host")
                                     .notNull()
                                     .string()
                                     .unwrap();
            let slavePort = slaveRoot.optionalSub("port", 502)
                                     .notNull()
                                     .integer()
                                     .range(1, 65535)
                                     .unwrap();

            //  Get timeout settings.
            let timeoutRoot = root.optionalSub("timeout", {})
                                  .notNull()
                                  .typeOf(Object);
            let timeoutIdle = timeoutRoot.optionalSub(
                "idle", 
                DFLT_TCPIDLE_TIMEOUT
            ).notNull().min(1).unwrap();
            let timeoutRetry = timeoutRoot.optionalSub(
                "retry", 
                DFLT_TCPRETRY_TIMEOUT
            ).notNull().min(1).unwrap();
            let timeoutEstablish = timeoutRoot.optionalSub(
                "establish", 
                DFLT_TCPESTABLISH_TIMEOUT
            ).notNull().min(1).unwrap();

            //  Get parallel settings.
            let parallel = root.optionalSub("parallel", DFLT_MAXPARALLEL)
                               .notNull()
                               .integer()
                               .range(1, 65536)
                               .unwrap();

            //  Create transport option object.
            let opt = new MBTCPMasterTransportOption();
            opt.setIdleTimeout(timeoutIdle);
            opt.setRetryTimeout(timeoutRetry);
            opt.setEstablishTimeout(timeoutEstablish);
            opt.setMaxParallelTransactions(parallel);

            //  Create transport.
            return new MBTCPMasterTransport(slaveHost, slavePort, opt);
        } catch(error) {
            // if (error instanceof MBConfigurationError) {
            //     throw error;
            // }
            throw new MBConfigurationError(error.message || "Unknown error.");
        }
    };
}

//
//  Inheritances.
//
Util.inherits(MBTCPMasterTransport, IMBMasterTransport);
Util.inherits(MBTCPMasterTransportFactory, IMBMasterTransportFactory);

//  Export public APIs.
module.exports = {
    //  TODO(akita): Make this class private later...
    "MBTCPMasterTransportOption": MBTCPMasterTransportOption,
    //               And keep following classes public...
    "MBTCPMasterTransport": MBTCPMasterTransport,
    "MBTCPMasterTransportFactory": MBTCPMasterTransportFactory
};
