//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlRtuCharTime = 
    require("./slrtu-chartime");
const MbTspSlRtuFrame = 
    require("./slrtu-frame");
const MbTspSlRtuCRC16 = 
    require("./slrtu-crc16");
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
const MBParameterError = 
    MbError.MBParameterError;
const MBRtuFrame = 
    MbTspSlRtuFrame.MBRtuFrame;
const MBCRC16 = 
    MbTspSlRtuCRC16.MBCRC16;
const IMBSerialPort = 
    MbTspSlDriverCore.IMBSerialPort;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const EventFlags = 
    XRTLibAsync.Synchronize.Event.EventFlags;
const PreemptReject = 
    XRTLibAsync.Asynchronize.Preempt.PreemptReject;
const EventEmitter = 
    Events.EventEmitter;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const EstimateCharacterTime = 
    MbTspSlRtuCharTime.EstimateCharacterTime;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//  Imported constants.
const MBSL_PARITY_NONE = 
    MbTspSlDriverCore.MBSL_PARITY_NONE;

//
//  Constants.
//

//  Character-time scale settings.
const CHRTMSCL_DFLT = 1;
const CHRTMSCL_MIN  = 1;
const CHRTMSCL_MAX  = 512;

//  RX buffer size.
const RXBUFSIZE = 256;

//  Minimum half-character time.
const MIN_HCT = 250 * 1000;  //  250 microseconds.

//  Bit masks.
const BITMASK_TXNOTFREE  = 0x01;
const BITMASK_CHRTMR1Z5  = 0x02;
const BITMASK_CHRTMR3Z5  = 0x04;

//  Transceiver states.
const STATE_INIT = 0;
const STATE_IDLE = 1;
const STATE_EMISSION = 2;
const STATE_RECEPTION = 3;
const STATE_CTRLWAIT = 4;

//
//  Classes.
//

/**
 *  Modbus RTU frame transceiver option.
 * 
 *  @constructor
 */
function MBRtuTransceiverOption() {
    //
    //  Members.
    //

    //  Character-time scale.
    let chrtmscale = CHRTMSCL_DFLT;

    //
    //  Public methods.
    //

    /**
     *  Get the character-time scale.
     * 
     *  @returns {Number}
     *    - The scale.
     */
    this.getCharTimeScale = function() {
        return chrtmscale;
    };

    /**
     *  Set the character-time scale.
     * 
     *  Note(s):
     *    [1] The scale must be an integer between 1 and 512.
     * 
     *  @throws {MBParameterError}
     *    - The scale is invalid.
     *  @param {Number}
     *    - The scale.
     */
    this.setCharTimeScale = function(scale) {
        if (!(
            Number.isInteger(scale) && 
            scale >= CHRTMSCL_MIN && 
            scale <= CHRTMSCL_MAX
        )) {
            throw new MBParameterError("Invalid character timescale.");
        }
        chrtmscale = scale;
    };
}

/**
 *  Modbus RTU frame transceiver.
 * 
 *  @constructor
 *  @extends {EventEmitter}
 *  @param {IMBSerialPort} port
 *    - The serial port.
 *  @param {MBRtuTransceiverOption} [options]
 *    - The transceiver options.
 */
