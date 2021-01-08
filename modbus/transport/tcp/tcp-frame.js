//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbError = require("./../../../error");

//  Imported classes.
const MBParameterError = MbError.MBParameterError;

//
//  Classes.
//

/**
 *  Modbus TCP frame.
 * 
 *  Note(s):
 *    [1] For a normal Modbus frame which the protocol identifier field in 
 *        the MBAP equals to 0x00, the protocol data has following 
 *        structure:
 * 
 *                           +-----------------------------------------+
 *                           |         Protocol Data Unit (PDU)        |
 *        +------------------+------------------------+----------------+
 *        | Unit ID (1 byte) | Function Code (1 byte) | Data (N bytes) |
 *        +------------------+------------------------+----------------+
 *        ^                                                            ^
 *        |                                                            |
 *        |<-------------------- Protocol payload -------------------->|
 * 
 *    [2] The transaction identifier must be an integer between 0x0000 and 
 *        0xFFFF. A MBParameterError exception would be thrown if the 
 *        transaction identifier is invalid.
 *    [3] The protocol identifier must be an integer between 0x0000 and 0xFFFF.
 *        (for your convenience, you can select one from MBAP_PROTOID_*). A 
 *        MBParameterError exception would be thrown if the protocol identifier 
 *        is invalid.
 *    [4] The protocol payload must NOT be longer than 65535. A MBParameterError
 *        exception would be thrown if the protocol payload is longer than that 
 *        threshold.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - One of following error(s) occurred:
 *      - Transaction identifier is invalid.
 *      - Protocol identifier is invalid.
 *      - Protocol payload is too long (> 65535).
 *  @param {Number} transactionID 
 *    - The transaction identifier.
 *  @param {Number} protocolID 
 *    - The protocol identifier.
 *  @param {Buffer} protocolPayload 
 *    - The protocol payload.
 */
function MBTCPFrame(
    transactionID, 
    protocolID, 
    protocolPayload
) {
    //
    //  Parameter check.
    //

    //  Check the transaction ID.
    if (!(
        Number.isInteger(transactionID) && 
        transactionID >= 0x0000 && 
        transactionID <= 0xFFFF
    )) {
        throw new MBParameterError("Transaction identifier is invalid.");
    }

    //  Check the protocol ID.
    if (!(
        Number.isInteger(protocolID) && 
        protocolID >= 0x0000 && 
        protocolID <= 0xFFFF
    )) {
        throw new MBParameterError("Protocol identifier is invalid.");
    }

    //  Check the protocol payload.
    if (protocolPayload.length > 65535) {
        throw new MBParameterError("Protocol payload is too long (> 65535).");
    }

    //
    //  Public methods.
    //

    /**
     *  Get the transaction identifier.
     * 
     *  @returns {Number}
     *    - The transaction ID.
     */
    this.getTransactionID = function() {
        return transactionID;
    };

    /**
     *  Get the protocol identifier.
     * 
     *  @returns {Number}
     *    - The protocol ID.
     */
    this.getProtocolID = function() {
        return protocolID;
    };

    /**
     *  Get the protocol payload.
     * 
     *  @returns {Buffer}
     *    - The protocol payload.
     */
    this.getProtocolPayload = function() {
        return protocolPayload;
    };
}

//  Export public APIs.
module.exports = {
    "MBTCPFrame": MBTCPFrame
};