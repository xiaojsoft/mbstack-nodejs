//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterParser = 
    require("./../parser");
const MbPrCore = 
    require("./../../core");
const MbError = 
    require("./../../../../error");
const Util = 
    require("util");

//  Imported classes.
const MBPDU = 
    MbPrCore.MBPDU;
const MBParseError = 
    MbError.MBParseError;
const MBMasterProtocolParserOut = 
    MbPrMasterParser.MBMasterProtocolParserOut;
const IMBMasterProtocolParser = 
    MbPrMasterParser.IMBMasterProtocolParser;

//
//  Classes.
//

/**
 *  Modbus master protocol-layer write single register (0x06) parser.
 * 
 *  Note(s):
 *    [1] NULL is always provided as the data of the parsed output.
 * 
 *  @constructor
 *  @param {Number} hregAddr 
 *    - The expected register address.
 *  @param {Number} hregValue
 *    - The expected register value.
 */
function MBMasterProtocolWriteSingleRegisterParser(
    hregAddr, 
    hregValue
) {
    //  Let parent class initialize.
    IMBMasterProtocolParser.call(this);

    //
    //  Public methods.
    //

    /**
     *  Parse a answer (response) protocol data unit (PDU).
     * 
     *  @throws {MBParseError}
     *    - Failed to parse.
     *  @param {MBPDU} pdu 
     *    - The answer (response) protocol data unit (PDU).
     *  @returns {MBMasterProtocolParserOut}
     *    - The parser output.
     */
    this.parse = function(pdu) {
        //  Get function code and data.
        let ansFnCode = pdu.getFunctionCode();
        let ansData = pdu.getData();

        //  Check exception.
        if ((ansFnCode & 0x80) != 0) {
            if (ansData.length == 0) {
                throw new MBParseError("Exception code can't be read.");
            }
            return new MBMasterProtocolParserOut(
                true, 
                ansData.readUInt8(0), 
                null
            );
        }

        //  Check the data length.
        if (ansData.length < 2) {
            throw new MBParseError("Register address field can't be read.");
        } else if (ansData.length < 4) {
            throw new MBParseError("Register value field can't be read.");
        }

        //  Get and check the register address.
        if (ansData.readUInt16BE(0) != hregAddr) {
            throw new MBParseError("Register address mismatched.");
        }

        //  Get and check the register value.
        if (ansData.readUInt16BE(2) != hregValue) {
            throw new MBParseError("Register value mismatched.");
        }

        return new MBMasterProtocolParserOut(false, null, null);
    };
}

//
//  Inheritances.
//
Util.inherits(
    MBMasterProtocolWriteSingleRegisterParser, 
    IMBMasterProtocolParser
);

//  Export public APIs.
module.exports = {
    "MBMasterProtocolWriteSingleRegisterParser": 
        MBMasterProtocolWriteSingleRegisterParser
};