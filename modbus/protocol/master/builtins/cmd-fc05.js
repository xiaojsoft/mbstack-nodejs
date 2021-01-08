//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC05 = require("./parser-fc05");
const MbPrMasterCmd = require("./../cmd");
const MbPrCore = require("./../../core");
const MbError = require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolWriteSingleCoilParser = 
    MbPrMasterBuiltinsParserFC05.MBMasterProtocolWriteSingleCoilParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x05;

//
//  Public functions.
//

/**
 *  Create a new write single coil (0x05) command.
 * 
 *  Note(s):
 *    [1] The output address of the coil must be an integer within 
 *        0x0000 ~ 0xFFFF.
 * 
 *  @throws {MBParameterError}
 *    - The address of the coil is invalid.
 *  @param {Number} outputAddr 
 *    - The address of the coil.
 *  @param {Boolean} outputValue 
 *    - The value of the coil.
 */
function NewWriteSingleCoilCommand(
    outputAddr,
    outputValue
) {
    //  Check the output address.
    if (!(
        Number.isInteger(outputAddr) && 
        outputAddr >= 0x0000 && 
        outputAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid output address.");
    }

    //  Cast the output value to Number.
    if (outputValue) {
        outputValue = 0xFF00;
    } else {
        outputValue = 0x0000;
    }

    //  Build the query PDU.
    let queryData = Buffer.allocUnsafe(4);
    queryData.writeUInt16BE(outputAddr, 0);
    queryData.writeUInt16BE(outputValue, 2);
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolWriteSingleCoilParser(
        outputAddr, 
        outputValue
    );

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewWriteSingleCoilCommand": NewWriteSingleCoilCommand
};