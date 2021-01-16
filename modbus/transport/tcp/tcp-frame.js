//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspTcpConstants = require("./tcp-constants");
const MbConventions = require("./../../conventions");
const MbError = require("./../../../error");
const Util = require("util");

//  Imported classes.
const MBParameterError = MbError.MBParameterError;

//  Imported constants.
const MBAP_PROTOID_MODBUS = MbTspTcpConstants.MBAP_PROTOID_MODBUS;
const MAX_PDU_LENGTH = MbConventions.MAX_PDU_LENGTH;

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
 *    [5] The maximum length Modbus protocol payload is MAX_PDU_LENGTH + 1, so
 *        if the protocol identifier equals to MBAP_PROTOID_MODBUS and the 
 *        protocol payload length is longer than MAX_PDU_LENGTH + 1, a 
 *        MBParameterError would be thrown.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - One of following error(s) occurred:
 *      - Transaction identifier is invalid.
 *      - Protocol identifier is invalid.
 *      - Protocol payload is too long (> 65535).
 *      - Protocol payload is too long for Modbus protocol (> 254).
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
    if (
        protocolID == MBAP_PROTOID_MODBUS && 
        protocolPayload.length > MAX_PDU_LENGTH + 1
    ) {
        throw new MBParameterError(Util.format(
            "Protocol payload is too long for Modbus protocol (> %d).",
            MAX_PDU_LENGTH + 1
        ));
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