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
 *  Modbus master protocol-layer read coils (0x01) parser.
 * 
 *  Note(s):
 *    [1] The data type of the parse output is Boolean[], the data is an Array 
 *        that contains the value of coils.
 * 
 *  @constructor
 *  @param {Number} nExpectedCoils 
 *    - The expected count of coils.
 */
function MBMasterProtocolReadCoilsParser(nExpectedCoils) {
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
            (nExpectedCoils & 7) != 0 ? 
            ((nExpectedCoils >> 3) + 1) : 
            (nExpectedCoils >> 3)
        );
        if (nBytes != nExpectedBytes) {
            throw new MBParseError("Byte count mismatched.");
        }

        //  Check the data length.
        if (ansData.length < 1 + nBytes) {
            throw new MBParseError("No enough coil status bytes.");
        }

        //  Parse coil statuses.
        let coilByteOffset = 1;
        let coilByteValue = ansData.readUInt8(coilByteOffset);
        let coilBitOffset = 0x01;
        let coils = [];
        for (let i = 0; i < nExpectedCoils; ++i) {
            if (coilBitOffset == 0x01) {
                coilByteValue = ansData.readUInt8(coilByteOffset);
            }
            let coilValue = ((coilByteValue & coilBitOffset) != 0);
            coils.push(coilValue);
            if (coilBitOffset == 0x80) {
                ++coilByteOffset;
                coilBitOffset = 0x01;
            } else {
                coilBitOffset <<= 1;
            }
        }

        return new MBMasterProtocolParserOut(false, null, coils);
    };
}

//
//  Inheritances.
//
Util.inherits(
    MBMasterProtocolReadCoilsParser, 
    IMBMasterProtocolParser
);

//  Export public APIs.
module.exports = {
    "MBMasterProtocolReadCoilsParser": MBMasterProtocolReadCoilsParser
};