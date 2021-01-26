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
    require("./../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");

//  Imported classes.
const MBBugError = 
    MbError.MBBugError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
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
const BITFLAG_ACTIVEID_FULL = 0x01;

//
//  Classes.
//

/**
 *  Internal Modbus TCP transaction manager.
 * 
 *  @constructor
 */
function MBTCPInternalTransactionManager() {
    //
    //  Members.
    //

    //  Ranges array.
    let ranges = [[0x0000, 0xFFFF]];

    //  Next preferred ID.
    let preferred = 0x0000;

    //  Active IDs set.
    let actives = new Set();

    //
    //  Private methods.
    //

    /**
     *  Get and roll the next preferred ID.
     * 
     *  @return {Number}
     *    - The preferred ID.
     */
    function _RollPreferred() {
        let rv = (preferred++);
        if (preferred > 0xFFFF) {
            preferred = 0x0000;
        }
        return rv;
    }

    /**
     *  Find the offset of the range which an ID should belong to.
     * 
     *  @param {Number} id 
     *    - The ID.
     *  @return {Number}
     *    - The offset of the range.
     */
    function _FindPosition(id) {
        let offsetLeft = 0, offsetRight = ranges.length - 1;
        while (offsetLeft <= offsetRight) {
            let offsetMid = ((offsetLeft + offsetRight) >> 1);
            let range = ranges[offsetMid];
            if (id >= range[0] && id <= range[1]) {
                return offsetMid;
            } else if (id < range[0]) {
                offsetRight = offsetMid - 1;
            } else {
                offsetLeft = offsetMid + 1;
            }
        }
        return offsetLeft;
    }

    //
    //  Public methods.
    //

    /**
     *  Allocate a transaction ID.
     * 
     *  @throws {MBInvalidOperationError}
     *    - No free ID.
     *  @return {Number}
     *    - The transaction ID.
     */
    this.allocate = function() {
        //  Throw if no free ID.
        if (ranges.length == 0) {
            throw new MBInvalidOperationError("No free ID.");
        }

        //  Get the preferred ID.
        let id = _RollPreferred();

        //  Get the offset of the range that the preferred ID belongs to.
        let rangeOffset = _FindPosition(id);
        if (rangeOffset >= ranges.length) {
            //
            //  No available range with ID equals to or greater than the 
            //  preferred ID can be found. So we have to rollback to the first 
            //  range.
            //
            //  For example:
            //
            //      ranges = [[0, 100], [200, 300]], preferred = 400
            //
            //  No range that is subset of [400, +Inf], so we can only allocate 
            //  an ID from the first range [0, 100].
            //
            rangeOffset = 0;
        }
        let range = ranges[rangeOffset];
        if (id >= range[0] && id <= range[1]) {
            //
            //  The preferred ID is just within the selected range, now there 
            //  are four different conditions.
            //
            //  [1] The range contains only one ID.
            //
            //      For example:
            //
            //          ranges = [..., [100, 100], ...], preferred = 100
            //
            //      After allocation, we just kick the range off from the ranges
            //      array.
            //
            //  [2] The range contains multiple IDs and the preferred ID is just
            //      the leftmost (smallest) ID within that range.
            //
            //      For example:
            //
            //          ranges = [..., [100, 200], ...], preferred = 100
            //
            //      After allocation, the left boundary would be increased to 
            //      indicate that the ID was removed from that range:
            //
            //          ranges = [..., [101, 200], ...]
            //
            //  [3] The range contains multiple IDs and the preferred ID is just
            //      the rightmost (largest) ID within that range.
            //
            //      For example:
            //
            //          ranges = [..., [100, 200], ...], preferred = 200
            //
            //      After allocation, the right boundary would be decreased to 
            //      indicate that the ID was removed from that range:
            //
            //          ranges = [..., [100, 199], ...]
            //
            //  [4] The range contains multiple IDs and the preferred ID is 
            //      neither the leftmost (smallest) nor the rightmost (largest) 
            //      ID within that range.
            //
            //      For example:
            //
            //          ranges = [..., [100, 200], ...], preferred = 150
            //
            //      After allocation, the range would be splitted into two 
            //      ranges to indicate that the ID was removed from that range:
            //
            //          ranges = [..., [100, 149], [151, 200], ...]
            //
            if (range[0] == range[1]) {
                //  Condition 1.
                ranges.splice(rangeOffset, 1);
            } else if (id == range[0]) {
                //  Condition 2.
                ++range[0];
            } else if (id == range[1]) {
                //  Condition 3.
                --range[1];
            } else {
                //  Condition 4.
                ranges.splice(
                    rangeOffset, 
                    1, 
                    [range[0], id - 1], 
                    [id + 1, range[1]]
                );
            }
        } else {
            //
            //  The preferred ID is not within the selected range, now we can 
            //  just allocate the leftmost (smallest) ID from that range.
            //
            id = range[0];
            if (range[0] == range[1]) {
                ranges.splice(rangeOffset, 1);
            } else {
                ++range[0];
            }
        }

        //  Add the allocated ID to the active ID set.
        actives.add(id);

        return id;
    };

    /**
     *  Free (deallocate) a transaction ID.
     * 
     *  @throws {MBInvalidOperationError}
     *    - Not an allocated ID.
     *  @param {Number} id 
     *    - The transaction ID.
     */
    this.free = function(id) {
        //  Throw if the ID was not allocated yet.
        if (!actives.delete(id)) {
            throw new MBInvalidOperationError("Not an allocated ID.");
        }

        //  Insert a range that contains the only ID.
        let rangeOffset = _FindPosition(id);
        ranges.splice(rangeOffset, 0, [id, id]);

        //  Try to merge ranges.
        let rangeMergeOffsetLeft = rangeOffset;
        for (let i = rangeOffset - 1; i >= 0; --i) {
            let range1 = ranges[i];
            let range2 = ranges[i + 1];
            if (range1[1] + 1 == range2[0]) {
                rangeMergeOffsetLeft = i;
            }
        }
        let rangeMergeOffsetRight = rangeOffset;
        for (let i = rangeOffset + 1; i < ranges.length; ++i) {
            let range1 = ranges[i - 1];
            let range2 = ranges[i];
            if (range1[1] + 1 == range2[0]) {
                rangeMergeOffsetRight = i;
            }
        }
        if (rangeMergeOffsetLeft != rangeMergeOffsetRight) {
            let rangeNew = [
                ranges[rangeMergeOffsetLeft][0], 
                ranges[rangeMergeOffsetRight][1]
            ];
            ranges.splice(
                rangeMergeOffsetLeft, 
                rangeMergeOffsetRight - rangeMergeOffsetLeft + 1, 
                rangeNew
            );
        }
    };
}

