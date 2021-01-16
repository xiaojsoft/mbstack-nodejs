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
 *  Modbus slave protocol-layer read input register (0x04) service.
 * 
 *  @constructor
 *  @extends {IMBSlaveProtocolService}
 */
function MBSlaveProtocolReadInputRegisterService() {
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
        return MBSlaveProtocolReadInputRegisterService.FUNCTION_CODE;
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
    
            //  Get the input register starting address.
            let iregStartAddr = queryData.readUInt16BE(0);
    
            //  Get the input register quantity.
            let iregQuantity = queryData.readUInt16BE(2);
            
            //  Check the input register quantity.
            if (iregQuantity == 0x00 || iregQuantity > 0x7D) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_VALUE
                );
            }
            
            //  Check the input register address.
            if (iregStartAddr + iregQuantity > 0x10000) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_ADDRESS
                );
            }
            for (
                let iregAddr = iregStartAddr; 
                iregAddr < iregStartAddr + iregQuantity; 
                ++iregAddr
            ) {
                if (!model.isValidInputRegister(iregAddr)) {
                    return MBPDU.NewException(
                        queryFunctionCode, 
                        MBEX_ILLEGAL_DATA_ADDRESS
                    );
                }
            }

            //  Get input register values.
            let answerData = Buffer.allocUnsafe(1 + (iregQuantity << 1));
            answerData.writeUInt8(iregQuantity << 1, 0);
            for (
                let iregAddr = iregStartAddr, iregOffset = 1; 
                iregAddr < iregStartAddr + iregQuantity; 
                ++iregAddr, iregOffset += 2
            ) {
                let iregValue = model.readInputRegister(iregAddr);
                answerData.writeUInt16BE(iregValue, iregOffset);
            }

            return new MBPDU(queryFunctionCode, answerData);
        } catch(error) {
            return MBPDU.NewException(
                queryFunctionCode, 
                MBEX_SERVER_DEVICE_FAILURE
            );
        }
    };
}

//  Assigned function code of the slave service.
MBSlaveProtocolReadInputRegisterService.FUNCTION_CODE = 0x04;

//  Slave service instance.
MBSlaveProtocolReadInputRegisterService.INSTANCE = 
    new MBSlaveProtocolReadInputRegisterService();

//
//  Inheritances.
//
Util.inherits(
    MBSlaveProtocolReadInputRegisterService, 
    IMBSlaveProtocolService
);

//  Export public APIs.
module.exports = {
    "MBSlaveProtocolReadInputRegisterService": 
        MBSlaveProtocolReadInputRegisterService
};