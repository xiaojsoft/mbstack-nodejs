//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC02 = 
    require("./parser-fc02");
const MbPrMasterCmd = 
    require("./../cmd");
const MbPrCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolReadDiscreteInputsParser = 
    MbPrMasterBuiltinsParserFC02.MBMasterProtocolReadDiscreteInputsParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x02;

//
//  Public functions.
//

/**
 *  Create a new read discrete inputs (0x02) command.
 * 
 *  Note(s):
 *    [1] The start address of the discrete inputs must be an integer within 
 *        0x0000 ~ 0xFFFF.
 *    [2] The quantity of discrete inputs must be an integer within 
 *        0x000 (0) ~ 0x7D0 (2000).
 * 
 *  @throws {MBParameterError}
 *    - Either the start address or the quantity of discrete inputs is invalid.
 *  @param {Number} dciStartAddr 
 *    - The start address of the discrete inputs.
 *  @param {Number} dciQuantity 
 *    - The quantity of the discrete inputs.
 *  @returns {MBMasterProtocolCommand}
 *    - The command.
 */
function NewReadDiscreteInputsCommand(
    dciStartAddr,
    dciQuantity
) {
    //  Check the start address.
    if (!(
        Number.isInteger(dciStartAddr) && 
        dciStartAddr >= 0x0000 && 
        dciStartAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid discrete inputs start address.");
    }

    //  Check the quantity.
    if (!(
        Number.isInteger(dciQuantity) && 
        dciQuantity >= 0x000 && 
        dciQuantity <= 0x7D0
    )) {
        throw new MBParameterError("Invalid discrete inputs quantity.");
    }

    //  Build the query PDU.
    let queryData = Buffer.allocUnsafe(4);
    queryData.writeUInt16BE(dciStartAddr, 0);
    queryData.writeUInt16BE(dciQuantity, 2);
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolReadDiscreteInputsParser(dciQuantity);

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewReadDiscreteInputsCommand": NewReadDiscreteInputsCommand
};