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
const Process = require("process");
const Util = require("util");

//  Imported classes.
const IMBDataModel = 
    MBStack.Model.IMBDataModel;
const IMBSlaveServiceInitiator = 
    MBStack.ApplicationLayer.Slave.IMBSlaveServiceInitiator;
const MBSlaveService = 
    MBStack.ApplicationLayer.Slave.MBSlaveService;
const MBSlaveProtocolReadCoilsService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolReadCoilsService;
const MBSlaveProtocolReadDiscreteInputService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolReadDiscreteInputService;
const MBSlaveProtocolReadHoldingRegisterService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolReadHoldingRegisterService;
const MBSlaveProtocolReadInputRegisterService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolReadInputRegisterService;
const MBSlaveProtocolWriteSingleCoilService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolWriteSingleCoilService;
const MBSlaveProtocolWriteSingleRegisterService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolWriteSingleRegisterService;
const MBSlaveProtocolWriteMultipleCoilsService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolWriteMultipleCoilsService;
const MBSlaveProtocolWriteMultipleRegistersService = 
    MBStack.ProtocolLayer.Slave.BuiltIns.MBSlaveProtocolWriteMultipleRegistersService;
const MBSlaveProtocolLayer = 
    MBStack.ProtocolLayer.Slave.MBSlaveProtocolLayer;
const MBAsciiSlaveTransportFactory = 
    MBStack.TransportLayer.Serial.ASCII.MBAsciiSlaveTransportFactory;
const MBInvalidNodeError = 
    MBStack.Errors.MBInvalidNodeError;
const MBInvalidDataAddressError = 
    MBStack.Errors.MBInvalidDataAddressError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;

//
//  Constants.
//

//  Example serial port settings.
const MY_SERIALPORT_PATH     = "/dev/pts/3";
const MY_SERIALPORT_BAUDRATE = 9600;
const MY_SERIALPORT_DATABITS = 7;
const MY_SERIALPORT_PARITY   = "even";
const MY_SERIALPORT_STOPBITS = 1;

//  Example Modbus settings.
const MY_UNIT_ID         = 0x01;
const MY_REGISTER_COUNT  = 1024;
const MY_COILS_COUNT     = 1024;

//
//  Constants.
//

/**
 *  Example Modbus data model.
 * 
 *  @constructor
 *  @extends {IMBDataModel}
 */
