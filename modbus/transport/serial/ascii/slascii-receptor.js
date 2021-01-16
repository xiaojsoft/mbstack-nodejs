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
const MbError = 
    require("./../../../../error");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const Events = 
    require("events");
const Util = 
    require("util");

//  Imported classes.
const MBBugError = 
    MbError.MBBugError;
const EventEmitter = 
    Events.EventEmitter;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//  Imported constants.
const ASCII_COLON = 
    MbTspSlAsciiConstants.ASCII_COLON;
const ASCII_CR = 
    MbTspSlAsciiConstants.ASCII_CR;
const ASCII_LF = 
    MbTspSlAsciiConstants.ASCII_LF;
const MAX_FRAME_SIZE = 
    MbTspSlAsciiConstants.MAX_FRAME_SIZE;

//
//  Constants.
//

//  Receptor states.
const STATE_IDLE   = 0;
const STATE_APPEND = 1;
const STATE_EOF    = 2;

//
//  Classes.
//

/**
 *  Modbus ASCII frame receptor.
 * 
 *  Note(s):
 *    [1] This class implements a standalone Modbus ASCII frame reception state 
 *        machine which is independent from underlying reception mechanism.
 * 
 *  @constructor
 *  @extends {EventEmitter}
 */
function MBAsciiReceptor() {
    //  Let parent class initialize.
    EventEmitter.call(this);

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Frame buffer.
    let frameBuf = Buffer.allocUnsafe(MAX_FRAME_SIZE);
    let frameBufWrOfx = 0;

    //  Frame flag.
    let frameFlag = 0;

    //  State.
    let state = STATE_IDLE;

    //
    //  Private methods.
    //

    /**
     *  New frame.
     */
    function _Frame_Reset() {
        frameBufWrOfx = 0;
        frameFlag = 0;
    }

    /**
     *  Append character to current frame.
     * 
     *  @param {Number} datum
     *    - The character.
     */
    function _Frame_AppendChar(datum) {
        if (frameBufWrOfx >= frameBuf.length) {
            frameFlag |= MBAsciiReceptor.FRAMEFLAG_NOK;
            frameFlag |= MBAsciiReceptor.FRAMEFLAG_OVERRUN;
        } else {
            frameBuf.writeUInt8(datum, frameBufWrOfx);
            ++(frameBufWrOfx);
        }
    }

    /**
     *  End current frame.
     */
    function _Frame_End() {
        self.emit("frame", frameBuf.slice(0, frameBufWrOfx), frameFlag);
    }

    //
    //  Public methods.
    //

    /**
     *  Input one character.
     * 
     *  @param {Number} ch
     *    - The character.
     *  @param {Boolean} chvalid
     *    - True if the parity of the character is valid.
     *  @param {Boolean} chovrrun
     *    - True if overrun occurred in the underlying reception mechanism.
     */
    this.input = function(ch, chvalid, chovrrun) {
        if (state == STATE_IDLE) {
            //  Start new frame when we got a colon character.
            if (ch == ASCII_COLON) {
                _Frame_Reset();
                _Frame_AppendChar(ASCII_COLON);
                state = STATE_APPEND;
            }
        } else {
            //  NOK the frame if the character is not valid.
            if (!chvalid) {
                frameFlag |= MBAsciiReceptor.FRAMEFLAG_NOK;
            }

            //  NOK the frame and set the overrun flag if overrun occurred in 
            //  the underlying reception mechanism.
            if (chovrrun) {
                frameFlag |= MBAsciiReceptor.FRAMEFLAG_NOK;
                frameFlag |= MBAsciiReceptor.FRAMEFLAG_OVERRUN;
            }

            //  Handle frame reception.
            if (state == STATE_APPEND) {
                if (ch == ASCII_COLON) {
                    _Frame_Reset();
                    _Frame_AppendChar(ASCII_COLON);
                } else if (ch == ASCII_CR) {
                    _Frame_AppendChar(ASCII_CR);
                    state = STATE_EOF;
                } else {
                    _Frame_AppendChar(ch);
                }
            } else if (state == STATE_EOF) {
                if (ch == ASCII_COLON) {
                    _Frame_Reset();
                    _Frame_AppendChar(ASCII_COLON);
                    state = STATE_APPEND;
                } else if (ch == ASCII_LF) {
                    _Frame_AppendChar(ASCII_LF);
                    _Frame_End();
                    state = STATE_IDLE;
                } else {
                    _Frame_AppendChar(ch);
                    if (ch != ASCII_CR) {
                        state = STATE_APPEND;
                    }
                }
            } else {
                ReportBug("Invalid state.", true, MBBugError);
            }
        }
    };
}

//  Frame flags.
MBAsciiReceptor.FRAMEFLAG_NOK     = 0x01;
MBAsciiReceptor.FRAMEFLAG_OVERRUN = 0x02;

//
//  Inheritances.
//
Util.inherits(MBAsciiReceptor, EventEmitter);

//  Export public APIs.
module.exports = {
    "MBAsciiReceptor": MBAsciiReceptor
};