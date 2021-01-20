//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC01 = 
    require("./parser-fc01");
const MbPrMasterCmd = 
    require("./../cmd");
const MbPrCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolReadCoilsParser = 
    MbPrMasterBuiltinsParserFC01.MBMasterProtocolReadCoilsParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x01;

//
//  Public functions.
//

/**
 *  Create a new read coils (0x01) command.
 * 
 *  Note(s):
 *    [1] The start address of the coils must be an integer within 
 *        0x0000 ~ 0xFFFF.
 *    [2] The quantity of coils must be an integer within 
 *        0x000 (0) ~ 0x7D0 (2000).
 * 
 *  @throws {MBParameterError}
 *    - Either the start address or the quantity of coils is invalid.
 *  @param {Number} coilStartAddr 
 *    - The start address of the coils.
 *  @param {Number} coilQuantity 
 *    - The quantity of the coils.
 *  @returns {MBMasterProtocolCommand}
 *    - The command.
 */
function NewReadCoilsCommand(
    coilStartAddr,
    coilQuantity
) {
    //  Check the start address.
    if (!(
        Number.isInteger(coilStartAddr) && 
        coilStartAddr >= 0x0000 && 
        coilStartAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid coil start address.");
    }

    //  Check the quantity.
    if (!(
        Number.isInteger(coilQuantity) && 
        coilQuantity >= 0x000 && 
        coilQuantity <= 0x7D0
    )) {
        throw new MBParameterError("Invalid coil quantity.");
    }

    //  Build the query PDU.
    let queryData = Buffer.allocUnsafe(4);
    queryData.writeUInt16BE(coilStartAddr, 0);
    queryData.writeUInt16BE(coilQuantity, 2);
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolReadCoilsParser(coilQuantity);

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewReadCoilsCommand": NewReadCoilsCommand
};