//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC10 = 
    require("./parser-fc10");
const MbPrMasterCmd = 
    require("./../cmd");
const MbPrCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolWriteMultipleRegistersParser = 
    MbPrMasterBuiltinsParserFC10.MBMasterProtocolWriteMultipleRegistersParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x10;

//
//  Public functions.
//

/**
 *  Create a new write multiple registers (0x10) command.
 * 
 *  Note(s):
 *    [1] The starting address of the registers must be an integer within 
 *        0x0000 ~ 0xFFFF.
 *    [2] The count of registers to be written must be within 0x01 ~ 0x7B.
 *    [3] The value of each register to be written must be an integer within 
 *        0x0000 ~ 0xFFFF.
 * 
 *  @throws {MBParameterError}
 *    - Either the starting address or value array of the registers is invalid.
 *  @param {Number} hregStartAddr 
 *    - The starting address of the registers.
 *  @param {Number[]} hregValues 
 *    - The value of the registers.
 *  @returns {MBMasterProtocolCommand}
 *    - The command.
 */
function NewWriteMultipleRegistersCommand(
    hregStartAddr,
    hregValues
) {
    //  Check the register starting address.
    if (!(
        Number.isInteger(hregStartAddr) && 
        hregStartAddr >= 0x0000 && 
        hregStartAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid register starting address.");
    }

    //  Check the register quantity.
    let hregQuantity = hregValues.length;
    if (hregQuantity == 0x00 || hregQuantity > 0x7B) {
        throw new MBParameterError("Invalid register count.");
    }

    //  Build the query PDU.
    let nRegValueBytes = (hregQuantity << 1);
    let queryData = Buffer.allocUnsafe(5 + nRegValueBytes);
    queryData.writeUInt16BE(hregStartAddr, 0);
    queryData.writeUInt16BE(hregQuantity, 2);
    queryData.writeUInt8(nRegValueBytes, 4);
    for (let i = 0, offset = 5; i < hregQuantity; ++i, offset += 2) {
        queryData.writeUInt16BE(hregValues[i], offset);
    }

    //  Build the query PDU.
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolWriteMultipleRegistersParser(
        hregStartAddr, 
        hregQuantity
    );

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewWriteMultipleRegistersCommand": NewWriteMultipleRegistersCommand
};