function MBRtuTransceiver(
    port,
    options = new MBRtuTransceiverOption()
) {
    //  Let parent class initialize.
    EventEmitter.call(this);

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Port options.
    let portOptions = port.getPortOptions();

    //  Half-character time.
    let hct = Math.ceil(EstimateCharacterTime(
        portOptions.getBaudrate(),
        portOptions.getDataBits(),
        portOptions.getParityType() == MBSL_PARITY_NONE ? 0 : 1,
        portOptions.getStopBits()
    ));
    if (hct < MIN_HCT) {
        hct = MIN_HCT;
    }
    hct *= options.getCharTimeScale();

    //  Flags.
    let flags = new EventFlags(0x00);

    //  RX ended flag.
    let rxEnded = false;

    //  TX raw frame.
    /**
     *  @type {?Buffer}
     */
    let txRawFrame = null;

    //  Counters.
    let cntrBusMsg = 0n;
    let cntrBusCommError = 0n;
    let cntrBusCharOvrRun = 0n;

    //  Signals.
    let syncCmdClose = new ConditionalSynchronizer();
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
        //  Drop the raw frame if it is too short.
        if (raw.length < 4) {
            //  Increase the 'Bus Communication Error' counter.
            ++(cntrBusCommError);
            return;
        }

        //  Drop the raw frame if CRC mismatches.
        {
            let hasher = new MBCRC16();
            hasher.update(raw);
            if (hasher.digest() != 0x0000) {
                //  Increase the 'Bus Communication Error' counter.
                ++(cntrBusCommError);
                return;
            }
        }

        //  Increase the 'Bus Message Count' counter.
        ++(cntrBusMsg);

        //  Build the frame.
        let frame = new MBRtuFrame(
            raw.readUInt8(0),
            raw.readUInt8(1),
            raw.slice(2, raw.length - 2)
        );
        
        //  Emit "frame" event.
        self.emit("frame", frame);
    }

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
        if (!(frame instanceof MBRtuFrame)) {
            throw new MBInvalidFrameError("Not a RTU frame.");
        }

        //  Check connection status.
        if (
            syncCmdClose.isFullfilled() || 
            syncCmdTerminate.isFullfilled() || 
            syncClosed.isFullfilled()
        ) {
            throw new MBInvalidOperationError(
                "Transceiver was already closed or is going to be closed."
            );
        }

        //  Build the raw frame.
        let data = frame.getData();
        let raw = Buffer.allocUnsafe(4 + data.length);
        raw.writeUInt8(frame.getAddress(), 0);
        raw.writeUInt8(frame.getFunctionCode(), 1);
        data.copy(raw, 2);
        let hasher = new MBCRC16();
        hasher.update(raw.slice(0, raw.length - 2));
        raw.writeUInt16LE(hasher.digest(), raw.length - 2);

        //  Wait for the TX raw frame register to be free.
        while((flags.value & BITMASK_TXNOTFREE) != 0) {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = flags.pend(
                BITMASK_TXNOTFREE, 
                EventFlags.PEND_FLAG_CLR_ALL, 
                cts
            );
            let wh2 = syncCmdClose.waitWithCancellator(cts);
            let wh3 = syncCmdTerminate.waitWithCancellator(cts);
            let wh4 = cancellator.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Recheck immediately.
                continue;
            } else if (wh == wh2 || wh == wh3) {
                throw new MBInvalidOperationError(
                    "Transceiver was already closed or is going to be closed."
                );
            } else if (wh == wh4) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

        //  Save the raw frame to TX raw frame register.
        txRawFrame = raw;
        flags.post(BITMASK_TXNOTFREE, EventFlags.POST_FLAG_SET);
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
            syncCmdClose.fullfill();
        }
    };

    //
    //  Coroutine(s).
    //

    //  Main coroutine.
    (async function() {
        //  Setup the port timer.
        let nPortTimerTicks = 0;
        port.timerSetTickCallback(function() {
            //  Increase the port timer tick count.
            if (nPortTimerTicks < 7) {
                ++(nPortTimerTicks);
            }

            //  Trigger CHRTMR1Z5 flag if 1.5 character time expired.
            if (nPortTimerTicks >= 3) {
                if ((flags.value & BITMASK_CHRTMR1Z5) == 0) {
                    flags.post(BITMASK_CHRTMR1Z5, EventFlags.POST_FLAG_SET);
                }
            }

            //  Trigger CHRTMR3Z5 flag if 3.5 character time expired.
            if (nPortTimerTicks >= 7) {
                if ((flags.value & BITMASK_CHRTMR3Z5) == 0) {
                    flags.post(BITMASK_CHRTMR3Z5, EventFlags.POST_FLAG_SET);
                }
            }
        });

        //  Setup the RX buffer.
        let rxBuffer = Buffer.allocUnsafe(RXBUFSIZE);
        let rxBufferWriteOffset = 0;
        let rxNOK = false;
        let rxOvrrun = false;

        /**
         *  Reset the RX buffer.
         */
        function _RxBuf_Reset() {
            rxBufferWriteOffset = 0;
            rxNOK = false;
            rxOvrrun = false;
        }

        /**
         *  Move the RX character from the serial port to the RX buffer.
         */
        function _RxBuf_MoveByte() {
            let datum = port.rxGetCharacter();
            if (port.rxIsCharacterValid()) {
                if (rxBufferWriteOffset >= rxBuffer.length) {
                    rxNOK = true;
                    rxOvrrun = true;
                } else {
                    rxBuffer.writeUInt8(datum, rxBufferWriteOffset);
                    ++(rxBufferWriteOffset);
                }
            } else {
                rxNOK = true;
            }
            if (port.rxIsBufferOverrun()) {
                rxNOK = true;
                rxOvrrun = true;
                port.rxResetBufferOverrun();
            }
        }

        //  Run the state machine.
        let rxTmrInited = false;
        let state = STATE_INIT;
        while(true) {
            if (state == STATE_INIT) {
                //  Enable the character time timer.
                nPortTimerTicks = 0;
                flags.post(
                    (BITMASK_CHRTMR1Z5 | BITMASK_CHRTMR3Z5), 
                    EventFlags.POST_FLAG_CLR
                );
                port.timerSetInterval(hct);

                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = port.rxNext(cts);
                let wh2 = flags.pend(
                    BITMASK_CHRTMR3Z5, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let wh3 = syncCmdClose.waitWithCancellator(cts);
                let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
                cts.fullfill();

                //  Disable the character time timer.
                port.timerSetInterval(0);

                //  Wait for wait handler 1 to be settled.
                try {
                    await wh1;
                } catch(error) {
                    //  Operation cancelled. Do nothing.
                }

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Got one character. The bus is not idle, so just cycle.
                    continue;
                } else if (wh == wh2) {
                    //  3.5 character time timer expired. Go to IDLE state.
                    state = STATE_IDLE;
                } else if (wh == wh3 || wh == wh4) {
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_IDLE) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = port.rxNext(cts);
                let wh2 = flags.pend(
                    BITMASK_TXNOTFREE, 
                    EventFlags.PEND_FLAG_SET_ALL
                );
                let wh3 = syncCmdClose.waitWithCancellator(cts);
                let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
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

                //  Stop if close/terminate signal was set.
                if (
                    syncCmdClose.isFullfilled() || 
                    syncCmdTerminate.isFullfilled()
                ) {
                    break;
                }

                //  Go to RECEPTION state if one character was received.
                try {
                    //  Wait for the wait handler.
                    await wh1;

                    //  Reset reception context.
                    _RxBuf_Reset();
                    _RxBuf_MoveByte();
                    rxTmrInited = false;

                    //  Go to RECEPTION state.
                    state = STATE_RECEPTION;

                    continue;
                } catch(error) {
                    //  Operation cancelled. Do nothing.
                }

                //  Handle other signal(s).
                let wh = rsv.getPromiseObject();
                if (wh == wh2) {
                    //  Go to EMISSION state.
                    state = STATE_EMISSION;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_EMISSION) {
                //  Get the raw frame.
                let raw = txRawFrame;
                flags.post(BITMASK_TXNOTFREE, EventFlags.POST_FLAG_CLR);

                //  Transmit the raw frame.
                {
                    //  Wait for signals.
                    let cts = new ConditionalSynchronizer();
                    let wh1 = port.txTransmit(raw, cts);
                    let wh2 = syncCmdClose.waitWithCancellator(cts);
                    let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                    let rsv = null;
                    try {
                        rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
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

                    //  Handle the signal.
                    let wh = rsv.getPromiseObject();
                    if (wh == wh1) {
                        //  Do nothing.
                    } else if (wh == wh2 || wh == wh3) {
                        break;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }

                //  Wait for 3.5 character time.
                {
                    //  Enable the character time timer.
                    nPortTimerTicks = 0;
                    flags.post(
                        (BITMASK_CHRTMR1Z5 | BITMASK_CHRTMR3Z5), 
                        EventFlags.POST_FLAG_CLR
                    );
                    port.timerSetInterval(hct);
    
                    //  Wait for signals.
                    let cts = new ConditionalSynchronizer();
                    let wh1 = flags.pend(
                        BITMASK_CHRTMR3Z5, 
                        EventFlags.PEND_FLAG_SET_ALL, 
                        cts
                    );
                    let wh2 = syncCmdClose.waitWithCancellator(cts);
                    let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                    let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
                    cts.fullfill();

                    //  Disable the character time timer.
                    port.timerSetInterval(0);

                    //  Handle the signal.
                    let wh = rsv.getPromiseObject();
                    if (wh == wh1) {
                        //  3.5 character time timer expired. Go to IDLE state.
                        state = STATE_IDLE;
                    } else if (wh == wh2 || wh == wh3) {
                        break;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            } else if (state == STATE_RECEPTION) {
                //  Enable/restart the character time timer.
                nPortTimerTicks = 0;
                flags.post(
                    (BITMASK_CHRTMR1Z5 | BITMASK_CHRTMR3Z5), 
                    EventFlags.POST_FLAG_CLR
                );
                if (rxTmrInited) {
                    //  Restart the timer if it was already initialized.
                    port.timerRestart();
                } else {
                    //  Initialize the timer.
                    port.timerSetInterval(hct);
                    rxTmrInited = true;
                }

                //  Wait for one character.
                {
                    //  Wait for signals.
                    let cts = new ConditionalSynchronizer();
                    let wh1 = port.rxNext(cts);
                    let wh2 = flags.pend(
                        BITMASK_CHRTMR1Z5, 
                        EventFlags.PEND_FLAG_SET_ALL, 
                        cts
                    );
                    let wh3 = syncCmdClose.waitWithCancellator(cts);
                    let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                    let rsv = null;
                    try {
                        rsv = await CreatePreemptivePromise([
                            wh1, 
                            wh2, 
                            wh3, 
                            wh4
                        ]);
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
                    
                    //  Move the character if we got one.
                    try {
                        //  Wait for signal.
                        await wh1;

                        //  Move the character.
                        _RxBuf_MoveByte();
                    } catch(error) {
                        //  No character received.
                    }

                    //  Go to CTRLWAIT state if 1.5 character time expires.
                    try {
                        //  Wait for signal.
                        await wh2;

                        //  Go to CTRLWAIT state.
                        state = STATE_CTRLWAIT;

                        continue;
                    } catch(error) {
                        //  Not expired.
                    }

                    //  Handle other signal(s).
                    let wh = rsv.getPromiseObject();
                    if (wh == wh1) {
                        //  Go to RECEPTION state.
                        state = STATE_RECEPTION;
                    } else if (wh == wh3 || wh == wh4) {
                        break;
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            } else if (state == STATE_CTRLWAIT) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = port.rxNext(cts);
                let wh2 = flags.pend(
                    BITMASK_CHRTMR3Z5, 
                    EventFlags.PEND_FLAG_SET_ALL, 
                    cts
                );
                let wh3 = syncCmdClose.waitWithCancellator(cts);
                let wh4 = syncCmdTerminate.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
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

                //  Move the character and NOK the frame if we got one.
                try {
                    //  Wait for signal.
                    await wh1;

                    //  Move the character.
                    _RxBuf_MoveByte();

                    //  NOK the frame.
                    rxNOK = true;
                } catch(error) {
                    //  No character received.
                }

                //  Go to IDLE state if 3.5 character time expires.
                try {
                    //  Wait for signal.
                    await wh2;

                    //  Disable the character time timer.
                    port.timerSetInterval(0);

                    //  Handle the frame.
                    if (!rxNOK) {
                        _HandleFrame(rxBuffer.slice(0, rxBufferWriteOffset));
                    } else {
                        if (rxOvrrun) {
                            //  Increase the 'Bus Character Overrun' counter.
                            ++(cntrBusCharOvrRun);
                        }

                        //  Increase the 'Bus Communication Error' counter.
                        ++(cntrBusCommError);
                    }

                    //  Go to IDLE state.
                    state = STATE_IDLE;

                    continue;
                } catch(error) {
                    //  Not expired.
                }

                //  Handle other signal(s).
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Go to CTRLWAIT state.
                    state = STATE_CTRLWAIT;
                } else if (wh == wh3 || wh == wh4) {
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else {
                ReportBug("Invalid wait handler.");
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ));
    }).finally(function() {
        //  Trigger the closed signal.
        syncClosed.fullfill();

        //  Dispose the serial port.
        port.dispose();

        //  Mark RX as ended.
        rxEnded = true;

        //  Emit "end" event.
        self.emit("end");
    });
}
Util.inherits(MBRtuTransceiver, EventEmitter);

//  Export public APIs.
module.exports = {
    "CHRTMSCL_DFLT": CHRTMSCL_DFLT,
    "CHRTMSCL_MIN": CHRTMSCL_MIN,
    "CHRTMSCL_MAX": CHRTMSCL_MAX,
    "MBRtuTransceiverOption": MBRtuTransceiverOption,
    "MBRtuTransceiver": MBRtuTransceiver
};