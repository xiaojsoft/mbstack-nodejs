//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterBuiltinsParserFC04 = 
    require("./parser-fc04");
const MbPrMasterCmd = 
    require("./../cmd");
const MbPrCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBMasterProtocolReadInputRegistersParser = 
    MbPrMasterBuiltinsParserFC04.MBMasterProtocolReadInputRegistersParser;
const MBMasterProtocolCommand = 
    MbPrMasterCmd.MBMasterProtocolCommand;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Constants.
//

//  Function code.
const FUNCTION_CODE = 0x04;

//
//  Public functions.
//

/**
 *  Create a new read input registers (0x04) command.
 * 
 *  Note(s):
 *    [1] The start address of the input registers must be an integer within 
 *        0x0000 ~ 0xFFFF.
 *    [2] The quantity of input registers must be an integer within 
 *        0x00 (0) ~ 0x7D (125).
 * 
 *  @throws {MBParameterError}
 *    - Either the start address or the quantity of input registers is invalid.
 *  @param {Number} iregStartAddr 
 *    - The start address of the input registers.
 *  @param {Number} iregQuantity 
 *    - The quantity of the input registers.
 */
function NewReadInputRegistersCommand(
    iregStartAddr,
    iregQuantity
) {
    //  Check the start address.
    if (!(
        Number.isInteger(iregStartAddr) && 
        iregStartAddr >= 0x0000 && 
        iregStartAddr <= 0xFFFF
    )) {
        throw new MBParameterError("Invalid input registers start address.");
    }

    //  Check the quantity.
    if (!(
        Number.isInteger(iregQuantity) && 
        iregQuantity >= 0x00 && 
        iregQuantity <= 0x7D
    )) {
        throw new MBParameterError("Invalid input registers quantity.");
    }

    //  Build the query PDU.
    let queryData = Buffer.allocUnsafe(4);
    queryData.writeUInt16BE(iregStartAddr, 0);
    queryData.writeUInt16BE(iregQuantity, 2);
    let queryPDU = new MBPDU(FUNCTION_CODE, queryData);

    //  Build the response parser.
    let ansParser = new MBMasterProtocolReadInputRegistersParser(
        iregQuantity
    );

    //  Create command.
    return new MBMasterProtocolCommand(queryPDU, ansParser);
}

//  Export public APIs.
module.exports = {
    "NewReadInputRegistersCommand": NewReadInputRegistersCommand
};