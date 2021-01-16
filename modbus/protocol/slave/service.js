//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrCore = 
    require("./../core");
const MbPrExceptions = 
    require("./../exceptions");
const MbMdCore = 
    require("./../../model/core");
const MbError = 
    require("./../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");

//  Imported classes.
const MBPDU = 
    MbPrCore.MBPDU;
const IMBDataModel = 
    MbMdCore.IMBDataModel;
const MBProtocolServiceExistedError = 
    MbError.MBProtocolServiceExistedError;
const MBProtocolServiceNotExistError = 
    MbError.MBProtocolServiceNotExistError;
const MBFunctionProhibitedError = 
    MbError.MBFunctionProhibitedError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

//  Imported constants.
const MBEX_ILLEGAL_FUNCTION = 
    MbPrExceptions.MBEX_ILLEGAL_FUNCTION;

//
//  Classes.
//

/**
 *  Interface of all Modbus slave protocol-layer service classes.
 * 
 *  @constructor
 */
function IMBSlaveProtocolService() {
    //
    //  Public methods.
    //

    /**
     *  Get the assigned function code.
     * 
     *  @returns {Number}
     *    - The function code.
     */
    this.getAssignedFunctionCode = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Get whether the service is available in listen-only mode.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isAvailableInListenOnlyMode = function() {
        throw new Error("Not implemented.");
    };

    /**
     *  Handle request (query).
     * 
     *  Note(s):
     *    [1] The function code in the request (query) protocol data unit (PDU) 
     *        is assumed to be the same as the assigned function code of this 
     *        service. No redundant check would be performed when handles the 
     *        request (query).
     * 
     *  @throws {MBFunctionProhibitedError}
     *    - Function prohibited in broadcast message.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {IMBDataModel} model
     *    - The data model.
     *  @param {MBPDU} pdu 
     *    - The request (query) protocol data unit (PDU).
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<?MBPDU>}
     *    - The promise object (resolves with the response (answer) protocol 
     *      data unit (PDU) if succeed and response is needed, resolves with 
     *      NULL if succeed and no response is needed, rejects if error 
     *      occurred).
     */
    this.handle = async function(
        model, 
        pdu, 
        cancellator = new ConditionalSynchronizer()
    ) {
        throw new Error("Not implemented.");
    };
}

/**
 *  Modbus slave protocol-layer service host.
 * 
 *  @constructor
 */
function MBSlaveProtocolServiceHost() {
    //
    //  Members.
    //

    //  Service mapping.
    let services = new Map();

    //
    //  Public methods.
    //

    /**
     *  Register a service.
     * 
     *  @throws {MBProtocolServiceExistedError}
     *    - The service was already existed.
     *  @param {IMBSlaveProtocolService} service 
     *    - The service.
     */
    this.register = function(service) {
        let fnCode = service.getAssignedFunctionCode();
        if (services.has(fnCode)) {
            throw new MBProtocolServiceExistedError(
                "The service was already existed."
            );
        }
        services.set(fnCode, service);
    };

    /**
     *  Unregister a service.
     * 
     *  @throws {MBProtocolServiceNotExistError}
     *    - The service doesn't exist.
     *  @param {IMBSlaveProtocolService} service 
     *    - The service.
     */
    this.unregister = function(service) {
        let fnCode = service.getAssignedFunctionCode();
        if (!services.has(fnCode)) {
            throw new MBProtocolServiceNotExistError(
                "The service doesn't exist."
            );
        }
        services.delete(fnCode);
    };

    /**
     *  Handle request (query).
     * 
     *  @throws {MBFunctionProhibitedError}
     *    - Function prohibited in broadcast message.
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {IMBDataModel} model
     *    - The data model.
     *  @param {MBPDU} pdu 
     *    - The request (query) protocol data unit (PDU).
     *  @param {Boolean} [listenOnly]
     *    - True if the query is currently being handled in listen-only mode.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<?MBPDU>}
     *    - The promise object (resolves with the response (answer) protocol 
     *      data unit (PDU) if succeed and response is needed, resolves with 
     *      NULL if succeed and no response is needed, rejects if error 
     *      occurred).
     */
    this.handle = async function(
        model, 
        pdu, 
        listenOnly = false, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Get the request (query) function code.
        let fnCode = pdu.getFunctionCode();

        //  Check the request (query) function code.
        if (!services.has(fnCode)) {
            if (listenOnly) {
                //  Do NOT return any exception message under listen-only mode.
                return null;
            }
            return MBPDU.NewException(fnCode, MBEX_ILLEGAL_FUNCTION);
        }

        //  Get the service.
        let service = services.get(fnCode);

        //  Check the function availability in listen-only mode.
        if (listenOnly) {
            if (!service.isAvailableInListenOnlyMode()) {
                return null;
            }
        }

        //  Let the service handle the PDU.
        return await service.handle(model, pdu, cancellator);
    };
}

//  Export public APIs.
module.exports = {
    "IMBSlaveProtocolService": IMBSlaveProtocolService,
    "MBSlaveProtocolServiceHost": MBSlaveProtocolServiceHost
};