//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspTcpTransaction = require("./../tcp-transaction");
const MbTspTcpTransceiver = require("./../tcp-transceiver");

//  Imported classes.
const MBTCPTransceiver = 
    MbTspTcpTransceiver.MBTCPTransceiver;
const MBTCPTransactionManager = 
    MbTspTcpTransaction.MBTCPTransactionManager;

//
//  Classes.
//

/**
 *  Modbus TCP master connection.
 * 
 *  @constructor
 *  @param {MBTCPTransceiver} rxtx 
 *    - The frame transceiver.
 *  @param {MBTCPTransactionManager} trmgr 
 *    - The transaction manager.
 */
function MBTCPMasterConnection(rxtx, trmgr) {
    //
    //  Public methods.
    //

    /**
     *  Get the frame transceiver.
     * 
     *  @returns {MBTCPTransceiver}
     *    - The transceiver.
     */
    this.getTransceiver = function() {
        return rxtx;
    };

    /**
     *  Get the transaction manager.
     * 
     *  @returns {MBTCPTransactionManager}
     *    - The transaction manager.
     */
    this.getTransactionManager = function() {
        return trmgr;
    };
}

//  Export public APIs.
module.exports = {
    "MBTCPMasterConnection": MBTCPMasterConnection
};