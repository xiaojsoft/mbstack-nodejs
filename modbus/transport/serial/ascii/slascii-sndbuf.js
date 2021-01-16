//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlAsciiConstants = 
    require("./slascii-constants");
const MbTspSlAsciiLRC = 
    require("./slascii-lrc");
const MbError = 
    require("./../../../../error");
const MbTspSlAsciiHexWord = 
    require("./slascii-hexword");

//  Imported classes.
const MBLRC = 
    MbTspSlAsciiLRC.MBLRC;
const MBOverflowError = 
    MbError.MBOverflowError;
    
//  Imported constants.
const BYTE2HEXWD = 
    MbTspSlAsciiHexWord.BYTE2HEXWD;
const ASCII_COLON = 
    MbTspSlAsciiConstants.ASCII_COLON;
const ASCII_CR = 
    MbTspSlAsciiConstants.ASCII_CR;
const ASCII_LF = 
    MbTspSlAsciiConstants.ASCII_LF;
const MAX_FRAME_SIZE = 
    MbTspSlAsciiConstants.MAX_FRAME_SIZE;

//
//  Classes.
//

/**
 *  Modbus ASCII frame send buffer.
 * 
 *  @constructor
 */
function MBAsciiSendBuffer() {
    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Send buffer.
    let sndbuf = Buffer.allocUnsafe(MAX_FRAME_SIZE);
    sndbuf.writeUInt8(ASCII_COLON, 0);
    let sndbufptr = 1;

    //  LRC hasher.
    let sndbuflrc = new MBLRC();

    //
    //  Public methods.
    //

    /**
     *  Append one byte (raw data) to the Modbus ASCII frame.
     * 
     *  @throws {MBOverflowError}
     *    - Buffer overflow.
     *  @param {Number} datum
     *    - The byte.
     */
    this.append = function(datum) {
        let sndbufnextptr = sndbufptr + 2;
        if (sndbufnextptr > sndbuf.length) {
            throw new MBOverflowError("Buffer overflow.");
        }
        sndbuflrc.updateSingleByte(datum);
        sndbuf.writeUInt16BE(BYTE2HEXWD[datum], sndbufptr);
        sndbufptr = sndbufnextptr;
    };

    /**
     *  Append multi bytes (raw data) to the Modbus ASCII frame.
     * 
     *  @throws {MBOverflowError}
     *    - Buffer overflow.
     *  @param {Buffer} bytes
     *    - The bytes.
     */
    this.appendBytes = function(bytes) {
        for (let i = 0; i < bytes.length; ++i) {
            self.append(bytes.readUInt8(i));
        }
    };

    /**
     *  End the send buffer.
     * 
     *  @throws {MBOverflowError}
     *    - Buffer overflow.
     *  @returns {Buffer}
     *    - The buffer that contains the Modbus ASCII frame to be sent.
     */
    this.end = function() {
        let endptr = sndbufptr + 4;
        if (endptr > sndbuf.length) {
            throw new MBOverflowError("Buffer overflow.");
        }
        sndbuf.writeUInt16BE(BYTE2HEXWD[sndbuflrc.digest()], sndbufptr);
        sndbuf.writeUInt8(ASCII_CR, sndbufptr + 2);
        sndbuf.writeUInt8(ASCII_LF, sndbufptr + 3);
        return sndbuf.slice(0, endptr);
    };
}

//  Export public APIs.
module.exports = {
    "MBAsciiSendBuffer": MBAsciiSendBuffer
};