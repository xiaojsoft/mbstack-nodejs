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
const MbError = 
    require("./../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const Util = 
    require("util");

//  Imported classes.
const IMBSlaveProtocolService = 
    MbPrSlaveService.IMBSlaveProtocolService;
const MBPDU = 
    MbPrCore.MBPDU;
const MBBugError = 
    MbError.MBBugError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

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
 *  Modbus slave protocol-layer write multiple coils (0x0F) service.
 * 
 *  @constructor
 *  @extends {IMBSlaveProtocolService}
 */
function MBSlaveProtocolWriteMultipleCoilsService() {
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
        return MBSlaveProtocolWriteMultipleCoilsService.FUNCTION_CODE;
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
            } else if (queryData.length < 5) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_VALUE
                );
            } else {
                //  Passed.
            }
    
            //  Get the coil starting address.
            let coilStartAddr = queryData.readUInt16BE(0);

            //  Get the coil quantity.
            let coilQuantity = queryData.readUInt16BE(2);

            //  Get the coil value byte count.
            let nCoilValueBytes = queryData.readUInt8(4);

            //  Check the coil quantity.
            if (coilQuantity == 0x0000 || coilQuantity > 0x07B0) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_VALUE
                );
            }

            //  Check the coil value byte count.
            let nExpectedCoilValueBytes = (
                (coilQuantity & 7) != 0 ? 
                (coilQuantity >> 3) + 1 : 
                (coilQuantity >> 3)
            );
            if (
                nCoilValueBytes != nExpectedCoilValueBytes ||
                queryData.length < 5 + nCoilValueBytes
            ) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_VALUE
                );
            }

            //  Check the coil address.
            if (coilStartAddr + coilQuantity > 0x10000) {
                return MBPDU.NewException(
                    queryFunctionCode, 
                    MBEX_ILLEGAL_DATA_ADDRESS
                );
            }

            //  Prefetch coil information.
            {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = model.prefetchCoil(coilStartAddr, coilQuantity, cts);
                let wh2 = cancellator.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Do nothing.
                } else {
                    //  Wait for wait handler 1 to be settled.
                    try {
                        await wh1;
                    } catch(error) {
                        //  Operation cancelled. Do nothing.
                    }

                    //  Handle the signal.
                    if (wh == wh2) {
                        throw new MBOperationCancelledError(
                            "The cancellator was activated."
                        );
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }

            //  Validate each coil.
            for (
                let coilAddr = coilStartAddr; 
                coilAddr < coilStartAddr + coilQuantity; 
                ++coilAddr
            ) {
                if (!model.isValidCoil(coilAddr)) {
                    return MBPDU.NewException(
                        queryFunctionCode, 
                        MBEX_ILLEGAL_DATA_ADDRESS
                    );
                }
            }

            //  Write coil statuses.
            let coilBitMask = 0x01;
            let coilByteOffset = 5;
            let coilByteValue = queryData[coilByteOffset];
            for (
                let coilAddr = coilStartAddr; 
                coilAddr < coilStartAddr + coilQuantity; 
                ++coilAddr
            ) {
                let coilValue = ((coilByteValue & coilBitMask) != 0);
                model.writeCoil(coilAddr, coilValue);
                if (coilBitMask == 0x80) {
                    ++coilByteOffset;
                    coilByteValue = queryData[coilByteOffset];
                    coilBitMask = 0x01;
                } else {
                    coilBitMask <<= 1;
                }
            }

            return new MBPDU(queryFunctionCode, queryData.slice(0, 4));
        } catch(error) {
            //  Throw operation cancelled exception.
            if (error instanceof MBOperationCancelledError) {
                throw error;
            }

            //  Return an exception.
            return MBPDU.NewException(
                queryFunctionCode, 
                MBEX_SERVER_DEVICE_FAILURE
            );
        }
    };
}

//  Assigned function code of the slave service.
MBSlaveProtocolWriteMultipleCoilsService.FUNCTION_CODE = 0x0F;

//  Slave service instance.
MBSlaveProtocolWriteMultipleCoilsService.INSTANCE = 
    new MBSlaveProtocolWriteMultipleCoilsService();

//
//  Inheritances.
//
Util.inherits(
    MBSlaveProtocolWriteMultipleCoilsService, 
    IMBSlaveProtocolService
);

//  Export public APIs.
module.exports = {
    "MBSlaveProtocolWriteMultipleCoilsService": 
        MBSlaveProtocolWriteMultipleCoilsService
};