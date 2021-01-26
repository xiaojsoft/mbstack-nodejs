//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspTcpConstants = 
    require("./tcp-constants");
const MbTspTcpFrame = 
    require("./tcp-frame");
const MbConventions = 
    require("./../../conventions");
const MbError = 
    require("./../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const XRTLibTCPUtilities = 
    require("xrtlibrary-tcputilities");
const Events = 
    require("events");
const Util = 
    require("util");

//  Imported classes.
const MBTCPFrame = 
    MbTspTcpFrame.MBTCPFrame;
const MBError = 
    MbError.MBError;
const MBParameterError = 
    MbError.MBParameterError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBInvalidFrameError = 
    MbError.MBInvalidFrameError;
const MBCommunicationEndOfStreamError = 
    MbError.MBCommunicationEndOfStreamError;
const MBBugError =
     MbError.MBBugError;
const PreemptReject = 
    XRTLibAsync.Asynchronize.Preempt.PreemptReject;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const EventFlags = 
    XRTLibAsync.Synchronize.Event.EventFlags;
const TCPError = 
    XRTLibTCPUtilities.Error.TCPError;
const TCPConnection = 
    XRTLibTCPUtilities.TCPConnection;
const EventEmitter = 
    Events.EventEmitter;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//  Imported constants.
const MBAP_PROTOID_MODBUS = 
    MbTspTcpConstants.MBAP_PROTOID_MODBUS;
const MAX_PDU_LENGTH = 
    MbConventions.MAX_PDU_LENGTH;

//
//  Constants.
//

//  RX/TX frame queue size.
const MBTCP_DFLT_RX_FRAMEQU_SIZE = 1;
const MBTCP_DFLT_TX_FRAMEQU_SIZE = 1;

//  Empty buffer.
const EMPTY_BUF = Buffer.allocUnsafe(0);

//  Bit masks.
const BITMASK_RXFRAMEQU_FULL      = 0x01;
const BITMASK_RXFRAMEQU_EMPTY     = 0x02;
const BITMASK_TXFRAMEQU_FULL      = 0x04;
const BITMASK_TXFRAMEQU_EMPTY     = 0x08;

//
//  Classes.
//

/**
 *  Modbus TCP frame transceiver options.
 * 
 *  Note(s):
 *    [1] The RX frame queue size option would take no effect if the 
 *        asynchronous receiving of the transceiver is enabled.
 * 
 *  @constructor
 */
function MBTCPTransceiverOption() {
    //
    //  Members.
    //

    //  RX/TX frame queue sizes.
    let rxFrameQueueSize = MBTCP_DFLT_RX_FRAMEQU_SIZE;
    let txFrameQueueSize = MBTCP_DFLT_TX_FRAMEQU_SIZE;

    //
    //  Public methods.
    //

    /**
     *  Get the RX frame queue size.
     * 
     *  @return {Number}
     *    - The size.
     */
    this.getRxFrameQueueSize = function() {
        return rxFrameQueueSize;
    };

    /**
     *  Set the RX frame queue size.
     * 
     *  Note(s):
     *    [1] The frame queue size must be non-zero.
     * 
     *  @throws {MBParameterError}
     *    - The queue size is invalid.
     *  @param {Number} sz 
     *    - The size.
     */
    this.setRxFrameQueueSize = function(sz) {
        if (!(Number.isInteger(sz) && sz >= 1)) {
            throw new MBParameterError("Invalid queue size.");
        }
        rxFrameQueueSize = sz;
    };

    /**
     *  Get the TX frame queue size.
     * 
     *  @return {Number}
     *    - The size.
     */
    this.getTxFrameQueueSize = function() {
        return txFrameQueueSize;
    };

    /**
     *  Set the TX frame queue size.
     * 
     *  Note(s):
     *    [1] The frame queue size must be non-zero.
     * 
     *  @throws {MBParameterError}
     *    - The queue size is invalid.
     *  @param {Number} sz 
     *    - The size.
     */
    this.setTxFrameQueueSize = function(sz) {
        if (!(Number.isInteger(sz) && sz >= 1)) {
            throw new MBParameterError("Invalid queue size.");
        }
        txFrameQueueSize = sz;
    };
}

/**
 *  Modbus TCP frame transceiver.
 * 
 *  Note(s):
 *    [1] If the asynchronous receiving is enabled:
 * 
 *          - A "frame" event would be emitted when receives a frame.
 *          - An "end" event would be emitted when there is no more frame 
 *            (connection ends).
 *          - Any call to MBTCPTransceiver.prototype.frameReceive() would cause 
 *            a MBInvalidOperationError exception.
 * 
 *        Otherwise:
 * 
 *          - Neither "frame" nor "end" event would be emitted.
 *          - Use MBTCPTransceiver.prototype.frameReceive() to receive a frame.
 * 
 *  @constructor
 *  @extends {EventEmitter}
 *  @param {TCPConnection} connection
 *    - The TCP connection.
 *  @param {MBTCPTransceiverOption} [options]
 *    - The TCP frame transceiver options.
 *  @param {Boolean} [useAsyncRX]
 *    - True if asynchronous receiving is enabled.
 */
function MBTCPTransceiver(
    connection, 
    options = new MBTCPTransceiverOption(),
    useAsyncRX = false
) {
    //  Let parent class initialize.
    EventEmitter.call(this);

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Flags.
    let bitflags = new EventFlags(
        BITMASK_RXFRAMEQU_EMPTY | BITMASK_TXFRAMEQU_EMPTY
    );

    //  RX frame queue and its semaphores.
    let rxEnded = false;
    let rxFrameQueue = [];
    let rxFrameQueueSize = options.getRxFrameQueueSize();

    //  TX frame queue and its semaphroes.
    let txFrameQueue = [];
    let txFrameQueueSize = options.getTxFrameQueueSize();

    //  Signals.
    let blCmdClose = false;
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncRxCrtExited = new ConditionalSynchronizer();
    let syncTxCrtExited = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();

    //
    //  Private methods.
    //

    /**
     *  Update RX frame queue bit flags.
     */
    function _UpdateRxFrameQueueBitFlags() {
        if (rxFrameQueue.length >= rxFrameQueueSize) {
            bitflags.post(BITMASK_RXFRAMEQU_FULL, EventFlags.POST_FLAG_SET);
        } else {
            bitflags.post(BITMASK_RXFRAMEQU_FULL, EventFlags.POST_FLAG_CLR);
        }
        if (rxFrameQueue.length == 0) {
            bitflags.post(BITMASK_RXFRAMEQU_EMPTY, EventFlags.POST_FLAG_SET);
        } else {
            bitflags.post(BITMASK_RXFRAMEQU_EMPTY, EventFlags.POST_FLAG_CLR);
        }
    }

    /**
     *  Update TX frame queue bit flags.
     */
    function _UpdateTxFrameQueueBitFlags() {
        if (txFrameQueue.length >= txFrameQueueSize) {
            bitflags.post(BITMASK_TXFRAMEQU_FULL, EventFlags.POST_FLAG_SET);
        } else {
            bitflags.post(BITMASK_TXFRAMEQU_FULL, EventFlags.POST_FLAG_CLR);
        }
        if (txFrameQueue.length == 0) {
            bitflags.post(BITMASK_TXFRAMEQU_EMPTY, EventFlags.POST_FLAG_SET);
        } else {
            bitflags.post(BITMASK_TXFRAMEQU_EMPTY, EventFlags.POST_FLAG_CLR);
        }
    }

    //
    //  Public methods.
    //

    /**
     *  Get whether the frame receiving was ended (no more frame can be 
     *  received).
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isEnded = function() {
        return rxEnded;
    };

    /**
     *  Receive a frame.
     * 
     *  Note(s):
     *    [1] NULL would be returned if no more frame could be returned (e.g. 
     *        the frame transceiver was closed).
     * 
     *  @throws {MBInvalidOperationError}
     *    - The asynchronous receiving is enabled.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @return {Promise<?MBTCPFrame>}
     *    - The promise object (resolves with the frame or NULL if succeed, 
     *      rejects if error occurred).
     */
    this.frameReceive = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Throw if asynchronous receiving is enabled.
        if (useAsyncRX) {
            throw new MBInvalidOperationError(
                "frameReceive() method is not allowed when asynchronous " + 
                "receiving is enabled."
            );
        }

        //  Wait for the RX queue to be non-empty.
        while (rxFrameQueue.length == 0) {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = bitflags.pend(
                BITMASK_RXFRAMEQU_EMPTY, 
                EventFlags.PEND_FLAG_CLR_ALL, 
                cts
            );
            let wh2 = cancellator.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Check again.
                continue;
            } else if (wh == wh2) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

        //  Pop the frame.
        if (rxFrameQueue[0] === null) {
            return null;
        }
        let frame = rxFrameQueue.shift();
        _UpdateRxFrameQueueBitFlags();

        return frame;
    };

    /**
     *  Transmit a frame.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInvalidFrameError}
     *    - The frame mismatches with the frame transceiver or 
     *      contains invalid information.
     *  @throws {MBCommunicationError}
     *    - Failed to transmit the frame due to communication error.
     *  @param {MBTCPFrame} frame 
     *    - The frame.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @return {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred).
     */
    this.frameTransmit = async function(
        frame, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Check frame type.
        if (!(frame instanceof MBTCPFrame)) {
            throw new MBInvalidFrameError("Not a TCP frame.");
        }

        //  Check connection status.
        if (syncClosed.isFullfilled()) {
            throw new MBCommunicationEndOfStreamError("TCP connection closed.");
        }

        //  Check the close/terminate signal.
        if (blCmdClose || syncCmdTerminate.isFullfilled()) {
            throw new MBCommunicationEndOfStreamError("Write when closing.");
        }

        //  Wait for TX queue space and add the frame to the TX queue.
        while (txFrameQueue.length >= txFrameQueueSize) {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = bitflags.pend(
                BITMASK_TXFRAMEQU_FULL,
                EventFlags.PEND_FLAG_CLR_ALL,
                cts
            );
            let wh2 = cancellator.waitWithCancellator(cts);
            let wh3 = syncClosed.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Check again.
                continue;
            } else if (wh == wh2) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else if (wh == wh3) {
                throw new MBCommunicationEndOfStreamError(
                    "TCP connection closed."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
        txFrameQueue.push(frame);
        _UpdateTxFrameQueueBitFlags();
    };

    /**
     *  Wait for the frame transceiver to be closed.
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
     *  Get whether the frame transceiver is closed.
     * 
     *  @return {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        return syncClosed.isFullfilled();
    };

    /**
     *  Close the frame transceiver.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The frame transceiver was already closed.
     *  @param {Boolean} [forcibly] 
     *    - True if the frame transceiver should be closed forcibly.
     */
    this.close = function(forcibly = false) {
        //  Throw an exception if the connection was already closed.
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError(
                "TCP connection was already closed."
            );
        }

        //  Trigger the close/terminate signal.
        if (forcibly) {
            syncCmdTerminate.fullfill();
        } else {
            if (!blCmdClose) {
                txFrameQueue.push(null);
                _UpdateTxFrameQueueBitFlags();
                blCmdClose = true;
            }
        }
    };

    //
    //  Initialization.
    //

    //  Disable max listener warning.
    self.setMaxListeners(0);

    //
    //  Coroutines.
    //

    //  RX coroutine.
    (async function() {
        //  Get the TCP read stream.
        let rs = connection.getReadStream();

rxOuterLoop:
        while(true) {
            //  Read the header (first 6 bytes of the MBAP).
            /**
             *  @type {?Buffer}
             */
            let header = null;
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = rs.read(6, cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    if (error instanceof TCPError) {
                        break;
                    }
                    throw error;
                } finally {
                    cts.fullfill();
                }
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    header = rsv.getValue();
                } else if (wh == wh2) {
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
            if (header.length != 6) {
                break;
            }

            //  Extract transaction ID, protocol ID and protocol payload length
            //  from the header.
            let transactionID = header.readUInt16BE(0);
            let protocolID = header.readUInt16BE(2);
            let protocolPayloadLen = header.readUInt16BE(4);

            //  Read the protocol payload.
            let protocolPayload = EMPTY_BUF;
            if (protocolPayloadLen != 0) {
                let cts = new ConditionalSynchronizer();
                let wh1 = rs.read(protocolPayloadLen, cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    if (error instanceof TCPError) {
                        break;
                    }
                    throw error;
                } finally {
                    cts.fullfill();
                }
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    protocolPayload = rsv.getValue();
                } else if (wh == wh2) {
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
            if (protocolPayload.length != protocolPayloadLen) {
                break;
            }

            //  Check protocol payload length for Modbus.
            if (
                protocolID == MBAP_PROTOID_MODBUS && 
                protocolPayloadLen > MAX_PDU_LENGTH + 1
            ) {
                continue;
            }

            //  Build the frame object.
            let frame = new MBTCPFrame(
                transactionID,
                protocolID,
                protocolPayload
            );

            //  Add the frame to RX queue.
            if (useAsyncRX) {
                self.emit("frame", frame);
            } else {
                //  Wait for the RX frame queue to be not full.
                while (rxFrameQueue.length >= rxFrameQueueSize) {
                    //  Wait for signals.
                    let cts = new ConditionalSynchronizer();
                    let wh1 = bitflags.pend(
                        BITMASK_RXFRAMEQU_FULL,
                        EventFlags.PEND_FLAG_CLR_ALL,
                        cts
                    );
                    let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                    let rsv = await CreatePreemptivePromise([wh1, wh2]);
                    cts.fullfill();

                    //  Handle the signal.
                    let wh = rsv.getPromiseObject();
                    if (wh == wh1) {
                        //  Check again.
                        continue;
                    } else if (wh == wh2) {
                        break rxOuterLoop;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }

                //  Push the frame to RX frame queue.
                rxFrameQueue.push(frame);
                _UpdateRxFrameQueueBitFlags();
            }
        }

        //  Mark RX as ended.
        rxEnded = true;

        if (useAsyncRX) {
            //  Emit an "end" event.
            self.emit("end");
        } else {
            //  Insert NULL (ending) frame.
            rxFrameQueue.push(null);
            _UpdateRxFrameQueueBitFlags();
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "RX coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        syncRxCrtExited.fullfill();
    });

    //  TX coroutine.
    (async function() {
        //  Get the TCP write stream.
        let ws = connection.getWriteStream();

txOuterLoop:
        while(true) {
            //  Stop immediately if terminate signal was triggered.
            if (syncCmdTerminate.isFullfilled()) {
                if (!connection.isClosed()) {
                    connection.close(true);
                    await connection.whenClosed();
                }
                break;
            }

            //  Stop immediately if the connection was already closed.
            if (connection.isClosed()) {
                break;
            }

            //  Wait for a frame to be transmitted.
            while (txFrameQueue.length == 0) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = bitflags.pend(
                    BITMASK_TXFRAMEQU_EMPTY,
                    EventFlags.PEND_FLAG_CLR_ALL,
                    cts
                );
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let wh3 = connection.whenClosed(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Check again.
                    continue;
                } else if (wh == wh2) {
                    if (!connection.isClosed()) {
                        connection.close(true);
                        await connection.whenClosed();
                    }
                    break txOuterLoop;
                } else if (wh == wh3) {
                    break txOuterLoop;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
            let frame = null;
            if (txFrameQueue[0] !== null) {
                frame = txFrameQueue.shift();
                _UpdateTxFrameQueueBitFlags();
            }

            //  Stop if close signal is triggered.
            if (frame === null) {
                if (!connection.isClosed()) {
                    connection.close(false);
                }
                break;
            }

            //  Build the frame data.
            let transactionID = frame.getTransactionID();
            let protocolID = frame.getProtocolID();
            let protocolPayload = frame.getProtocolPayload();
            let frameData = Buffer.allocUnsafe(6 + protocolPayload.length);
            frameData.writeUInt16BE(transactionID, 0);
            frameData.writeUInt16BE(protocolID, 2);
            frameData.writeUInt16BE(protocolPayload.length, 4);
            protocolPayload.copy(frameData, 6);

            //  Transmit the frame data.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = ws.writeAwaitable(frameData, cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let wh3 = connection.whenClosed(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    if (error instanceof TCPError) {
                        break;
                    }
                    throw error;
                } finally {
                    cts.fullfill();
                }
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Do nothing.
                } else if (wh == wh2) {
                    if (!connection.isClosed()) {
                        connection.close(true);
                        await connection.whenClosed();
                    }
                    break;
                } else if (wh == wh3) {
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
        }

        //  Wait for connection ended.
        if (!connection.isClosed()) {
            let cts = new ConditionalSynchronizer();
            let wh1 = connection.whenClosed(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                return;
            } else if (wh == wh2) {
                if (!connection.isClosed()) {
                    connection.close(true);
                }
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "TX coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        syncTxCrtExited.fullfill();
    });

    //  Trigger the closed signal when all coroutines exited.
    Promise.all([
        syncRxCrtExited.wait(), 
        syncTxCrtExited.wait()
    ]).then(function() {
        syncClosed.fullfill();
        if (!connection.isClosed()) {
            connection.close(true);
        }
    });
}

//
//  Inheritances.
//
Util.inherits(MBTCPTransceiver, EventEmitter);

//  Export public APIs.
module.exports = {
    "MBTCPTransceiverOption": MBTCPTransceiverOption,
    "MBTCPTransceiver": MBTCPTransceiver
};