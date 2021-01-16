//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbConventions = require("./../conventions");
const MbError = require("./../../error");
const XRTLibAsync = require("xrtlibrary-async");
const Util = require("util");

//  Imported classes.
const MBParameterError = 
    MbError.MBParameterError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBCommunicationError = 
    MbError.MBCommunicationError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

//  Imported constants.
const MAX_PDU_DATA_LENGTH = 
    MbConventions.MAX_PDU_DATA_LENGTH;

//
//  Classes.
//

/**
 *  Modbus transport-layer request (query).
 * 
 *  Note(s):
 *    [1] The unit identifier must be an integer between 0x00 and 0xFF. A 
 *        MBParameterError would be thrown if the unit identifier is invalid.
 *    [2] The function code must be an integer between 0x00 and 0xFF. A 
 *        MBParameterError would be thrown if the function code is invalid.
 *    [3] The Modbus Application Protocol specification specifies that the 
 *        maximum PDU length is MAX_PDU_LENGTH, so the maximum data length of 
 *        the PDU is MAX_PDU_LENGTH - 1 (the function code field) = 
 *        MAX_PDU_DATA_LENGTH. A MBParameterError would be thrown if the data is
 *        longer than MAX_PDU_DATA_LENGTH.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - One of following error(s) occurred:
 *      - Unit identifier is invalid.
 *      - Function code is invalid.
 *      - Data is too long (> MAX_PDU_DATA_LENGTH).
 *  @param {Number} unitID 
 *    - The request (query) unit identifier.
 *  @param {Number} functionCode 
 *    - The request (query) function code.
 *  @param {Buffer} data 
 *    - The request (query) data.
 */
function MBTransportQuery(unitID, functionCode, data) {
    //
    //  Parameter check.
    //

    //  Check the unit identifier.
    if (!(
        Number.isInteger(unitID) && 
        unitID >= 0x00 && 
        unitID <= 0xFF
    )) {
        throw new MBParameterError("Unit identifier is invalid.");
    }

    //  Check the function code.
    if (!(
        Number.isInteger(functionCode) && 
        functionCode >= 0x00 && 
        functionCode <= 0xFF
    )) {
        throw new MBParameterError("Function code is invalid.");
    }

    //  Check the data.
    if (data.length > MAX_PDU_DATA_LENGTH) {
        throw new MBParameterError(Util.format(
            "Data is too long (> %d).", 
            MAX_PDU_DATA_LENGTH
        ));
    }

    //
    //  Public methods.
    //

    /**
     *  Get the unit identifier.
     * 
     *  @returns {Number}
     *    - The unit identifier.
     */
    this.getUnitID = function() {
        return unitID;
    };

    /**
     *  Get the function code.
     * 
     *  @returns {Number}
     *    - The function code.
     */
    this.getFunctionCode = function() {
        return functionCode;
    };

    /**
     *  Get the data.
     * 
     *  @returns {Buffer}
     *    - The data.
     */
    this.getData = function() {
        return data;
    };
}

/**
 *  Modbus transport-layer response (answer).
 * 
 *  Note(s):
 *    [1] The function code must be an integer between 0x00 and 0xFF. A 
 *        MBParameterError would be thrown if the function code is invalid.
 *    [2] The Modbus Application Protocol specification specifies that the 
 *        maximum PDU length is MAX_PDU_LENGTH, so the maximum data length of 
 *        the PDU is MAX_PDU_LENGTH - 1 (the function code field) = 
 *        MAX_PDU_DATA_LENGTH. A MBParameterError would be thrown if the data is
 *        longer than MAX_PDU_DATA_LENGTH.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - One of following error(s) occurred:
 *      - Function code is invalid.
 *      - Data is too long (> MAX_PDU_DATA_LENGTH).
 *  @param {Number} functionCode 
 *    - The response (answer) function code.
 *  @param {Buffer} data 
 *    - The response (answer) data.
 */
