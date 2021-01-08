//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrCore = require("./../core");
const MbError = require("./../../../error");

//  Imported classes.
const MBParseError = MbError.MBParseError;
const MBPDU = MbPrCore.MBPDU;

//
//  Classes.
//

/**
 *  Modbus master protocol-layer parser output.
 * 
 *  @constructor
 *  @param {Boolean} isExceptionThrown 
 *    - True if exception was thrown.
 *  @param {?Number} exceptionCode 
 *    - The exception code (NULL if no exception was thrown).
 *  @param {*} data 
 *    - The data.
 */
function MBMasterProtocolParserOut(
    isExceptionThrown, 
    exceptionCode, 
    data
) {
    //
    //  Public methods.
    //

    /**
     *  Get whether an exception was thrown.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.hasException = function() {
        return isExceptionThrown;
    };

    /**
     *  Get the exception code.
     * 
     *  @returns {Number}
     *    - The exception code (one of MBEX_*, NULL if no exception was thrown).
     */
    this.getExceptionCode = function() {
        return exceptionCode;
    };

    /**
     *  Get the data.
     * 
     *  Note(s):
     *    [1] The type of returned data is function-specific.
     * 
     *  @returns {*}
     *    - The data.
     */
    this.getData = function() {
        return data;
    };
}

/**
 *  Interface of all Modbus master protocol-layer parser.
 * 
 *  @constructor
 */
function IMBMasterProtocolParser() {
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
        throw new Error("Not implemented.");
    };
}

//  Export public APIs.
module.exports = {
    "MBMasterProtocolParserOut": MBMasterProtocolParserOut,
    "IMBMasterProtocolParser": IMBMasterProtocolParser
};