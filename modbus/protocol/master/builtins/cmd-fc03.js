//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC03 = require("./parser-fc03");
const MbPrMasterCmd = require("./../cmd");
const MbPrCore = require("./../../core");
const MbError = require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolReadHoldingRegistersParser = 
    MbPrMasterBuiltinsParserFC03.MBMasterProtocolReadHoldingRegistersParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x03;

//
//  Public functions.
//

/**
 *  Create a new read holding registers (0x03) command.
 * 
 *  Note(s):
 *    [1] The start address of the holding registers must be an integer within 
 *        0x0000 ~ 0xFFFF.
 *    [2] The quantity of holding registers must be an integer within 
 *        0x00 (0) ~ 0x7D (125).
 * 
 *  @throws {MBParameterError}
 *    - Either the start address or the quantity of holding registers is invalid.
 *  @param {Number} hregStartAddr 
 *    - The start address of the holding registers.
 *  @param {Number} hregQuantity 
 *    - The quantity of the holding registers.
 */
function NewReadHoldingRegistersCommand(
    hregStartAddr,
    hregQuantity
) {
    //  Check the start address.
    if (!(
        Number.isInteger(hregStartAddr) && 
        hregStartAddr >= 0x0000 && 
        hregStartAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid holding registers start address.");
    }

    //  Check the quantity.
    if (!(
        Number.isInteger(hregQuantity) && 
        hregQuantity >= 0x00 && 
        hregQuantity <= 0x7D
    )) {
        throw new MBParameterError("Invalid holding registers quantity.");
    }

    //  Build the query PDU.
    let queryData = Buffer.allocUnsafe(4);
    queryData.writeUInt16BE(hregStartAddr, 0);
    queryData.writeUInt16BE(hregQuantity, 2);
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolReadHoldingRegistersParser(
        hregQuantity
    );

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewReadHoldingRegistersCommand": NewReadHoldingRegistersCommand
};