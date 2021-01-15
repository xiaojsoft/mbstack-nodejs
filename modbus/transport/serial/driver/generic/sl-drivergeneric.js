//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlDriverGenericRX = 
    require("./sl-drivergeneric-rx");
const MbTspSlDriverGenericTX = 
    require("./sl-drivergeneric-tx");
const MbTspSlDriverGenericTMR = 
    require("./sl-drivergeneric-tmr");
const MbTspSlDriverCore = 
    require("./../sl-drivercore");
const MbError = 
    require("./../../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const SerialPort = 
    require("serialport");
const Util = 
    require("util");

//  Imported classes.
const MBGenericSerialPortReceiverOption = 
    MbTspSlDriverGenericRX.MBGenericSerialPortReceiverOption;
const MBGenericSerialPortReceiver = 
    MbTspSlDriverGenericRX.MBGenericSerialPortReceiver;
const MBGenericSerialPortTransmitter = 
    MbTspSlDriverGenericTX.MBGenericSerialPortTransmitter;
const MBGenericSerialPortTimer = 
    MbTspSlDriverGenericTMR.MBGenericSerialPortTimer;
const MBSerialPortOption = 
    MbTspSlDriverCore.MBSerialPortOption;
const IMBSerialPort = 
    MbTspSlDriverCore.IMBSerialPort;
const IMBSerialPortDriver = 
    MbTspSlDriverCore.IMBSerialPortDriver;
const MBBugError = 
    MbError.MBBugError;
const MBDeviceError = 
    MbError.MBDeviceError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBParameterError = 
    MbError.MBParameterError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//  Imported constants.
const MBSL_PARITY_NONE = 
    MbTspSlDriverCore.MBSL_PARITY_NONE;
const MBSL_PARITY_EVEN = 
    MbTspSlDriverCore.MBSL_PARITY_EVEN;
const MBSL_PARITY_ODD = 
    MbTspSlDriverCore.MBSL_PARITY_ODD;

//
//  Constants.
//

//  Driver name.
const DRIVER_NAME = "generic";

//  RX buffer size.
const RXBUFSIZE = 65536;

//
//  Classes.
//

/**
 *  Modbus generic serial port.
 * 
 *  @constructor
 *  @param {SerialPort} serialport
 *    - The serial port.
 *  @param {MBSerialPortOption} options
 *    - The serial port options.
 */
function MBGenericSerialPort(serialport, options) {
    //  Let parent class initialize.
    IMBSerialPort.call(this);

    //
    //  Members.
    //

    //  Timer.
    let tmr = new MBGenericSerialPortTimer();

    //  Transceiver.
    let rxOptions = new MBGenericSerialPortReceiverOption();
    rxOptions.setMaxBufferByteCount(RXBUFSIZE);
    let rx = new MBGenericSerialPortReceiver(rxOptions);
    let tx = new MBGenericSerialPortTransmitter(serialport);

    //  Synchronizers.
    let syncCmdDispose = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Get the serial port options.
     * 
     *  @returns {MBSerialPortOption}
     *    - The serial port options.
     */
    this.getPortOptions = function() {
        return options;
    };

    /**
     *  Restart the timer.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     */
    this.timerRestart = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Restart the timer.
        tmr.restart();
    };

    /**
     *  Set the timer tick callback.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @param {() => void} cb
     *    - The tick callback.
     */
    this.timerSetTickCallback = function(cb) {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Set the callback.
        tmr.setTickCallback(cb);
    };

    /**
     *  Get the timer tick callback.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @returns {() => void}
     *    - The tick callback.
     */
    this.timerGetTickCallback = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Get the callback.
        return tmr.getTickCallback();
    };

    /**
     *  Set the timer tick interval.
     * 
     *  Note(s):
     *    [1] The tick interval must be an integer.
     *    [2] Negative tick interval is not allowed.
     *    [3] Zero tick interval would cause the timer to be disabled.
     * 
     *  @throws {MBParameterError}
     *    - The tick interval is invalid.
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @param {Number} ns
     *    - The tick interval (unit: nanoseconds)
     */
    this.timerSetInterval = function(ns) {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Set the interval.
        tmr.setInterval(ns);
    };

    /**
     *  Get the timer tick interval.
     * 
     *  Note(s):
     *    [1] Zero tick interval means the timer was disabled.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @returns {Number}
     *    - The tick interval (unit: nanoseconds).
     */
    this.timerGetInterval = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Get the interval.
        return tmr.getInterval();
    };

    /**
     *  Reset the RX internal buffer overrun flag.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     */
    this.rxResetBufferOverrun = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Reset the overrun flag.
        rx.clearBufferOverrun();
    };

    /**
     *  Get whether the RX internal buffer overrun flag was set.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @returns {Boolean}
     *    - True if so.
     */
    this.rxIsBufferOverrun = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Get the overrun flag.
        return rx.isBufferOverrun();
    };

    /**
     *  Get whether RX current character is valid.
     * 
     *  Note(s):
     *    [1] A character is valid means its parity bit and UART frame 
     *        structure are both correct.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @returns {Boolean}
     *    - True if so.
     */
    this.rxIsCharacterValid = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Get the character validity.
        return rx.isCurrentCharacterValid();
    };

    /**
     *  Get RX current character.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @returns {Number}
     *    - The character.
     */
    this.rxGetCharacter = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Get current character.
        return rx.getCurrentCharacter();
    };

    /**
     *  Move one character from RX internal buffer to RX current character.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @throws {MBDeviceError}
     *    - Device failure.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<void>}
     *    - The promise object (resolves with if succeed, rejects if error 
     *      occurred).
     */
    this.rxNext = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Wait for signals.
        let cts = new ConditionalSynchronizer();
        let wh1 = rx.next(cts);
        let wh2 = syncCmdDispose.waitWithCancellator(cts);
        let wh3 = cancellator.waitWithCancellator(cts);
        let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
        cts.fullfill();

        //  Handle the signal.
        let wh = rsv.getPromiseObject();
        if (wh == wh1) {
            return;
        } else {
            //  Wait for wait handler 1 to be settled.
            try {
                await wh1;
                return;
            } catch(error) {
                //  Operation cancelled. Do nothing.
            }

            if (wh == wh2) {
                throw new MBInvalidOperationError(
                    "The serial port was already disposed."
                );
            } else if (wh == wh3) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    };

    /**
     *  TX transmit data.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @throws {MBDeviceError}
     *    - Device failure.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @param {Buffer} data
     *    - The data.
     *  @returns {Promise<void>}
     *    - The promise object (resolves with if succeed, rejects if error 
     *      occurred).
     */
    this.txTransmit = async function(
        data,
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Transmit the data.
        await tx.transmit(data);
    };

    /**
     *  Dispose the serial port.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     */
    this.dispose = function() {
        //  Throw if disposed.
        if (syncCmdDispose.isFullfilled()) {
            throw new MBInvalidOperationError(
                "The serial port was already disposed."
            );
        }

        //  Trigger the dispose signal.
        syncCmdDispose.fullfill();

        //  Stop the timer.
        tmr.setInterval(0);
    };

    //
    //  Coroutine(s).
    //

    //  Main coroutine.
    (async function() {
        //  Create local synchronizers.
        let syncLocalPortClosed = new ConditionalSynchronizer();
        
        /**
         *  Handle serial port "data" event.
         */
        function _HandlePortData(data) {
            if (syncCmdDispose.isFullfilled()) {
                return;
            }
            rx.input(data);
        }

        /**
         *  Handle serial port "close" event.
         */
        function _HandlePortClose() {
            //  Trigger the port closed signal.
            syncLocalPortClosed.fullfill();

            //  Detach events.
            serialport.off("data", _HandlePortData);
            serialport.off("close", _HandlePortClose);
        }

        //  Attach events.
        serialport.on("data", _HandlePortData);
        serialport.on("close", _HandlePortClose);

        //  Wait for dispose signal.
        await syncCmdDispose.wait();

        //  Close the serial port.
        if (!syncLocalPortClosed.isFullfilled()) {
            serialport.close();
        }

        //  Wait for the serial port to be closed.
        await syncLocalPortClosed.wait();
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main coroutine throw an exception (error=\"%s\").", 
            error.message || "Unknown error."
        ), false, MBBugError);
    });
}

