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

//  Imported constants.
const ASCII_UPPER_A = 
    MbTspSlAsciiConstants.ASCII_UPPER_A;
const ASCII_UPPER_F = 
    MbTspSlAsciiConstants.ASCII_UPPER_F;
const ASCII_DIGIT_0 = 
    MbTspSlAsciiConstants.ASCII_DIGIT_0;
const ASCII_DIGIT_9 = 
    MbTspSlAsciiConstants.ASCII_DIGIT_9;

//
//  Constants.
//

//  Half-byte to hex.
const HALFBYTE2HEX = (function() {
    let tbl = [];
    for (let ch = ASCII_DIGIT_0; ch <= ASCII_DIGIT_9; ++ch) {
        tbl.push(ch);
    }
    for (let ch = ASCII_UPPER_A; ch <= ASCII_UPPER_F; ++ch) {
        tbl.push(ch);
    }
    return tbl;
})();

//  Byte to hex word.
const BYTE2HEXWD = (function() {
    let tbl = [];
    for (let datum = 0x00; datum <= 0xFF; ++datum) {
        let hi = (datum >> 4);
        let lo = (datum & 0xF);
        let wd = ((HALFBYTE2HEX[hi] << 8) | HALFBYTE2HEX[lo]);
        tbl.push(wd);
    }
    return tbl;
})();

//  Hex word to byte.
const HEXWD2BYTE = (function() {
    let tbl = [];
    for (let i = 0x0000; i <= 0xFFFF; ++i) {
        tbl.push(-1);
    }
    for (let datum = 0x00; datum <= 0xFF; ++datum) {
        tbl[BYTE2HEXWD[datum]] = datum;
    }
    return tbl;
})();

//  Export public APIs.
module.exports = {
    "BYTE2HEXWD": BYTE2HEXWD,
    "HEXWD2BYTE": HEXWD2BYTE
};