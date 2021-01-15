//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Public functions.
//

/**
 *  Estimate one character time.
 * 
 *  @param {Number} baudrate
 *    - The baudrate.
 *  @param {Number} nDataBits
 *    - The count of data bits.
 *  @param {Number} nParityBit
 *    - The count of parity bit(s).
 *  @param {Number} nStopBits
 *    - The count of stop bits.
 *  @returns {Number}
 *    - The one character time (unit: nanoseconds).
 */
function EstimateCharacterTime(
    baudrate,
    nDataBits,
    nParityBit,
    nStopBits
) {
    let bitsPerChar = 1 + nDataBits + nParityBit + nStopBits;
    let nsPerBit = 1E9 / baudrate;
    return nsPerBit * bitsPerChar;
}

//  Export public APIs.
module.exports = {
    "EstimateCharacterTime": EstimateCharacterTime
};