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
const Process = 
    require("process");
const Timers = 
    require("timers");
const Util = 
    require("util");

//  Imported classes.
const MBBugError = 
    MbError.MBBugError;
const MBParameterError = 
    MbError.MBParameterError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const EventFlags = 
    XRTLibAsync.Synchronize.Event.EventFlags;

//  Imported functions.
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;
const CreateTimeoutPromiseEx = 
    XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromiseEx;
const ReportBug = 
    XRTLibBugHandler.ReportBug;

//
//  Constants.
//

//  Empty callback.
const EMPTY_CB = function() {};

//  Timer flag bit masks.
const BITMASK_INTVCHG  = 0x01;
const BITMASK_POLLSTOP = 0x02;
const BITMASK_POLLEXIT = 0x04;
const BITMASK_RESTART  = 0x08;

//  Timer states.
const STATE_STOP       = 0;
const STATE_LONGWAIT   = 1;
const STATE_SHORTWAIT  = 2;

//  Long/short timing threshold.
const LONGSHORT_THRESHOLD = 5 * 1000 * 1000;  //  5 milliseconds.

//
//  Classes.
//

/**
 *  Modbus generic serial port timer.
 * 
 *  @constructor
 */
function MBGenericSerialPortTimer() {
    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Tick callback.
    let cbTick = EMPTY_CB;

    //  Interval.
    let interval = 0;
    let intervalBigInt = 0n;
    
    //  Timestamp of the next tick.
    let nextTickTimestamp = 0n;

    //  Flags.
    let flags = new EventFlags(0x00);

    //
    //  Private methods.
    //

    /**
     *  Update the timestamp of the next tick.
     * 
     *  @param {BigInt} [ts]
     *    - Current timestamp.
     */
    function _UpdateNextTickTimestamp(ts = Process.hrtime.bigint()) {
        nextTickTimestamp = ts + intervalBigInt;
    }

    /**
     *  Try to tick.
     * 
     *  @param {BigInt} [ts]
     *    - Current timestamp.
     *  @param {Boolean} [forcibly]
     *    - True if to tick forcibly.
     */
    function _TryTick(ts = Process.hrtime.bigint(), forcibly = false) {
        if (forcibly || ts >= nextTickTimestamp) {
            _UpdateNextTickTimestamp(ts);
            cbTick.call(self);
            return true;
        } else {
            return false;
        }
    }

    /**
     *  Poll tick.
     */
    function _PollTick() {
        //  Stop if "POLLSTOP" flag is set.
        if ((flags.value & BITMASK_POLLSTOP) != 0) {
            //  Reset "POLLSTOP" flag.
            flags.post(BITMASK_POLLSTOP, EventFlags.POST_FLAG_CLR);

            //  Set "POLLEXIT" flag.
            flags.post(BITMASK_POLLEXIT, EventFlags.POST_FLAG_SET);

            return;
        }

        //  Try to tick.
        _TryTick(Process.hrtime.bigint(), false);

        //  Next cycle.
        Timers.setImmediate(_PollTick);
    }

    //
    //  Public methods.
    //

    /**
     *  Set the tick callback.
     * 
     *  @param {() => void} cb
     *    - The callback.
     */
    this.setTickCallback = function(cb) {
        cbTick = cb;
    };

    /**
     *  Get the tick callback.
     * 
     *  @returns {() => void}
     *    - The callback.
     */
    this.getTickCallback = function() {
        return cb;
    };

    /**
     *  Set the interval.
     * 
     *  @param {Number} intv
     *    - The new interval (0 to stop the timer, unit: nanoseconds).
     */
    this.setInterval = function(intv) {
        //  Check the new interval.
        if (!(Number.isInteger(intv) && intv >= 0)) {
            throw new MBParameterError("Invalid interval.");
        }

        //  Save the new interval.
        interval = intv;
        intervalBigInt = BigInt(intv);

        //  Set the "INTVCHG" flag.
        flags.post(BITMASK_INTVCHG, EventFlags.POST_FLAG_SET);
    };

    /**
     *  Get the interval.
     * 
     *  @returns {Number}
     *    - The interval (unit: nanoseconds).
     */
    this.getInterval = function() {
        return interval;
    };

    /**
     *  Restart the timer.
     */
    this.restart = function() {
        flags.post(BITMASK_RESTART, EventFlags.POST_FLAG_SET);
        self.setInterval(self.getInterval());
    };

    //
    //  Coroutine(s).
    //

    //  Main coroutine.
    (async function() {
        let state = STATE_STOP;
        while(true) {
            if (state == STATE_STOP) {
                if ((flags.value & BITMASK_RESTART) != 0) {
                    flags.post(BITMASK_RESTART, EventFlags.POST_FLAG_CLR);
                }
                if (interval >= LONGSHORT_THRESHOLD) {
                    _UpdateNextTickTimestamp();
                    state = STATE_LONGWAIT;
                } else if (interval > 0) {
                    _UpdateNextTickTimestamp();
                    state = STATE_SHORTWAIT;
                } else {
                    await flags.pend(
                        BITMASK_INTVCHG, 
                        (
                            EventFlags.PEND_FLAG_SET_ALL | 
                            EventFlags.PEND_FLAG_CONSUME
                        )
                    );
                }
            } else if (state == STATE_LONGWAIT) {
                //  Get current timestamp.
                let ts = Process.hrtime.bigint();

                //  Try to tick.
                if (_TryTick(ts, false)) {
                    continue;
                }

                //  No tick now. Let's delay.
                let dly = nextTickTimestamp - ts;
                if (dly > 1000000000n) {
                    dly = 1000;
                } else {
                    dly = Number(dly) / 1000000;
                }

                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = CreateTimeoutPromiseEx(dly, cts);
                let wh2 = flags.pend(
                    BITMASK_INTVCHG,
                    (
                        EventFlags.PEND_FLAG_SET_ALL | 
                        EventFlags.PEND_FLAG_CONSUME
                    ),
                    cts
                );
                let rsv = await CreatePreemptivePromise([wh1, wh2]);
                cts.fullfill();

                //  Try handle wait handler 2 since it has the highest priority.
                try {
                    //  Try wait.
                    await wh2;

                    //  Handle the new interval.
                    if (interval >= LONGSHORT_THRESHOLD) {
                        if ((flags.value & BITMASK_RESTART) != 0) {
                            _UpdateNextTickTimestamp();
                            flags.post(
                                BITMASK_RESTART, 
                                EventFlags.POST_FLAG_CLR
                            );
                        }
                        state = STATE_LONGWAIT;
                    } else if (interval > 0) {
                        if ((flags.value & BITMASK_RESTART) != 0) {
                            _UpdateNextTickTimestamp();
                            flags.post(
                                BITMASK_RESTART, 
                                EventFlags.POST_FLAG_CLR
                            );
                        }
                        state = STATE_SHORTWAIT;
                    } else {
                        state = STATE_STOP;
                    }

                    continue;
                } catch(error) {
                    //  Operation cancelled. Do nothing.
                }

                //  Handle other signal(s).
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Try to tick again.
                    continue;
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            } else if (state == STATE_SHORTWAIT) {
                //  Run the poller.
                _PollTick();

                //  Wait for interval change.
                await flags.pend(
                    BITMASK_INTVCHG, (
                        EventFlags.PEND_FLAG_SET_ALL | 
                        EventFlags.PEND_FLAG_CONSUME
                    )
                );

                //  Stop the poller.
                flags.post(BITMASK_POLLSTOP, EventFlags.POST_FLAG_SET);
                await flags.pend(BITMASK_POLLEXIT, (
                    EventFlags.PEND_FLAG_SET_ALL | 
                    EventFlags.PEND_FLAG_CONSUME
                ));

                //  Handle the new interval.
                if (interval >= LONGSHORT_THRESHOLD) {
                    if ((flags.value & BITMASK_RESTART) != 0) {
                        _UpdateNextTickTimestamp();
                        flags.post(
                            BITMASK_RESTART, 
                            EventFlags.POST_FLAG_CLR
                        );
                    }
                    state = STATE_LONGWAIT;
                } else if (interval > 0) {
                    if ((flags.value & BITMASK_RESTART) != 0) {
                        _UpdateNextTickTimestamp();
                        flags.post(
                            BITMASK_RESTART, 
                            EventFlags.POST_FLAG_CLR
                        );
                    }
                    state = STATE_SHORTWAIT;
                } else {
                    state = STATE_STOP;
                }
            } else {
                ReportBug("Invalid state.", true, MBBugError);
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main coroutine throw an exception (error=\"%s\").", 
            error.message || "Unknown error."
        ), false, MBBugError);
    });
}

//  Export public APIs.
module.exports = {
    "MBGenericSerialPortTimer": MBGenericSerialPortTimer
};