function MBTransportAnswer(functionCode, data) {
    //
    //  Parameter check.
    //

    //  Check the function code.
    if (!(
        Number.isInteger(functionCode) && 
        functionCode >= 0x00 && 
        functionCode <= 0xFF
    )) {
        throw new MBParameterError("Function code is invalid.");
    }

    //  Check the data.
    if (data.length > MAX_PDU_DATA_LENGTH) {
        throw new MBParameterError(Util.format(
            "Data is too long (> %d).", 
            MAX_PDU_DATA_LENGTH
        ));
    }

    //
    //  Public methods.
    //

    /**
     *  Get the function code.
     * 
     *  @returns {Number}
     *    - The function code.
     */
    this.getFunctionCode = function() {
        return functionCode;
    };

    /**
     *  Get the data.
     * 
     *  @returns {Buffer}
     *    - The data.
     */
    this.getData = function() {
        return data;
    };
}

/**
 *  Interface of all Modbus master transports.
 * 
 *  @constructor
 */
function IMBMasterTransport() {
    //
    //  Public methods.
    //

    /**
     *  Query the slave.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed or is going to be closed.
     *  @throws {MBCommunicationError}
     *    - Transport-layer communication failed.
     *  @param {MBTransportQuery} query 
     *    - The query object.
     *  @param {Boolean} [noAnswer] 
     *    - True if response from the slave is needed.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<?MBTransportAnswer>}
     *    - The promise object (resolves with the answer if succeed and 
     *      answer from the slave is needed, resolves with NULL if succeed and 
     *      answer from the slave is not needed, rejects if error occurred).
     */
    this.query = async function(
        query, 
        noAnswer = false, 
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };

    /**
     *  Wait for the transport to be closed.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @return {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred). 
     */
    this.wait = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };


    /**
     *  Get whether the transport was closed.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Close the transport.
     * 
     *  @param {Boolean} [forcibly] 
     *    - True if the transport shall be closed forcibly.
     */
    this.close = function(
        forcibly = false
    ) {
        throw new Error("Not implemented.");
    };
}

/**
 *  Interface of all Modbus transport factory classes.
 * 
 *  @constructor
 */
function IMBMasterTransportFactory() {
    //
    //  Public methods.
    //    

    /**
     *  Get the name of the transport.
     * 
     *  @returns {String}
     *    - The name.
     */
    this.getName = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Create a transport instance.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBConfigurationError}
     *    - Bad transport configuration.
     *  @throws {MBCommunicationError}
     *    - Communication error.
     *  @param {Object} configdict 
     *    - The transport configuration dictionary.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<IMBMasterTransport>}
     *    - The promise object (resolves with the transport object if succeed, 
     *      rejects if error occurred).
     */
    this.create = async function(
        configdict, 
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };
}

/**
 *  Interface of Modbus slave transaction classes.
 * 
 *  @constructor
 */
function IMBSlaveTransaction() {
    //
    //  Public methods.
    //

    /**
     *  Get the the query.
     * 
     *  @returns {MBTransportQuery}
     *    - The query.
     */
    this.getQuery = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Get current transaction state.
     * 
     *  Note(s):
     *    [1] The slave have following states:
     * 
     *          - IMBSlaveTransaction.STATE_INCOMPLETE:
     * 
     *              The transaction is still waiting.
     * 
     *          - IMBSlaveTransaction.STATE_CANCELLED:
     * 
     *              The transaction was cancelled by the transport-layer.
     * 
     *          - IMBSlaveTransaction.STATE_COMPLETE:
     * 
     *              The transaction was completed.
     * 
     *          - IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR:
     * 
     *              The transaction was completed but an error occurred while 
     *              completing the transaction.
     * 
     *  @returns {Number}
     *    - The transaction state (one of IMBSlaveTransaction.STATE_*).
     */
    this.getState = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Wait for the transaction to complete or be cancelled.
     * 
     *  Note(s):
     *    [1] This method waits for the transaction to fall in one of following 
     *        states:
     * 
     *          - IMBSlaveTransaction.STATE_COMPLETE
     *          - IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR
     *          - IMBSlaveTransaction.STATE_CANCELLED
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<Number>}
     *    - The promise object (resolves with the state if succeed, rejects if 
     *      error occurred).
     */
    this.wait = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };

    /**
     *  Answer the transaction.
     * 
     *  Note(s):
     *    [1] Assumes that class X is an implementation of this interface, 
     *        any call to this method would take no effect if either 
     *        X.prototype.answer() or X.prototype.ignore() was called before.
     * 
     *  @param {MBTransportAnswer} ans 
     *    - The answer.
     */
    this.answer = function(ans) {
        throw new Error("Not implemented.");
    };

    /**
     *  Ignore the transaction.
     * 
     *  Note(s):
     *    [1] Assumes that class X is an implementation of this interface, 
     *        any call to this method would take no effect if either 
     *        X.prototype.answer() or X.prototype.ignore() was called before.
     */
    this.ignore = function() {
        throw new Error("Not implemented.");
    };
}

