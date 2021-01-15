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
const MbTspSlAsciiLRC = 
    require("./slascii-lrc");
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

//
//  Constants.
//

//  Maximum raw frame size.
const MAX_RAWFRAME_SIZE = 255  /* = 1B (Address) B + 1B (Fn) + 252B (Data) + */;
                               /*   1B (LRC)  */

//  ASCII codes.
const ASCII_COLON = 0x3A;
const ASCII_UPPER_A = 0x41;
const ASCII_UPPER_Z = 0x5A;
const ASCII_DIGIT_0 = 0x30;
const ASCII_DIGIT_9 = 0x39;
const ASCII_CR = 0x0D;
const ASCII_LF = 0x0A;

//  RX states.
const RXSTATE_IDLE         = 0;
const RXSTATE_RECEPTION_HI = 1;
const RXSTATE_RECEPTION_LO = 2;
const RXSTATE_ENDFRAME     = 3;

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
    //  Private methods.
    //

    /**
     *  Handle raw frame.
     * 
     *  @param {Buffer} raw
     *    - The raw frame.
     */
    function _HandleFrame(raw) {
        //  Ignore if the raw frame is too short.
        if (raw.length < 3) {
            //  TODO(akita): Increase the frame corruption counter.
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
            //  TODO(akita): Increase the LRC checksum error counter.
            return;
        }

        //  Build the frame.
        let frame = new MBAsciiFrame(address, fnCode, data);

        //  Emit "frame" event.
        self.emit("frame", frame);
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
        //  Frame buffer.
        let frame = Buffer.allocUnsafe(MAX_RAWFRAME_SIZE);
        let frameWrittenOffset = 0;

        //  RX state.
        let state = RXSTATE_IDLE;

        //  NOK flag.
        let nok = false;

        //  Datum register.
        let datum = 0x00;

        //  Run the state machine.
        while(true) {
            //  Clear the RX buffer overrun flag.
            //  Receive one character.
            let charValue = 0x00;
            let charValidity = false;
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
                            nok = true;
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

            //  NOK if character is not valid.
            if (!charValidity) {
                nok = true;
            }

            // //  NOK if the character is not accepted.
            // if (!(
            //     charValue == ASCII_COLON || 
            //     (charValue >= ASCII_DIGIT_0 && charValue <= ASCII_DIGIT_9) || 
            //     (charValue >= ASCII_UPPER_A && charValue <= ASCII_UPPER_Z) || 
            //     charValue == ASCII_CR || 
            //     charValue == ASCII_LF
            // )) {
            //     nok = true;
            // }

            if (state == RXSTATE_IDLE) {
                //  Go to RECEPTION(HI) state if ':' was received.
                if (charValidity && charValue == ASCII_COLON) {
                    //  Reset the frame buffer.
                    frameWrittenOffset = 0;

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Initialize the NOK flag.
                    nok = !charValidity;

                    //  Go to RECEPTION(HI) state.
                    state = RXSTATE_RECEPTION_HI;
                }
            } else if (state == RXSTATE_RECEPTION_HI) {
                if (charValue == ASCII_COLON) {
                    //
                    //  Go to RECEPTION(HI) state if ':' was received.
                    //

                    //  Reset the frame buffer.
                    frameWrittenOffset = 0;

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Initialize the NOK flag.
                    nok = !charValidity;
                } else if (
                    charValue >= ASCII_DIGIT_0 && 
                    charValue <= ASCII_DIGIT_9
                ) {
                    //
                    //  Go to RECEPTION(LO) state if digit character ('0'-'9') 
                    //  was received.
                    //

                    //  Write the digit to higher 4 bits of the datum register.
                    datum = ((charValue - ASCII_DIGIT_0) << 4);

                    //  Go to RECEPTION(LO) state.
                    state = RXSTATE_RECEPTION_LO;
                } else if (
                    charValue >= ASCII_UPPER_A && 
                    charValue <= ASCII_UPPER_Z
                ) {
                    //
                    //  Go to RECEPTION(LO) state if hex character ('A'-'Z') 
                    //  was received.
                    //

                    //  Write the hex value to higher 4 bits of the datum 
                    //  register.
                    datum = ((charValue - ASCII_UPPER_A + 10) << 4);

                    //  Go to RECEPTION(LO) state.
                    state = RXSTATE_RECEPTION_LO;
                } else if (charValue == ASCII_CR) {
                    //
                    //  Go to ENDFRAME state if '\r' was received.
                    //

                    //  Append the '\r' to the tail of the frame buffer.
                    if (frameWrittenOffset >= MAX_RAWFRAME_SIZE) {
                        //  Buffer overflow. NOK shall be set.
                        nok = true;
                    }

                    //  Go to ENDFRAME state.
                    state = RXSTATE_ENDFRAME;
                } else {
                    //
                    //  Handle invalid character.
                    //

                    //  Invalid character was received. NOK shall be set.
                    nok = true;

                    //  Treat higher 4 bits of the datum as 0b0000.
                    datum = 0x00;

                    //  Go to RECEPTION(LO) state.
                    state = RXSTATE_RECEPTION_LO;
                }
            } else if (state == RXSTATE_RECEPTION_LO) {
                if (charValue == ASCII_COLON) {
                    //
                    //  Go to RECEPTION(HI) state if ':' was received.
                    //

                    //  Reset the frame buffer.
                    frameWrittenOffset = 0;

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Initialize the NOK flag.
                    nok = !charValidity;

                    //  Go to RECEPTION(HI) state.
                    state = RXSTATE_RECEPTION_HI;
                } else if (
                    charValue >= ASCII_DIGIT_0 && 
                    charValue <= ASCII_DIGIT_9
                ) {
                    //
                    //  Go to RECEPTION(HI) state if digit character ('0'-'9') 
                    //  was received.
                    //

                    //  Write the digit to lower 4 bits of the datum register.
                    datum |= (charValue - ASCII_DIGIT_0);

                    //  Append the datum to the tail of the frame buffer.
                    if (frameWrittenOffset >= MAX_RAWFRAME_SIZE) {
                        //  Buffer overflow. NOK shall be set.
                        nok = true;
                    } else {
                        frame.writeUInt8(datum, frameWrittenOffset);
                        ++(frameWrittenOffset);
                    }

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Go to RECEPTION(HI) state.
                    state = RXSTATE_RECEPTION_HI;
                } else if (
                    charValue >= ASCII_UPPER_A && 
                    charValue <= ASCII_UPPER_Z
                ) {
                    //
                    //  Go to RECEPTION(HI) state if hex character ('A'-'Z') 
                    //  was received.
                    //

                    //  Write the hex value to lower 4 bits of the datum 
                    //  register.
                    datum |= (charValue - ASCII_UPPER_A + 10);

                    //  Append the datum to the tail of the frame buffer.
                    if (frameWrittenOffset >= MAX_RAWFRAME_SIZE) {
                        //  Buffer overflow. NOK shall be set.
                        nok = true;
                    } else {
                        frame.writeUInt8(datum, frameWrittenOffset);
                        ++(frameWrittenOffset);
                    }

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Go to RECEPTION(HI) state.
                    state = RXSTATE_RECEPTION_HI;
                } else if (charValue == ASCII_CR) {
                    //
                    //  Go to ENDFRAME state if '\r' was received.
                    //

                    //  Lower 4 bits of the datum was missing. So NOK shall be 
                    //  set.
                    nok = true;

                    //  Go to ENDFRAME state.
                    state = RXSTATE_ENDFRAME;
                } else {
                    //
                    //  Handle invalid character.
                    //

                    //  Invalid character was received. NOK shall be set.
                    nok = true;

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Go to RECEPTION(HI) state.
                    state = RXSTATE_RECEPTION_HI;
                }
            } else if (state == RXSTATE_ENDFRAME) {
                if (charValue == ASCII_COLON) {
                    //
                    //  Go to RECEPTION(HI) state if ':' was received.
                    //

                    //  Reset the frame buffer.
                    frameWrittenOffset = 0;

                    //  Zeroify the datum register.
                    datum = 0x00;

                    //  Initialize the NOK flag.
                    nok = !charValidity;

                    //  Go to RECEPTION(HI) state.
                    state = RXSTATE_RECEPTION_HI;
                } else if (charValue == ASCII_LF) {
                    //
                    //  Go to IDLE state if '\n' was received.
                    //

                    //  Append the '\n' to the tail of the frame buffer.
                    if (frameWrittenOffset >= MAX_RAWFRAME_SIZE) {
                        //  Buffer overflow. NOK shall be set.
                        nok = true;
                    }

                    if (!nok) {
                        //  Handle the frame.
                        _HandleFrame(frame.slice(0, frameWrittenOffset));

                        //  Reset the frame buffer.
                        frameWrittenOffset = 0;
                    } else {
                        //  TODO(akita): Increase the NOKed frame counter.
                    }

                    //  Go to IDLE state.
                    state = RXSTATE_IDLE;
                } else {
                    //  Missing LF character. Go to IDLE state.
                    state = RXSTATE_IDLE;
                }
            } else {
                ReportBug("Invalid state.", true, MBBugError);
            }
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

            //  Build the raw frame.
            let frameRaw = [ASCII_COLON];
            let frameHasher = new MBLRC();
            let frameAddress = frame.getAddress();
            frameHasher.updateSingleByte(frameAddress);
            let frameFnCode = frame.getFunctionCode();
            frameHasher.updateSingleByte(frameFnCode);
            let frameData = frame.getData();
            frameHasher.update(frameData);

            /**
             *  Emit new byte as high-low ASCII pair.
             * 
             *  @param {Number} datum
             *    - The datum (byte).
             */
            function _FrameRaw_NewByte(datum) {
                //  Emit higher 4 bits.
                let ch = ((datum >> 4) & 0xff);
                if (ch >= 10) {
                    ch -= 10;
                    ch += ASCII_UPPER_A;
                } else {
                    ch += ASCII_DIGIT_0;
                }
                frameRaw.push(ch);

                //  Emit lower 4 bits.
                ch = (datum & 0x0f);
                if (ch >= 10) {
                    ch -= 10;
                    ch += ASCII_UPPER_A;
                } else {
                    ch += ASCII_DIGIT_0;
                }
                frameRaw.push(ch);
            }

            _FrameRaw_NewByte(frameAddress);
            _FrameRaw_NewByte(frameFnCode);
            for (let i = 0; i < frameData.length; ++i) {
                _FrameRaw_NewByte(frameData.readUInt8(i));
            }
            _FrameRaw_NewByte(frameHasher.digest());
            frameRaw.push(ASCII_CR);
            frameRaw.push(ASCII_LF);
            frameRaw = Buffer.from(frameRaw);

            //  Transmit the raw frame.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = port.txTransmit(frameRaw, cts);
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