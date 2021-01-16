//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbPrSlaveService = 
    require("./../service");
const MbPrCore = 
    require("./../../core");
const MbPrExceptions = 
    require("./../../exceptions");
const Util = 
    require("util");

//  Imported classes.
const IMBSlaveProtocolService = 
    MbPrSlaveService.IMBSlaveProtocolService;
const MBPDU = 
    MbPrCore.MBPDU;

//  Imported constants.
const MBEX_ILLEGAL_DATA_ADDRESS = 
    MbPrExceptions.MBEX_ILLEGAL_DATA_ADDRESS;
const MBEX_ILLEGAL_DATA_VALUE = 
    MbPrExceptions.MBEX_ILLEGAL_DATA_VALUE;
const MBEX_SERVER_DEVICE_FAILURE = 
    MbPrExceptions.MBEX_SERVER_DEVICE_FAILURE;

//
//  Classes.
//

/**
 *  Modbus slave protocol-layer write single register (0x06) service.
 * 
 *  @constructor
 *  @extends {IMBSlaveProtocolService}
 */
function MBSlaveProtocolWriteSingleRegisterService() {
    //  Let parent class initialize.
    IMBSlaveProtocolService.call(this);

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
        return MBSlaveProtocolWriteSingleRegisterService.FUNCTION_CODE;
    };

    /**
     *  Get whether the service is available in listen-only mode.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isAvailableInListenOnlyMode = function() {
        return false;
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
     *  @param {IMBDataModel} model
     *    - The data model.
     *  @param {MBPDU} pdu 
     *    - The request (query) protocol data unit (PDU).
     *  @returns {?MBPDU}
     *    - The response (answer) protocol data unit (PDU).
     *    - NULL if no response is needed.
     */
    this.handle = function(model, pdu) {
        //  Get the query function code.
        let queryFunctionCode = pdu.getFunctionCode();

        try {
            //  Get the query data.
            /**
             *  @type {Buffer}
             */
            let queryData = pdu.getData();

            //  Check the length of the query data.
            if (queryData.length < 2) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_ADDRESS
                );
            } else if (queryData.length < 4) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_VALUE
                );
            } else {
                //  Passed.
            }
    
            //  Get and check the register address.
            let hregAddr = queryData.readUInt16BE(0);
            if (!(
                hregAddr <= 0xFFFF && 
                model.isValidHoldingRegister(hregAddr)
            )) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_ADDRESS
                );
            }
    
            //  Get the register value.
            let hregValue = queryData.readUInt16BE(2);
            
            //  Write the register.
            model.writeHoldingRegister(hregAddr, hregValue);

            return new MBPDU(queryFunctionCode, queryData.slice(0, 4));
        } catch(error) {
            return MBPDU.NewException(
                queryFunctionCode, 
                MBEX_SERVER_DEVICE_FAILURE
            );
        }
    };
}

//  Assigned function code of the slave service.
MBSlaveProtocolWriteSingleRegisterService.FUNCTION_CODE = 0x06;

//  Slave service instance.
MBSlaveProtocolWriteSingleRegisterService.INSTANCE = 
    new MBSlaveProtocolWriteSingleRegisterService();

//
//  Inheritances.
//
Util.inherits(
    MBSlaveProtocolWriteSingleRegisterService, 
    IMBSlaveProtocolService
);

//  Export public APIs.
module.exports = {
    "MBSlaveProtocolWriteSingleRegisterService": 
        MBSlaveProtocolWriteSingleRegisterService
};