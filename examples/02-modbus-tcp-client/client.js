//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MBStack = require("./../..");
const XRTLibAsync = require("xrtlibrary-async");
const Util = require("util");

//  Imported classes.
const IMBMasterServiceInitiator = 
    MBStack.ApplicationLayer.Master.IMBMasterServiceInitiator;
const MBMasterService = 
    MBStack.ApplicationLayer.Master.MBMasterService;
const MBTCPMasterTransportFactory = 
    MBStack.TransportLayer.TCP.MBTCPMasterTransportFactory;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

const NewReadHoldingRegistersCommand = 
    MBStack.ProtocolLayer.Master.BuiltIns.NewReadHoldingRegistersCommand;
const NewWriteMultipleRegistersCommand = 
    MBStack.ProtocolLayer.Master.BuiltIns.NewWriteMultipleRegistersCommand;

//
//  Constants.
//

//  Example server endpoint.
const MY_SERVER_HOST = "127.0.0.1";
const MY_SERVER_PORT = 5020;

//  Example Modbus settings.
const MY_UNIT_ID     = 0x01;

//
//  Classes.
//

/**
 *  Example Modbus master service initiator.
 * 
 *  @constructor
 *  @extends {IMBMasterServiceInitiator}
 */
function MBExampleMasterServiceInitiator() {
    //  Let parent class initialize.
    IMBMasterServiceInitiator.call(this);

    //
    //  Public methods.
    //

    /**
     *  Initiate transport-layer.
     * 
     *  Note(s) to the implementer:
     *    [1] Once this function returned, the transport object would be totally
     *        managed by the master service. It is highly NOT recommended for 
     *        your upper application to do any operation on the transport 
     *        object directly.
     *    [2] To close the transport, call MBMasterService.prototype.close() 
     *        instead of closing the transport directly.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate transport-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBMasterTransport>}
     *    - The promise object (resolves with the transport if succeed, rejects 
     *      if error occurred).
     */
    this.initiateTransportLayer = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        let factory = new MBTCPMasterTransportFactory();
        return await factory.create({
            "slave": {
                "host": MY_SERVER_HOST,
                "port": MY_SERVER_PORT
            },
            "timeout": {
                "idle": 30000,
                "retry": 1000,
                "establish": 6000
            },
            "parallel": 65536
        }, cancellator);
    };
}

//
//  Inheritances.
//
Util.inherits(MBExampleMasterServiceInitiator, IMBMasterServiceInitiator);

//
//  Main.
//
(async function() {
    //  Create master.
    let masterInitiator = new MBExampleMasterServiceInitiator();
    let master = await MBMasterService.Create(masterInitiator);

    //  Do query 1.
    try {
        await master.query(
            MY_UNIT_ID, 
            NewWriteMultipleRegistersCommand(
                0x0000,
                [0x1234, 0x5678, 0x7856, 0x3412]
            )
        );
    } catch(error) {
        console.log("Query 1 failed:");
        console.log(error);
    }
    
    //  Do query 2.
    try {
        await master.query(
            MY_UNIT_ID, 
            NewWriteMultipleRegistersCommand(
                0x0004,
                [0x1111, 0x2222, 0x3333, 0x4444]
            )
        );
    } catch(error) {
        console.log("Query 2 failed:");
        console.log(error);
    }
    
    //  Do query 3.
    try {
        let result = await master.query(
            MY_UNIT_ID, 
            NewReadHoldingRegistersCommand(0x0000, 8)
        );
        console.log("Result:");
        let str = "";
        for (let i = 0; i < result.length; ++i) {
            str += "0x" + result[i].toString(16) + ", "
        }
        console.log(str);
    } catch(error) {
        console.log("Query 3 failed:");
        console.log(error);
    }
    
    //  Close the master.
    if (!master.isClosed()) {
        master.close();
    }
    await master.wait();
    console.log("Master closed.");
})().catch(function(error) {
    console.log("Error thrown:");
    console.log(error);
});