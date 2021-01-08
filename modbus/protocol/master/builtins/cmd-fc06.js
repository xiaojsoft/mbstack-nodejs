//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC06 = require("./parser-fc06");
const MbPrMasterCmd = require("./../cmd");
const MbPrCore = require("./../../core");
const MbError = require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolWriteSingleRegisterParser = 
    MbPrMasterBuiltinsParserFC06.MBMasterProtocolWriteSingleRegisterParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x06;

//
//  Public functions.
//

/**
 *  Create a new write single register (0x06) command.
 * 
 *  Note(s):
 *    [1] The address of the register must be an integer within 0x0000 ~ 0xFFFF.
 *    [2] The value of the register must be an integer within 0x0000 ~ 0xFFFF.
 * 
 *  @throws {MBParameterError}
 *    - The address of the register is invalid.
 *  @param {Number} hregAddr 
 *    - The address of the register.
 *  @param {Number} hregValue 
 *    - The value of the register.
 */
function NewWriteSingleRegisterCommand(
    hregAddr,
    hregValue
) {
    //  Check the register address.
    if (!(
        Number.isInteger(hregAddr) && 
        hregAddr >= 0x0000 && 
        hregAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid register address.");
    }

    //  Check the register value.
    if (!(
        Number.isInteger(hregValue) && 
        hregValue >= 0x0000 && 
        hregValue <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid register value.");
    }

    //  Build the query PDU.
    let queryData = Buffer.allocUnsafe(4);
    queryData.writeUInt16BE(hregAddr, 0);
    queryData.writeUInt16BE(hregValue, 2);
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolWriteSingleRegisterParser(
        hregAddr, 
        hregValue
    );

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewWriteSingleRegisterCommand": NewWriteSingleRegisterCommand
};