/**
 *  Modbus TCP transaction manager.
 * 
 *  Note(s):
 *    [1] The count of maximum parallel transactions should between 1 and 65536.
 * 
 *  @constructor
 *  @throws {MBParameterError}
 *    - The count of maximum parallel transactions is invalid.
 *  @param {Number} [nMaxParallelTransactions]
 *    - The count of maximum parallel transactions.
 */
function MBTCPTransactionManager(nMaxParallelTransactions = 65536) {
    //
    //  Parameter check.
    //

    //  Check the maximum parallel transactions count.
    if (!(
        Number.isInteger(nMaxParallelTransactions) && 
        nMaxParallelTransactions >= 1 && 
        nMaxParallelTransactions <= 65536
    )) {
        throw new MBParameterError(
            "Invalid maximum parallel transactions count."
        );
    }

    //
    //  Members.
    //

    //  Bit flags.
    let bitflags = new EventFlags(0);

    //  Active IDs set.
    let actives = new Set();

    //  Internal transaction manager.
    let mgr = new MBTCPInternalTransactionManager();

    //
    //  Private methods.
    //

    /**
     *  Update active ID set bit flags.
     */
    function _UpdateActiveSetBitFlags() {
        if (actives.size >= nMaxParallelTransactions) {
            bitflags.post(
                BITFLAG_ACTIVEID_FULL,
                EventFlags.POST_FLAG_SET
            );
        } else {
            bitflags.post(
                BITFLAG_ACTIVEID_FULL,
                EventFlags.POST_FLAG_CLR
            );
        }
    }

    //
    //  Public methods.
    //

    /**
     *  Allocate a transaction ID.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator] 
     *    - The cancellator.
     *  @returns {Promise<Number>}
     *    - The promise object (resolves with the transaction ID if succeed, 
     *      rejects if error occurred).
     */
    this.allocate = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Wait for the active ID set to be not full.
        while (actives.size >= nMaxParallelTransactions) {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = bitflags.pend(
                BITFLAG_ACTIVEID_FULL,
                EventFlags.PEND_FLAG_CLR_ALL,
                cts
            );
            let wh2 = cancellator.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Check again.
                continue;
            } else if (wh == wh2) {
                throw new MBOperationCancelledError(
                    "The cancellator was activated."
                );
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

        //  Allocate an ID.
        let id = mgr.allocate();
        actives.add(id);
        _UpdateActiveSetBitFlags();

        return id;
    };

    /**
     *  Free (deallocate) a transaction ID.
     * 
     *  @throws {MBInvalidOperationError}
     *    - Not an allocated ID.
     *  @param {Number} id 
     *    - The transaction ID.
     */
    this.free = function(id) {
        //  Throw if the ID was not allocated yet.
        if (!actives.delete(id)) {
            throw new MBInvalidOperationError("Not an allocated ID.");
        }

        //  Free the ID.
        mgr.free(id);
        _UpdateActiveSetBitFlags();
    };
}

//  Export public APIs.
module.exports = {
    "MBTCPTransactionManager": MBTCPTransactionManager
};