function MBExampleDataModel() {
    //  Let parent class initialize.
    IMBDataModel.call(this);

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Unit selection.
    let selected = false;

    //  Registers.
    let regs = [];
    for (let i = 0; i < MY_REGISTER_COUNT; ++i) {
        regs.push(0x0000);
    }

    //  Coils.
    let coils = [];
    for (let i = 0; i < MY_COILS_COUNT; ++i) {
        coils.push(false);
    }

    //
    //  Public methods.
    //

    /**
     *  Select an unit (slave) identifier.
     * 
     *  Note(s):
     *    [1] (To implementer) If you are implementing a generic Modbus master, 
     *        just check the unit identifier passed in. If your the unit 
     *        identifier mismatches, throw a MBInvalidNodeError exception.
     *    [2] (To implementer) If you are implementing a Modbus master with 
     *        multiple unit identifiers, check whether the unit identifier is 
     *        acceptable. Save the unit identifier and use it in other methods 
     *        of this class if the unit identifier is acceptable. Otherwise, 
     *        throw a MBInvalidNodeError exception.
     * 
     *  @throws {MBInvalidNodeError}
     *    - The unit identifier is not accepted.
     *  @param {Number} unitId 
     *    - The unit identifier.
     */
    this.select = function(unitId) {
        if (unitId != MY_UNIT_ID) {
            throw new MBInvalidNodeError("Invalid node.");
        }
        selected = true;
    };

    /**
     *  Check whether the address of a discrete input is valid.
     * 
     *  @param {Number} address 
     *    - The input address.
     *  @return {Boolean}
     *    - True if valid.
     */
    this.isValidDiscreteInput = function(address) {
        if (!selected) {
            return false;
        }
        return Number.isInteger(address) && 
               address >= 0 && 
               address < coils.length;
    };

    /**
     *  Read the value of specified discrete input.
     * 
     *  @throws {MBInvalidNodeError}
     *    - No unit was selected yet.
     *  @throws {MBInvalidDataAddressError}
     *    - The input address is invalid.
     *  @param {Number} address 
     *    - The input address.
     *  @return {Boolean}
     *    - The discrete input value.
     */
    this.readDiscreteInput = function(address) {
        if (!selected) {
            throw new MBInvalidNodeError("No unit was selected yet.");
        }
        if (!self.isValidDiscreteInput(address)) {
            throw new MBInvalidDataAddressError("Invalid address.");
        }
        return coils[address];
    };

    /**
     *  Check whether the address of a coil is valid.
     * 
     *  @param {Number} address 
     *    - The coil address.
     *  @return {Boolean}
     *    - True if valid.
     */
    this.isValidCoil = function(address) {
        if (!selected) {
            return false;
        }
        return Number.isInteger(address) && 
               address >= 0 && 
               address < coils.length;
    };

    /**
     *  Read the value of specified coil.
     * 
     *  @throws {MBInvalidNodeError}
     *    - No unit was selected yet.
     *  @throws {MBInvalidDataAddressError}
     *    - The coil address is invalid.
     *  @param {Number} address 
     *    - The coil address.
     *  @return {Boolean}
     *    - The coil value.
     */
    this.readCoil = function(address) {
        if (!selected) {
            throw new MBInvalidNodeError("No unit was selected yet.");
        }
        if (!self.isValidCoil(address)) {
            throw new MBInvalidDataAddressError("Invalid address.");
        }
        return coils[address];
    };

    /**
     *  Write the value of specified coil.
     * 
     *  @throws {MBInvalidNodeError}
     *    - No unit was selected yet.
     *  @throws {MBInvalidDataAddressError}
     *    - The coil address is invalid.
     *  @param {Number} address 
     *    - The coil address.
     *  @param {Boolean} value 
     *    - The coil value.
     */
    this.writeCoil = function(address, value) {
        if (!selected) {
            throw new MBInvalidNodeError("No unit was selected yet.");
        }
        if (!self.isValidCoil(address)) {
            throw new MBInvalidDataAddressError("Invalid address.");
        }
        coils[address] = value;
    };

    /**
     *  Check whether the address of an input register is valid.
     * 
     *  @param {Number} address 
     *    - The register address.
     *  @return {Boolean}
     *    - True if valid.
     */
    this.isValidInputRegister = function(address) {
        if (!selected) {
            return false;
        }
        return Number.isInteger(address) && 
               address >= 0 && 
               address < regs.length;
    };

    /**
     *  Read the value of specified input register.
     * 
     *  @throws {MBInvalidNodeError}
     *    - No unit was selected yet.
     *  @throws {MBInvalidDataAddressError}
     *    - The register address is invalid.
     *  @param {Number} address 
     *    - The register address.
     *  @return {Number}
     *    - The register value.
     */
    this.readInputRegister = function(address) {
        if (!selected) {
            throw new MBInvalidNodeError("No unit was selected yet.");
        }
        if (!self.isValidInputRegister(address)) {
            throw new MBInvalidDataAddressError("Invalid address.");
        }
        return regs[address];
    };

    /**
     *  Check whether the address of a holding register is valid.
     * 
     *  @param {Number} address 
     *    - The register address.
     *  @return {Boolean}
     *    - True if valid.
     */
    this.isValidHoldingRegister = function(address) {
        if (!selected) {
            return false;
        }
        return Number.isInteger(address) && 
               address >= 0 && 
               address < regs.length;
    };

    /**
     *  Read the value of specified holding register.
     * 
     *  @throws {MBInvalidNodeError}
     *    - No unit was selected yet.
     *  @throws {MBInvalidDataAddressError}
     *    - The register address is invalid.
     *  @param {Number} address 
     *    - The register address.
     *  @return {Number}
     *    - The register value.
     */
    this.readHoldingRegister = function(address) {
        if (!selected) {
            throw new MBInvalidNodeError("No unit was selected yet.");
        }
        if (!self.isValidHoldingRegister(address)) {
            throw new MBInvalidDataAddressError("Invalid address.");
        }
        return regs[address];
    };

    /**
     *  Write the value of specified holding register.
     * 
     *  @throws {MBInvalidNodeError}
     *    - No unit was selected yet.
     *  @throws {MBInvalidDataAddressError}
     *    - The register address is invalid.
     *  @throws {MBInvalidDataValueError}
     *    - The register value is invalid.
     *  @param {Number} address 
     *    - The register address.
     *  @param {Number} value
     *    - The register value.
     */
    this.writeHoldingRegister = function(address, value) {
        if (!selected) {
            throw new MBInvalidNodeError("No unit was selected yet.");
        }
        if (!self.isValidHoldingRegister(address)) {
            throw new MBInvalidDataAddressError("Invalid address.");
        }
        regs[address] = value;
    };
}

