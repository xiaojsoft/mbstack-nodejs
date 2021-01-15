//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Classes.
//

/**
 *  Modbus LRC hasher.
 * 
 *  @constructor
 */
function MBLRC() {
    //
    //  Members.
    //

    //  LRC sum.
    let sum = 0x00;

    //
    //  Public methods.
    //

    /**
     *  Update the LRC digest with single datum (byte).
     * 
     *  @param {Number} datum
     *    - The datum (byte).
     */
    this.updateSingleByte = function(datum) {
        sum += datum;
        sum &= 0xff;
    };

    /**
     *  Update the LRC digest with specific data.
     * 
     *  @param {Buffer} data
     *      - The data.
     */
    this.update = function(data) {
        for (let i = 0; i < data.length; ++i) {
            let datum = data.readUInt8(i);
            sum += datum;
            sum &= 0xff;
        }
    };

    /**
     *  Get the LRC digest.
     * 
     *  @return {Number}
     *      - The digest.
     */
    this.digest = function() {
        let lrc = (0xff ^ sum);
        return (lrc + 1) & 0xff;
    };
}

//  Export public APIs.
module.exports = {
    "MBLRC": MBLRC
};