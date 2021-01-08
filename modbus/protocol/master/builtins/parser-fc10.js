//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrMasterParser = require("./../parser");
const MbPrCore = require("./../../core");
const MbError = require("./../../../../error");
const Util = require("util");

//  Imported classes.
const MBPDU = MbPrCore.MBPDU;
const MBParseError = MbError.MBParseError;
const MBMasterProtocolParserOut = MbPrMasterParser.MBMasterProtocolParserOut;
const IMBMasterProtocolParser = MbPrMasterParser.IMBMasterProtocolParser;

//
//  Classes.
//

/**
 *  Modbus master protocol-layer write multiple register (0x10) parser.
 * 
 *  Note(s):
 *    [1] NULL is always provided as the data of the parsed output.
 * 
 *  @constructor
 *  @param {Number} hregStartAddr 
 *    - The expected register starting address.
 *  @param {Number} hregQuantity
 *    - The expected register quantity.
 */
function MBMasterProtocolWriteMultipleRegistersParser(
    hregStartAddr, 
    hregQuantity
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
            throw new MBParseError(
                "Register starting address field can't be read."
            );
        } else if (ansData.length < 4) {
            throw new MBParseError(
                "Register quantity field can't be read."
            );
        }

        //  Get and check the register starting address.
        if (ansData.readUInt16BE(0) != hregStartAddr) {
            throw new MBParseError("Register starting address mismatched.");
        }

        //  Get and check the register quantity.
        if (ansData.readUInt16BE(2) != hregQuantity) {
            throw new MBParseError("Register quantity mismatched.");
        }

        return new MBMasterProtocolParserOut(false, null, null);
    };
}

//
//  Inheritances.
//
Util.inherits(
    MBMasterProtocolWriteMultipleRegistersParser, 
    IMBMasterProtocolParser
);

//  Export public APIs.
module.exports = {
    "MBMasterProtocolWriteMultipleRegistersParser": 
        MBMasterProtocolWriteMultipleRegistersParser
};