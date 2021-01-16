//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlAsciiFrame = 
    require("./slascii-frame");
const MbTspSlAsciiHexWord = 
    require("./slascii-hexword");
const MbTspSlAsciiLRC = 
    require("./slascii-lrc");
const MbTspSlAsciiReceptor = 
    require("./slascii-receptor");
const MbTspSlAsciiSndBuf = 
    require("./slascii-sndbuf");
const MbTspSlDriverCore = 
    require("./../driver/sl-drivercore");
const MbError = 
    require("./../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const Events = 
    require("events");
const Util = 
    require("util");

//  Imported classes.
const MBBugError = 
    MbError.MBBugError;
const MBDeviceError = 
    MbError.MBDeviceError;
const MBInvalidFrameError = 
    MbError.MBInvalidFrameError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBAsciiFrame = 
    MbTspSlAsciiFrame.MBAsciiFrame;
const MBLRC = 
    MbTspSlAsciiLRC.MBLRC;
const MBAsciiReceptor = 
    MbTspSlAsciiReceptor.MBAsciiReceptor;
const MBAsciiSendBuffer = 
    MbTspSlAsciiSndBuf.MBAsciiSendBuffer;
const IMBSerialPort = 
    MbTspSlDriverCore.IMBSerialPort;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const SemaphoreSynchronizer = 
    XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer;
const PreemptReject = 
    XRTLibAsync.Asynchronize.Preempt.PreemptReject;
const EventEmitter = 
    Events.EventEmitter;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//  Imported constants.
const HEXWD2BYTE = 
    MbTspSlAsciiHexWord.HEXWD2BYTE;

//
//  Classes.
//

/**
 *  Modbus ASCII frame transceiver.
 * 
 *  @constructor
 *  @extends {EventEmitter}
 *  @param {IMBSerialPort} port
 *    - The serial port.
 */
function MBAsciiTransceiver(
    port
) {
    //  Let parent class initialize.
    EventEmitter.call(this);

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Counters.
    let cntrBusMsg = 0n;
    let cntrBusCommError = 0n;
    let cntrBusCharOvrRun = 0n;

    //  RX ended flag.
    let rxEnded = false;

    //  TX frame queue and its semaphores.
    /**
     *  @type {MBAsciiFrame[]}
     */
    let txFrameQueue = [];
    let semTxFrameQueueItems = new SemaphoreSynchronizer(0);
    let semTxFrameQueueTokens = new SemaphoreSynchronizer(1);

    //  Signals.
    let blCmdClose = false;
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Reset the bus message counter.
     */
    this.resetBusMessageCount = function() {
        cntrBusMsg = 0n;
    };

    /**
     *  Get the value of the bus message counter.
     * 
     *  Note(s):
     *    [1] The bus message counter saves the quantity of good messages that 
     *        has been received.
     * 
     *  @returns {BigInt}
     *    - The value.
     */
    this.getBusMessageCount = function() {
        return cntrBusMsg;
    };

    /**
     *  Reset the bus communication error counter.
     */
    this.resetBusErrorCount = function() {
        cntrBusCommError = 0n;
    };

    /**
     *  Get the value of the bus communication error counter.
     * 
     *  Note(s):
     *    [1] The bus communication error counter saves the quantity of 
     *        corrupted messages that has been received.
     * 
     *  @returns {BigInt}
     *    - The value.
     */
    this.getBusErrorCount = function() {
        return cntrBusCommError;
    };

    /**
     *  Reset the bus character overrun error counter.
     */
    this.resetBusOverrunCount = function() {
        cntrBusCharOvrRun = 0n;
    };

    /**
     *  Get the value of the bus character overrun counter.
     * 
     *  Note(s):
     *    [1] The bus character overrun counter saves the quantity of messages 
     *        that could not be handled due to a character overrun condition.
     * 
     *  @returns {BigInt}
     *    - The value.
     */
    this.getBusOverrunCount = function() {
        return cntrBusCharOvrRun;
    };

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
     *  Transmit a frame.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInvalidFrameError}
     *    - The frame mismatches with the frame transceiver or 
     *      contains invalid information.
     *  @throws {MBInvalidOperationError}
     *    - The transceiver was already closed or is going to be closed.
     *  @throws {MBDeviceError}
     *    - Failed to transmit the frame due to device error.
     *  @param {MBAsciiFrame} frame 
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
        if (!(frame instanceof MBAsciiFrame)) {
            throw new MBInvalidFrameError("Not a ASCII frame.");
        }

        //  Check connection status.
        if (blCmdClose || syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError(
                "Transceiver was already closed or is going to be closed."
            );
        }

        //  Check the close/terminate signal.
        if (syncCmdTerminate.isFullfilled()) {
            throw new MBInvalidOperationError(
                "Transmit when closing."
            );
        }

        //  Wait for TX queue space and add the frame to the TX queue.
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = semTxFrameQueueTokens.wait(cts);
            let wh2 = cancellator.waitWithCancellator(cts);
            let wh3 = syncClosed.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Add the frame to TX queue.
                txFrameQueue.push(frame);
                semTxFrameQueueItems.signal();
            } else {
                //  Wait for the wait handler 1 to be settled.
                try {
                    await wh1;

                    //  Give back the token since we abandoned.
                    semTxFrameQueueTokens.signal();
                } catch(error) {
                    //  Do nothing.
                }

                if (wh == wh2) {
                    throw new MBOperationCancelledError(
                        "The cancellator was activated."
                    );
                } else if (wh == wh3) {
                    throw new MBInvalidOperationError(
                        "Transceiver was already closed."
                    );
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
        }
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
                "Transceiver was already closed."
            );
        }

        //  Trigger the close/terminate signal.
        if (forcibly) {
            syncCmdTerminate.fullfill();
        } else {
            if (!blCmdClose) {
                txFrameQueue.push(null);
                semTxFrameQueueItems.signal();
                blCmdClose = true;
            }
        }
    };

    //
    //  Coroutine(s).
    //

    //  RX coroutine.
    let syncRxCrtExited = new ConditionalSynchronizer();
    (async function() {
        //  Initialize the frame receptor.
        let rcpt = new MBAsciiReceptor();
        rcpt.on(
            "frame", 
            /**
             *  @param {Buffer} frame
             *    - The frame buffer.
             *  @param {Number} flags
             *    - The frame flags.
             */
            function(frame, flags) {
                //  Handle overrun.
                if ((flags & MBAsciiReceptor.FRAMEFLAG_OVERRUN) != 0) {
                    ++(cntrBusCharOvrRun);
                }

                //  Handle NOK.
                if ((flags & MBAsciiReceptor.FRAMEFLAG_NOK) != 0) {
                    ++(cntrBusCommError);
                    return;
                }

                //  Parse the frame (hex to raw).
                if ((frame.length & 1) == 0) {
                    //  Hexified frame should always contain odd-number of 
                    //  characters.
                    ++(cntrBusCommError);
                    return;
                }
                let raw = Buffer.allocUnsafe((frame.length - 3) >> 1);
                for (
                    let ptrsrc = 1, ptrdst = 0; 
                    ptrdst < raw.length; 
                    ptrsrc += 2, ++ptrdst
                ) {
                    let datum = HEXWD2BYTE[frame.readUInt16BE(ptrsrc)];
                    if (datum < 0) {
                        //  Unable to parse the hexified byte.
                        ++(cntrBusCommError);
                        return;
                    }
                    raw.writeUInt8(datum, ptrdst);
                }

                //  Drop if the too short.
                if (raw.length < 3) {
                    //  Increase the 'Bus Communication Error' counter.
                    ++(cntrBusCommError);
                    return;
                }

                //  Get the address.
                let address = raw.readUInt8(0);

                //  Get the function code.
                let fnCode = raw.readUInt8(1);

                //  Get the data.
                let data = raw.slice(2, raw.length - 1);

                //  Check the LRC.
                let lrcExpected = raw.readUInt8(raw.length - 1);
                let lrcHasher = new MBLRC();
                lrcHasher.update(raw.slice(0, raw.length - 1));
                if (lrcHasher.digest() != lrcExpected) {
                    //  Increase the 'Bus Communication Error' counter.
                    ++(cntrBusCommError);
                    return;
                }

                //  Increase the 'Bus Message Count' counter.
                ++(cntrBusMsg);

                //  Emit "frame" event.
                self.emit("frame", new MBAsciiFrame(address, fnCode, data));
            }
        );

        //  Receive characters.
        while(true) {
            //  Receive one character.
            let charValue = 0x00;
            let charValidity = false;
            let charOverrun = false;
            {
                //  Wait signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = port.rxNext(cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    if (
                        error instanceof MBInvalidOperationError || 
                        error instanceof MBDeviceError
                    ) {
                        return;
                    }
                    throw error;
                } finally {
                    cts.fullfill();
                }

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    try {
                        charValue = port.rxGetCharacter();
                        charValidity = port.rxIsCharacterValid();
                        if (port.rxIsBufferOverrun()) {
                            charOverrun = true;
                            port.rxResetBufferOverrun();
                        }
                    } catch(error) {
                        if (error instanceof MBInvalidOperationError) {
                            return;
                        }
                        throw error;
                    }
                } else {
                    if (wh == wh2) {
                        return;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }

            //  Handle the character.
            rcpt.input(charValue, charValidity, charOverrun);
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "RX coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ));
    }).finally(function() {
        //  Emit "end" event.
        rxEnded = true;
        self.emit("end");

        syncRxCrtExited.fullfill();
    });

    //  TX coroutine.
    let syncTxCrtExited = new ConditionalSynchronizer();
    (async function() {
        while(true) {
            //  Stop immediately if terminate signal was triggered.
            if (syncCmdTerminate.isFullfilled()) {
                break;
            }

            //  Wait for a frame to be transmitted.
            /**
             *  @type {?MBAsciiFrame}
             */
            let frame = null;
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = semTxFrameQueueItems.wait(cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    frame = txFrameQueue.shift();
                    if (frame === null) {
                        txFrameQueue.unshift(null);
                        semTxFrameQueueItems.signal();
                    } else {
                        semTxFrameQueueTokens.signal();
                    }
                } else {
                    //  Wait for the wait handler 1 to be settled.
                    try {
                        await wh1;
                        semTxFrameQueueItems.signal();
                    } catch(error) {
                        //  Do nothing.
                    }

                    if (wh == wh2) {
                        break;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }

            //  Stop if close signal is triggered.
            if (frame === null) {
                break;
            }

            //  Initialize the frame send buffer.
            let sndbuf = new MBAsciiSendBuffer();
            sndbuf.append(frame.getAddress());
            sndbuf.append(frame.getFunctionCode());
            sndbuf.appendBytes(frame.getData());
            sndbuf = sndbuf.end();

            //  Transmit the frame.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = port.txTransmit(sndbuf, cts);
                let wh2 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    if (
                        error instanceof MBInvalidOperationError || 
                        error instanceof MBDeviceError
                    ) {
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
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "TX coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ));
    }).finally(function() {
        syncTxCrtExited.fullfill();

        //  Dispose the serial port.
        port.dispose();
    });

    //  Trigger the closed signal when all coroutines exited.
    Promise.all([
        syncRxCrtExited.wait(), 
        syncTxCrtExited.wait()
    ]).then(function() {
        syncClosed.fullfill();
    });
}

//
//  Inheritances.
//
Util.inherits(MBAsciiTransceiver, EventEmitter);

//  Export public APIs.
module.exports = {
    "MBAsciiTransceiver": MBAsciiTransceiver
};