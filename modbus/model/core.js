//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbError = 
    require("./../../error");

//  Imported classes.
const MBInvalidNodeError = 
    MbError.MBInvalidNodeError;
const MBInvalidDataAddressError = 
    MbError.MBInvalidDataAddressError;
const MBInvalidDataValueError = 
    MbError.MBInvalidDataValueError;

//
//  Classes.
//

/**
 *  Interface of all Modbus data model classes.
 * 
 *  @constructor
 */
function IMBDataModel() {
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
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
        throw new Error("Not implemented.");
    };
}

//  Export public APIs.
module.exports = {
    "IMBDataModel": IMBDataModel
};