/**
 *  Example Modbus slave service initiator.
 * 
 *  @constructor
 *  @extends {IMBSlaveServiceInitiator}
 */
function MBExampleSlaveServiceInitiator() {
    //  Let parent class initialize.
    IMBSlaveServiceInitiator.call(this);

    //
    //  Public methods.
    //

    /**
     *  Initiate transport-layer.
     * 
     *  Note(s) to the implementer:
     *    [1] Once this function returned, the transport object would be totally
     *        managed by the slave service. It is highly NOT recommended for 
     *        your upper application to do any operation on the transport 
     *        object directly.
     *    [2] To close the transport, call MBSlaveService.prototype.close() 
     *        instead of closing the transport directly.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate transport-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBSlaveTransport>}
     *    - The promise object (resolves with the transport if succeed, rejects 
     *      if error occurred).
     */
    this.initiateTransportLayer = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        let factory = new MBAsciiSlaveTransportFactory();
        return await factory.create({
            "device": {
                "driver": "generic",
                "path": MY_SERIALPORT_PATH,
                "baudrate": MY_SERIALPORT_BAUDRATE,
                "data-bits": MY_SERIALPORT_DATABITS,
                "parity": MY_SERIALPORT_PARITY,
                "stop-bits": MY_SERIALPORT_STOPBITS
            }
        }, cancellator);
    };

    /**
     *  Initiate protocol-layer.
     * 
     *  Note(s) to the implementer:
     *    [1] The protocol-layer returned by this method can be modified on-fly.
     *        It means that your application can change the protocol-layer even 
     *        the slave service is still running.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate protocol-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<MBSlaveProtocolLayer>}
     *    - The promise object (resolves with the protocol-layer if succeed, 
     *      rejects if error occurred).
     */
    this.initiateProtocolLayer = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        let protocolLayer = new MBSlaveProtocolLayer();
        let services = protocolLayer.getServiceHost();
        services.register(MBSlaveProtocolReadCoilsService.INSTANCE);
        services.register(MBSlaveProtocolReadDiscreteInputService.INSTANCE);
        services.register(MBSlaveProtocolReadHoldingRegisterService.INSTANCE);
        services.register(MBSlaveProtocolReadInputRegisterService.INSTANCE);
        services.register(MBSlaveProtocolWriteSingleCoilService.INSTANCE);
        services.register(MBSlaveProtocolWriteSingleRegisterService.INSTANCE);
        services.register(MBSlaveProtocolWriteMultipleCoilsService.INSTANCE);
        services.register(MBSlaveProtocolWriteMultipleRegistersService.INSTANCE);
        return protocolLayer;
    };

    /**
     *  Initiate data model.
     * 
     *  Note(s) to the implementer:
     *    [1] The data model returned by this method is NOT managed by the slave
     *        service and can be modified on-fly.
     *        It means that your application can change the data model even the 
     *        slave service is still running. It also means that it is your 
     *        upper application's responsibility to dispose resources used by 
     *        the data model.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInitiateError}
     *    - Failed to initiate protocol-layer.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<IMBDataModel>}
     *    - The promise object (resolves with the data model if succeed, rejects
     *      if error occurred).
     */
    this.initiateDataModel = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        let model = new MBExampleDataModel();
        return model;
    };
}

//
//  Inheritances.
//
Util.inherits(MBExampleDataModel, IMBDataModel);
Util.inherits(MBExampleSlaveServiceInitiator, IMBSlaveServiceInitiator);

//
//  Main.
//
(async function() {
    //  Create a slave service.
    let slaveInitiator = new MBExampleSlaveServiceInitiator();
    let slave = await MBSlaveService.Create(slaveInitiator);

    //  Handle SIGINT.
    Process.on("SIGINT", function() {
        if (!slave.isClosed()) {
            slave.close(true);
        }
    });

    //  Wait for the service to be closed.
    console.log("Use Ctrl+C to stop the service...");
    await slave.wait();
    console.log("The service has been stopped.");
})().catch(function(error) {
    console.log("An error occurred:");
    console.log(error);
});