//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbError = 
    require("./../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBDeviceError = 
    MbError.MBDeviceError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

//
//  Constants.
//

//  Data bit counts.
const MBSL_DATABIT_7 = 7;
const MBSL_DATABIT_8 = 8;

//  Parity types.
const MBSL_PARITY_NONE = 0;
const MBSL_PARITY_ODD = 1;
const MBSL_PARITY_EVEN = 2;

//  Stop bit counts.
const MBSL_STOPBIT_1 = 1;
const MBSL_STOPBIT_2 = 2;

//
//  Classes.
//

/**
 *  Interface of all Modbus serial port classes.
 * 
 *  @constructor
 */
function IMBSerialPort() {
    //
    //  Public methods.
    //

    /**
     *  Set the timer tick callback.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     *  @param {() => void} cb
     *    - The tick callback.
     */
    this.timerSetTickCallback = function(cb) {
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
    };

    /**
     *  Reset the RX internal buffer overrun flag.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     */
    this.rxResetBufferOverrun = function() {
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
    };

    /**
     *  Dispose the serial port.
     * 
     *  @throws {MBInvalidOperationError}
     *    - The serial port was already disposed.
     */
    this.dispose = function() {
        throw new Error("Not implemented.");
    };
}

/**
 *  Modbus serial port options.
 * 
 *  Note(s):
 *    [1] The baudrate must be a positive integer.
 *    [2] The count of data bits must be one of MBSL_DATABIT_*.
 *    [3] The count of stop bits must be one of MBSL_STOPBIT_*.
 *    [4] The parity type must be one of MBSL_PARITY_*.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - The baudrate, the count of data bits, the count of stop bits or the 
 *      parity type is invalid.
 *  @param {Number} baudrate
 *    - The baudrate (unit: bit/s).
 *  @param {Number} nDataBits
 *    - The count of data bits (each character) (one of MBSL_DATABIT_*).
 *  @param {Number} nStopBits
 *    - The count of stop bits (each character) (one of MBSL_STOPBIT_*).
 *  @param {Number} parity
 *    - The parity type (one of MBSL_PARITY_*).
 */
function MBSerialPortOption(
    baudrate,
    nDataBits,
    nStopBits,
    parity
) {
    //
    //  Parameter check.
    //

    //  Check the baudrate.
    if (!(Number.isInteger(baudrate) && baudrate > 0)) {
        throw new MBParameterError("Invalid baudrate.");
    }

    //  Check the data bit count.
    switch (nDataBits) {
    case MBSL_DATABIT_7:
    case MBSL_DATABIT_8:
        break;
    default:
        throw new MBParameterError("Invalid data bit count.");
    }

    //  Check the stop bit count.
    switch (nStopBits) {
    case MBSL_STOPBIT_1:
    case MBSL_STOPBIT_2:
        break;
    default:
        throw new MBParameterError("Invalid stop bit count.");
    }

    //  Check the parity type.
    switch (parity) {
    case MBSL_PARITY_EVEN:
    case MBSL_PARITY_ODD:
    case MBSL_PARITY_NONE:
        break;
    default:
        throw new MBParameterError("Invalid parity type.");
    }

    //
    //  Public methods.
    //

    /**
     *  Get the baudrate.
     * 
     *  @returns {Number}
     *    - The baudrate (unit: bit/s).
     */
    this.getBaudrate = function() {
        return baudrate;
    };

    /**
     *  Get the count of data bits (each character).
     * 
     *  @returns {Number}
     *    - The count (one of MBSL_DATABIT_*).
     */
    this.getDataBits = function() {
        return nDataBits;
    };

    /**
     *  Get the count of stop bits (each character).
     * 
     *  @returns {Number}
     *    - The count (one of MBSL_STOPBIT_*).
     */
    this.getStopBits = function() {
        return nStopBits;
    };

    /**
     *  Get the parity type.
     * 
     *  @returns {Number}
     *    - The parity type (one of MBSL_PARITY_*).
     */
    this.getParityType = function() {
        return parity;
    };
}

/**
 *  Interface of all Modbus serial port driver classes.
 * 
 *  @constructor
 */
function IMBSerialPortDriver() {
    //
    //  Public methods.
    //

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
        throw new Error("Not implemented.");
    };
}

//  Export public APIs.
module.exports = {
    "MBSL_DATABIT_7": MBSL_DATABIT_7,
    "MBSL_DATABIT_8": MBSL_DATABIT_8,
    "MBSL_PARITY_NONE": MBSL_PARITY_NONE,
    "MBSL_PARITY_ODD": MBSL_PARITY_ODD,
    "MBSL_PARITY_EVEN": MBSL_PARITY_EVEN,
    "MBSL_STOPBIT_1": MBSL_STOPBIT_1,
    "MBSL_STOPBIT_2": MBSL_STOPBIT_2,
    "MBSerialPortOption": MBSerialPortOption,
    "IMBSerialPort": IMBSerialPort,
    "IMBSerialPortDriver": IMBSerialPortDriver
};