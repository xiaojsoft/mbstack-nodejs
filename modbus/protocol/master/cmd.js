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
    require("./parser");
const MbPrCore = 
    require("./../core");

//  Imported classes.
const IMBMasterProtocolParser = 
    MbPrMasterParser.IMBMasterProtocolParser;
const MBPDU = 
    MbPrCore.MBPDU;

//
//  Classes.
//

/**
 *  Modbus master protocol-layer command.
 * 
 *  @constructor
 *  @param {MBPDU} queryPDU 
 *    - The request (query) protocol data unit (PDU).
 *  @param {?IMBMasterProtocolParser} ansParser 
 *    - The response (answer) parser (NULL if no response is needed).
 */
function MBMasterProtocolCommand(queryPDU, ansParser) {
    //
    //  Public methods.
    //

    /**
     *  Get the request (query) protocol data unit (PDU).
     * 
     *  @returns {MBPDU}
     *    - The PDU.
     */
    this.getQueryPDU = function() {
        return queryPDU;
    };

    /**
     *  Get the response (answer) parser.
     * 
     *  @returns {?IMBMasterProtocolParser}
     *    - The parser (NULL if no response is needed).
     */
    this.getAnswerParser = function() {
        return ansParser;
    };
}

//  Export public APIs.
module.exports = {
    "MBMasterProtocolCommand": MBMasterProtocolCommand
};