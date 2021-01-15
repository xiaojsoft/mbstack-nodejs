//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlDriverGeneric = 
    require("./generic/sl-drivergeneric");
const MbTspSlDriverCore = 
    require("./sl-drivercore");

//  Imported classes.
const IMBSerialPortDriver = 
    MbTspSlDriverCore.IMBSerialPortDriver;
const MBGenericSerialPortDriver = 
    MbTspSlDriverGeneric.MBGenericSerialPortDriver;

//
//  Classes.
//

/**
 *  Modbus serial port driver registry.
 * 
 *  @constructor
 */
function MBSerialPortDriverRegistry() {
    //
    //  Members.
    //

    //  Driver name to instance mapping.
    let drivers = new Map();

    //
    //  Public methods.
    //

    /**
     *  Register a driver.
     * 
     *  @param {IMBSerialPortDriver} driver
     *    - The driver.
     *  @returns {Boolean}
     *    - True if succeed.
     */
    this.register = function(driver) {
        let name = driver.getDriverName();
        if (drivers.has(name)) {
            return false;
        } else {
            drivers.set(name, driver);
            return true;
        }
    };

    /**
     *  Unregister a driver.
     * 
     *  @param {IMBSerialPortDriver} driver
     *    - The driver.
     *  @returns {Boolean}
     *    - True if succeed.
     */
    this.unregister = function(driver) {
        let name = driver.getDriverName();
        return drivers.delete(name);
    };

    /**
     *  Get driver.
     * 
     *  @param {String} name
     *    - The driver name.
     *  @returns {?IMBSerialPortDriver}
     *    - The driver (NULL if not exists).
     */
    this.getDriver = function(name) {
        if (drivers.has(name)) {
            return null;
        }
        return drivers.get(name);
    };
}

/**
 *  Get global driver registry.
 * 
 *  @returns {MBSerialPortDriverRegistry}
 *    - The driver registry.
 */
MBSerialPortDriverRegistry.GetGlobal = (function() {
    let instance = new MBSerialPortDriverRegistry();
    instance.register(MBGenericSerialPortDriver.INSTANCE);
    return function() {
        return instance;
    };
})();

//  Export public APIs.
module.exports = {
    "MBSerialPortDriverRegistry": MBSerialPortDriverRegistry
};