//  Modbus slave transaction states.
IMBSlaveTransaction.STATE_INCOMPLETE = 0;
IMBSlaveTransaction.STATE_CANCELLED = 1;
IMBSlaveTransaction.STATE_COMPLETE = 2;
IMBSlaveTransaction.STATE_COMPLETE_WITH_ERROR = 3;

/**
 *  Interface of all Modbus slave transport classes.
 * 
 *  @constructor
 */
function IMBSlaveTransport() {
    //
    //  Public methods.
    //

    /**
     *  Reset the value of specified counter.
     * 
     *  Note(s):
     *    [1] No action if the counter is not available.
     * 
     *  @param {Number} cntrid
     *    - The counter ID.
     */
    this.resetCounterValue = function(cntrid) {
        throw new Error("Not implemented.");
    };

    /**
     *  Get the value of specified counter.
     * 
     *  Note(s):
     *    [1] 0n would be returned if the counter is not available.
     * 
     *  @param {Number} cntrid
     *    - The counter ID.
     *  @returns {BigInt}
     *    - The counter value.
     */
    this.getCounterValue = function(cntrid) {
        throw new Error("Not implemented.");
    };

    /**
     *  Get available counters.
     * 
     *  @returns {Set<Number>}
     *    - The set that contains the ID of all available counters.
     */
    this.getAvailableCounters = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Poll for a transaction.
     * 
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed or is going to be closed.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBSlaveTransaction>}
     *    - The promise object (resolves with a transaction if succeed, rejects 
     *      if error occurred).
     */
    this.poll = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };

    /**
     *  Wait for the transport to be closed.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred).
     */
    this.wait = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };

    /**
     *  Get whether the transport was already closed.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Close the transport.
     * 
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed.
     *  @param {Boolean} [forcibly] 
     *    - True if the transport should be closed forcibly.
     */
    this.close = function(forcibly = false) {
        throw new Error("Not implemented.");
    };
}

/**
 *  Interface of all Modbus slave transport factory classes.
 * 
 *  @constructor
 */
function IMBSlaveTransportFactory() {
    //
    //  Public methods.
    //

    /**
     *  Get the name of the transport.
     * 
     *  @returns {String}
     *    - The name.
     */
    this.getName = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Create a transport instance.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBConfigurationError}
     *    - Bad transport configuration.
     *  @throws {MBCommunicationError}
     *    - Communication error.
     *  @param {Object} configdict 
     *    - The transport configuration dictionary.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<IMBSlaveTransport>}
     *    - The promise object (resolves with the transport object if succeed, 
     *      rejects if error occurred).
     */
    this.create = async function(
        configdict, 
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };
}

//  Export public APIs.
module.exports = {
    "MBTransportQuery": MBTransportQuery,
    "MBTransportAnswer": MBTransportAnswer,
    "IMBMasterTransport": IMBMasterTransport,
    "IMBMasterTransportFactory": IMBMasterTransportFactory,
    "IMBSlaveTransaction": IMBSlaveTransaction,
    "IMBSlaveTransport": IMBSlaveTransport,
    "IMBSlaveTransportFactory": IMBSlaveTransportFactory
};