/**
 *  Modbus generic serial port driver.
 * 
 *  @constructor
 */
function MBGenericSerialPortDriver() {
    //  Let parent class initialize.
    IMBSerialPortDriver.call(this);

    //
    //  Public methods.
    //

    /**
     *  Get the driver name.
     * 
     *  @returns {String}
     *    - The driver name.
     */
    this.getDriverName = function() {
        return DRIVER_NAME;
    };

    /**
     *  Open a serial port.
     * 
     *  @throws {MBDeviceError}
     *    - Device failure.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {String} dev
     *    - The serial port device path.
     *  @param {MBSerialPortOption} options
     *    - The serial port options.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {IMBSerialPort}
     *    - The promise object (resolves with the serial port instance if 
     *      succeed, rejects if error occurred).
     */
    this.open = async function(
        dev,
        options,
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Build the serial port open options.
        let optdict = {
            "autoOpen": true,
            "baudRate": options.getBaudrate(),
            "dataBits": options.getDataBits(),
            "stopBits": options.getStopBits(),
            "lock": true
        };
        switch (options.getParityType()) {
        case MBSL_PARITY_NONE:
            optdict["parity"] = "none";
            break;
        case MBSL_PARITY_EVEN:
            optdict["parity"] = "even";
            break;
        case MBSL_PARITY_ODD:
            optdict["parity"] = "odd";
            break;
        default:
            ReportBug("Invalid parity type.", true, MBBugError);
        }

        //  Create synchronizers.
        let syncPortOpened = new ConditionalSynchronizer();
        let syncPortError = new ConditionalSynchronizer();
        let syncPortClosed = new ConditionalSynchronizer();

        //  Create serial port.
        let port = new SerialPort(dev, optdict, function() {
            syncPortOpened.fullfill();
        });
        port.on("error", function(error) {
            syncPortError.fullfill(new MBDeviceError(Util.format(
                "Device exception (error=\"%s\").",
                error.message || "Unknown error."
            )));
        });
        port.on("close", function() {
            syncPortClosed.fullfill();
        });

        //  Wait for the port to be opened.
        {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = syncPortOpened.waitWithCancellator(cts);
            let wh2 = syncPortError.waitWithCancellator(cts);
            let wh3 = cancellator.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Succeed.
            } else {
                //  Close the port.
                if (!syncPortClosed.isFullfilled()) {
                    port.close();
                }

                //  Wait for the port to be closed.
                await syncPortClosed.wait();

                if (wh == wh2) {
                    throw rsv.getValue();
                } else if (wh == wh3) {
                    throw new MBOperationCancelledError(
                        "The cancellator was activated."
                    );
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
        }
        
        //  Create instance.
        return new MBGenericSerialPort(port, options);
    };
}

//  Driver name.
MBGenericSerialPortDriver.DRIVER_NAME = DRIVER_NAME;

//  Global driver instance.
MBGenericSerialPortDriver.INSTANCE = new MBGenericSerialPortDriver();

//
//  Inheritances.
//
Util.inherits(MBGenericSerialPort, IMBSerialPort);
Util.inherits(MBGenericSerialPortDriver, IMBSerialPortDriver);

//  Export public APIs.
module.exports = {
    "MBGenericSerialPort": MBGenericSerialPort,
    "MBGenericSerialPortDriver": MBGenericSerialPortDriver
};