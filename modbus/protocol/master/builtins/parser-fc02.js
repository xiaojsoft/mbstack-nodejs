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
 *  Modbus master protocol-layer read discrete inputs (0x02) parser.
 * 
 *  Note(s):
 *    [1] The data type of the parse output is Boolean[], the data is an Array 
 *        that contains the value of discrete inputs.
 * 
 *  @constructor
 *  @param {Number} nExpectedInputs 
 *    - The expected count of discrete inputs.
 */
function MBMasterProtocolReadDiscreteInputsParser(nExpectedInputs) {
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
        let nExpectedBytes = (
            (nExpectedInputs & 7) != 0 ? 
            ((nExpectedInputs >> 3) + 1) : 
            (nExpectedInputs >> 3)
        );
        if (nBytes != nExpectedBytes) {
            throw new MBParseError("Byte count mismatched.");
        }

        //  Check the data length.
        if (ansData.length < 1 + nBytes) {
            throw new MBParseError("No enough input status bytes.");
        }

        //  Parse discrete input statuses.
        let dciByteOffset = 1;
        let dciByteValue = ansData.readUInt8(dciByteOffset);
        let dciBitOffset = 0x01;
        let dcis = [];
        for (let i = 0; i < nExpectedInputs; ++i) {
            let dciValue = ((dciByteValue & dciBitOffset) != 0);
            dcis.push(dciValue);
            if (dciBitOffset == 0x80) {
                ++dciByteOffset;
                dciByteValue = ansData.readUInt8(dciByteOffset);
                dciBitOffset = 0x01;
            } else {
                dciBitOffset <<= 1;
            }
        }

        return new MBMasterProtocolParserOut(false, null, dcis);
    };
}

//
//  Inheritances.
//
Util.inherits(
    MBMasterProtocolReadDiscreteInputsParser, 
    IMBMasterProtocolParser
);

//  Export public APIs.
module.exports = {
    "MBMasterProtocolReadDiscreteInputsParser": 
        MBMasterProtocolReadDiscreteInputsParser
};