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
    require("./../../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");

//  Imported classes.
const MBBugError = 
    MbError.MBBugError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBParameterError = 
    MbError.MBParameterError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const EventFlags = 
    XRTLibAsync.Synchronize.Event.EventFlags;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//
//  Constants.
//

//  Bit flags.
const BITFLAG_RXDATA     = 0x01;
const BITFLAG_RXOVERRUN  = 0x02;

//  Default maximum buffer byte count.
const DFLT_MAXBUFFERBYTECNT = 1024;

//
//  Classes.
//

/**
 *  Modbus generic serial port receiver options.
 * 
 *  @constructor
 */
function MBGenericSerialPortReceiverOption() {
    //
    //  Members.
    //

    //  Max buffer byte count.
    let maxBufferByteCnt = DFLT_MAXBUFFERBYTECNT;

    //
    //  Public methods.
    //

    /**
     *  Get the maximum buffer byte count.
     * 
     *  @returns {Number}
     *    - The byte count.
     */
    this.getMaxBufferByteCount = function() {
        return maxBufferByteCnt;
    };

    /**
     *  Set the maximum buffer byte count.
     * 
     *  Note(s):
     *    [1] The maximum buffer byte count must be an positive integer.
     * 
     *  @throws {MBParameterError}
     *    - Invalid byte count.
     *  @param {Number} [cnt]
     *    - The new byte count.
     */
    this.setMaxBufferByteCount = function(cnt) {
        //  Check the byte count.
        if (!(Number.isInteger(cnt) && cnt >= 1)) {
            throw new MBParameterError("Invalid byte count.");
        }

        //  Save the byte count.
        maxBufferByteCnt = cnt;
    };
}

/**
 *  Modbus generic serial port receiver.
 * 
 *  @constructor
 *  @param {MBGenericSerialPortReceiverOption} [options]
 *    - The receiver options.
 */
function MBGenericSerialPortReceiver(
    options = new MBGenericSerialPortReceiverOption()
) {
    //
    //  Members.
    //

    //  Max buffer byte count.
    let maxBufferByteCnt = options.getMaxBufferByteCount();

    //  Flag bits.
    let flags = new EventFlags(0x00);

    //  Buffer.
    let buffers = [];
    let bufferOffsets = [];
    let bufferByteCnt = 0;

    //  Current character register.
    let charValue = 0x00;
    let charValidity = false;

    //
    //  Public methods.
    //

    /**
     *  Next character.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<void>}
     *    - The promise object (resolves if the next character was loaded into 
     *      current character register successfully, rejects if error occurred).
     */
    this.next = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        while(true) {
            //  Wait for data to be available or cancelled.
            let cts = new ConditionalSynchronizer();
            let wh1 = flags.pend(
                BITFLAG_RXDATA, 
                EventFlags.PEND_FLAG_SET_ALL, 
                cts
            );
            let wh2 = cancellator.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Keep going if no data available in current tick.
                if (bufferByteCnt == 0) {
                    continue;
                }

                //  Get one character from the first data buffer.
                let buf = buffers[0];
                let offset = bufferOffsets[0];
                charValue = buf.readUInt8(offset);
                charValidity = true;
                ++(offset);
                if (offset == buf.length) {
                    buffers.shift();
                    bufferOffsets.shift();
                } else {
                    bufferOffsets[0] = offset;
                }
                --(bufferByteCnt);

                //  Clear the data available flag if the buffer goes empty.
                if (bufferByteCnt == 0) {
                    flags.post(BITFLAG_RXDATA, EventFlags.POST_FLAG_CLR);
                }

                return;
            } else if (wh == wh2) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

    };

    /**
     *  Input data to the receiver.
     * 
     *  @param {Buffer} data
     *    - The data.
     */
    this.input = function(data) {
        //  Do nothing if the data is empty.
        if (data.length == 0) {
            return;
        }

        //  Get the remaining buffer size.
        let bufferRemainCnt = maxBufferByteCnt - bufferByteCnt;

        //  Cut the data if the data length exceeds the remaining buffer size.
        let overflown = false;
        if (data.length > bufferRemainCnt) {
            overflown = true;
            data = data.slice(0, bufferRemainCnt);
        }

        //  Insert the data.
        buffers.push(data);
        bufferOffsets.push(0);
        bufferByteCnt += data.length;

        //  Mark flag(s).
        if (overflown) {
            flags.post(
                (BITFLAG_RXDATA | BITFLAG_RXOVERRUN), 
                EventFlags.POST_FLAG_SET
            );
        } else {
            flags.post(
                BITFLAG_RXDATA,
                EventFlags.POST_FLAG_SET
            );
        }
    };

    /**
     *  Get current character.
     * 
     *  @returns {Number}
     *    - The character.
     */
    this.getCurrentCharacter = function() {
        return charValue;
    };

    /**
     *  Get whether current character is valid.
     * 
     *  Note(s):
     *    [1] A character is valid means that its parity and UART frame are 
     *        both correct.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isCurrentCharacterValid = function() {
        return charValidity;
    };

    /**
     *  Get whether buffer overrun occurred.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isBufferOverrun = function() {
        return ((flags.value & BITFLAG_RXOVERRUN) != 0);
    };

    /**
     *  Clear the buffer overrun occurred mark.
     */
    this.clearBufferOverrun = function() {
        flags.post(BITFLAG_RXOVERRUN, EventFlags.POST_FLAG_CLR);
    };
}

//  Export public APIs.
module.exports = {
    "MBGenericSerialPortReceiverOption": MBGenericSerialPortReceiverOption,
    "MBGenericSerialPortReceiver": MBGenericSerialPortReceiver
};