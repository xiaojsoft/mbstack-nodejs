//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC0F = 
    require("./parser-fc0f");
const MbPrMasterCmd = 
    require("./../cmd");
const MbPrCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolWriteMultipleCoilsParser = 
    MbPrMasterBuiltinsParserFC0F.MBMasterProtocolWriteMultipleCoilsParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x0F;

//
//  Public functions.
//

/**
 *  Create a new write multiple coils (0x0F) command.
 * 
 *  Note(s):
 *    [1] The starting address of the coils must be an integer within 
 *        0x0000 ~ 0xFFFF.
 *    [2] The count of coils to be written must be within 0x001 and 0x07B0.
 * 
 *  @throws {MBParameterError}
 *    - Either the starting address or value array of the coils is invalid.
 *  @param {Number} coilStartAddr 
 *    - The starting address of the coils.
 *  @param {Boolean[]} coilValues 
 *    - The value of the coils.
 */
function NewWriteMultipleCoilsCommand(
    coilStartAddr,
    coilValues
) {
    //  Check the coil starting address.
    if (!(
        Number.isInteger(coilStartAddr) && 
        coilStartAddr >= 0x0000 && 
        coilStartAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid coil starting address.");
    }

    //  Check the coil quantity.
    let coilQuantity = coilValues.length;
    if (coilQuantity == 0x0000 || coilQuantity > 0x07B0) {
        throw new MBParameterError("Invalid coil count.");
    }

    //  Build the query PDU.
    let hasExtraCoilByte = ((coilQuantity & 7) != 0);
    let nCoilBytes = (
        hasExtraCoilByte ? 
        ((coilQuantity >> 3) + 1) : 
        (coilQuantity >> 3)
    );
    let queryData = Buffer.allocUnsafe(5 + nCoilBytes);
    queryData.writeUInt16BE(coilStartAddr, 0);
    queryData.writeUInt16BE(coilQuantity, 2);
    queryData.writeUInt8(nCoilBytes, 4);
    let coilByteOffset = 5;
    let coilByteValue = 0x00;
    let coilBitMask = 0x01;
    for (let i = 0; i < coilQuantity; ++i) {
        if (coilValues[i]) {
            coilByteValue |= coilBitMask;
        }
        if (coilBitMask == 0x80) {
            queryData.writeUInt8(coilByteValue, coilByteOffset);
            ++coilByteOffset;
            coilByteValue = 0x00;
            coilBitMask = 0x01;
        } else {
            coilBitMask <<= 1;
        }
    }
    if (hasExtraCoilByte) {
        queryData.writeUInt8(coilByteValue, coilByteOffset);
    }

    //  Build the query PDU.
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolWriteMultipleCoilsParser(
        coilStartAddr, 
        coilQuantity
    );

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewWriteMultipleCoilsCommand": NewWriteMultipleCoilsCommand
};