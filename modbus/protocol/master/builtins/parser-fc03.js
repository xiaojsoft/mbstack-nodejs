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
 *  Modbus master protocol-layer read holding registers (0x03) parser.
 * 
 *  Note(s):
 *    [1] The data type of the parse output is Number[], the data is an Array 
 *        that contains the value of holding registers.
 * 
 *  @constructor
 *  @param {Number} nExpectedRegs 
 *    - The expected count of holding registers.
 */
function MBMasterProtocolReadHoldingRegistersParser(nExpectedRegs) {
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

        //  Get and check byte count.
        if (ansData.length == 0) {
            throw new MBParseError("Byte count field can't be read.");
        }
        let nBytes = ansData.readUInt8(0);
        let nExpectedBytes = (nExpectedRegs << 1);
        if (nBytes != nExpectedBytes) {
            throw new MBParseError("Byte count mismatched.");
        }

        //  Check the data length.
        if (ansData.length < 1 + nBytes) {
            throw new MBParseError("No enough register value bytes.");
        }

        //  Parse register values.
        let regs = [];
        for (let i = 0, offset = 1; i < nExpectedRegs; ++i, offset += 2) {
            regs.push(ansData.readUInt16BE(offset));
        }

        return new MBMasterProtocolParserOut(false, null, regs);
    };
}

//
//  Inheritances.
//
Util.inherits(
    MBMasterProtocolReadHoldingRegistersParser, 
    IMBMasterProtocolParser
);

//  Export public APIs.
module.exports = {
    "MBMasterProtocolReadHoldingRegistersParser": 
        MBMasterProtocolReadHoldingRegistersParser
};