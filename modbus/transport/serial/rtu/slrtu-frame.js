//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbConventions = 
    require("./../../../conventions");
const MbError = 
    require("./../../../../error");
const Util = 
    require("util");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError

//  Imported constants.
const MAX_PDU_DATA_LENGTH = 
    MbConventions.MAX_PDU_DATA_LENGTH;

//
//  Classes.
//

/**
 *  Modbus RTU frame.
 * 
 *  Note(s):
 *    [1] The address must be an integer between 0x00 and 0xFF.
 *    [2] The function code must be an integer between 0x00 and 0xFF.
 *    [3] The length of the data must be no longer than MAX_PDU_DATA_LENGTH.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - The address, function code or length of the data is invalid.
 *  @param {Number} address
 *    - The address.
 *  @param {Number} functionCode
 *    - The function code.
 *  @param {Buffer} data
 *    - The data.
 */
function MBRtuFrame(
    address,
    functionCode,
    data
) {
    //
    //  Parameter check.
    //

    //  Check the address.
    if (!(
        Number.isInteger(address) && 
        address >= 0x00 && 
        address <= 0xFF
    )) {
        throw new MBParameterError("Address is invalid.");
    }

    //  Check the function code.
    if (!(
        Number.isInteger(functionCode) && 
        functionCode >= 0x00 && 
        functionCode <= 0xFF
    )) {
        throw new MBParameterError("Function code is invalid.");
    }

    //  Check the data.
    if (data.length > MAX_PDU_DATA_LENGTH) {
        throw new MBParameterError(Util.format(
            "Data is too long (> %d).",
            MAX_PDU_DATA_LENGTH
        ));
    }

    //
    //  Public methods.
    //

    /**
     *  Get the address.
     * 
     *  @returns {Number}
     *    - The address.
     */
    this.getAddress = function() {
        return address;
    };

    /**
     *  Get the function code.
     * 
     *  @returns {Number}
     *    - The function code.
     */
    this.getFunctionCode = function() {
        return functionCode;
    };

    /**
     *  Get the data.
     * 
     *  @returns {Buffer}
     *    - The data.
     */
    this.getData = function() {
        return data;
    };
}

//  Export public APIs.
module.exports = {
    "MBRtuFrame": MBRtuFrame
};