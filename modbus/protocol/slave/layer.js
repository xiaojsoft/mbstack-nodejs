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
    require("./service");

//  Imported classes.
const MBSlaveProtocolServiceHost = 
    MbPrSlaveService.MBSlaveProtocolServiceHost;

//
//  Classes.
//

/**
 *  Modbus slave protocol-layer.
 * 
 *  @constructor
 */
function MBSlaveProtocolLayer() {
    //
    //  Members.
    //

    //  Service host.
    let serviceHost = new MBSlaveProtocolServiceHost();

    //
    //  Public methods.
    //

    /**
     *  Get the service host.
     * 
     *  @returns {MBSlaveProtocolServiceHost}
     *    - The service host.
     */
    this.getServiceHost = function() {
        return serviceHost;
    };
}

//  Export public APIs.
module.exports = {
    "MBSlaveProtocolLayer": MBSlaveProtocolLayer
};