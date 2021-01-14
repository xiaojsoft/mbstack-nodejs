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
    require("./../../../../../error");
const SerialPort = 
    require("serialport");
const Util = 
    require("util");

//  Imported classes.
const MBDeviceError = 
    MbError.MBDeviceError;

//
//  Classes.
//

/**
 *  Modbus generic serial port transmitter.
 * 
 *  @constructor
 *  @param {SerialPort} serialport
 *    - The serial port.
 */
function MBGenericSerialPortTransmitter(
    serialport
) {
    //
    //  Public methods.
    //

    /**
     *  Transmit data.
     * 
     *  @throws {MBDeviceError}
     *    - Transmit failure.
     *  @param {Buffer} data
     *    - The data.
     *  @returns {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred).
     */
    this.transmit = function(data) {
        return new Promise(function(resolve, reject) {
            serialport.write(data, function(error) {
                if (error) {
                    reject(new MBDeviceError(Util.format(
                        "Transmit failure (error=\"%s\").",
                        error.message || "Unknown error."
                    )));
                } else {
                    resolve();
                }
            });
        });
    };
}

//  Export public APIs.
module.exports = {
    "MBGenericSerialPortTransmitter": MBGenericSerialPortTransmitter
};