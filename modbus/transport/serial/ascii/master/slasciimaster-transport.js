//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const MbTspSlAsciiFrame = 
    require("./../slascii-frame");
const MbTspSlAsciiTransceiver = 
    require("./../slascii-transceiver");
const MbTspSlDriverGeneric = 
    require("./../../driver/generic/sl-drivergeneric");
const MbTspSlDriverCore = 
    require("./../../driver/sl-drivercore");
const MbTspSlDriverRegistry = 
    require("./../../driver/sl-driverregistry");
const MbTspCore = 
    require("./../../../core");
const MbError = 
    require("./../../../../../error");
const XRTLibAsync = 
    require("xrtlibrary-async");
const XRTLibBugHandler = 
    require("xrtlibrary-bughandler");
const XRTLibTraverse = 
    require("xrtlibrary-traverse");
const Util = 
    require("util");

//  Imported classes.
const MBAsciiFrame = 
    MbTspSlAsciiFrame.MBAsciiFrame;
const MBAsciiTransceiver = 
    MbTspSlAsciiTransceiver.MBAsciiTransceiver;
const MBSerialPortOption = 
    MbTspSlDriverCore.MBSerialPortOption;
const MBSerialPortDriverRegistry = 
    MbTspSlDriverRegistry.MBSerialPortDriverRegistry;
const MBGenericSerialPortDriver = 
    MbTspSlDriverGeneric.MBGenericSerialPortDriver;
const MBTransportQuery = 
    MbTspCore.MBTransportQuery;
const MBTransportAnswer = 
    MbTspCore.MBTransportAnswer;
const IMBMasterTransport = 
    MbTspCore.IMBMasterTransport;
const IMBMasterTransportFactory = 
    MbTspCore.IMBMasterTransportFactory;
const MBError = 
    MbError.MBError;
const MBBugError = 
    MbError.MBBugError;
const MBDeviceError = 
    MbError.MBDeviceError;
const MBConfigurationError = 
    MbError.MBConfigurationError;
const MBOperationCancelledError = 
    MbError.MBOperationCancelledError;
const MBInvalidOperationError = 
    MbError.MBInvalidOperationError;
const MBCommunicationError = 
    MbError.MBCommunicationError;
const ConditionalSynchronizer = 
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer;
const SemaphoreSynchronizer = 
    XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer;

//  Imported functions.
const ReportBug = 
    XRTLibBugHandler.ReportBug;
const CreatePreemptivePromise = 
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise;

//  Imported constants.
const MBSL_DATABIT_7 = 
    MbTspSlDriverCore.MBSL_DATABIT_7;
const MBSL_DATABIT_8 = 
    MbTspSlDriverCore.MBSL_DATABIT_8;
const MBSL_PARITY_NONE = 
    MbTspSlDriverCore.MBSL_PARITY_NONE;
const MBSL_PARITY_ODD = 
    MbTspSlDriverCore.MBSL_PARITY_ODD;
const MBSL_PARITY_EVEN = 
    MbTspSlDriverCore.MBSL_PARITY_EVEN;
const MBSL_STOPBIT_1 = 
    MbTspSlDriverCore.MBSL_STOPBIT_1;
const MBSL_STOPBIT_2 = 
    MbTspSlDriverCore.MBSL_STOPBIT_2;

//
//  Classes.
//

/**
 *  Modbus ASCII master transport options.
 * 
 *  @constructor
 */
function MBAsciiMasterTransportOption() {
    //  Nothing.
}

/**
 *  Modbus ASCII master transport.
 * 
 *  @constructor
 *  @extends {IMBMasterTransport}
 *  @param {MBAsciiTransceiver} rxtx
 *    - The transceiver.
 *  @param {MBAsciiMasterTransportOption} [options]
 *    - The transport options.
 */
function MBAsciiMasterTransport(
    rxtx,
    options = new MBAsciiMasterTransportOption()
) {
    //  Let parent class initialize.
    IMBMasterTransport.call(this);

    //
    //  Members.
    //

    //  Single query semaphore.
    let semSingleQuery = new SemaphoreSynchronizer(1);

    //  Signals.
    let syncCmdClose = new ConditionalSynchronizer();
    let syncCmdTerminate = new ConditionalSynchronizer();
    let syncClosed = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Query the slave.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBInvalidOperationError}
     *    - Transport was already closed or is going to be closed.
     *  @throws {MBCommunicationError}
     *    - Transport-layer communication failed.
     *  @param {MBTransportQuery} query 
     *    - The query object.
     *  @param {Boolean} [noAnswer] 
     *    - True if response from the slave is needed.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<?MBTransportAnswer>}
     *    - The promise object (resolves with the answer if succeed and 
     *      answer from the slave is needed, resolves with NULL if succeed and 
     *      answer from the slave is not needed, rejects if error occurred).
     */
    this.query = async function(
        query, 
        noAnswer = false, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Acquire the single query semaphore.
        {
            //  Wait for signals.
            let cts = new ConditionalSynchronizer();
            let wh1 = semSingleQuery.wait(cts);
            let wh2 = syncCmdClose.waitWithCancellator(cts);
            let wh3 = syncCmdTerminate.waitWithCancellator(cts);
            let wh4 = cancellator.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
            cts.fullfill();

            //  Handle the signal.
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Acquired.
            } else {
                //  Wait for the wait handler 1 to be settled.
                try {
                    await wh1;
                    semSingleQuery.signal();
                } catch(error) {
                    //  Operation cancelled. Do nothing.
                }

                if (wh == wh2 || wh == wh3) {
                    throw new MBInvalidOperationError(
                        "Transport was already closed or is going to be closed."
                    );
                } else if (wh == wh4) {
                    throw new MBOperationCancelledError(
                        "The cancellator was activated."
                    );
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }
        }

        //  Get query information.
        let queryUnitID = query.getUnitID();
        let queryFnCode = query.getFunctionCode();
        let queryData = query.getData();

        //  Build query frame.
        let frameQuery = new MBAsciiFrame(
            queryUnitID, 
            queryFnCode, 
            queryData
        );

        //  Initialize answer receptor.
        let syncLocalAnswerRcvd = new ConditionalSynchronizer();
        let clrOnRcvFrameCb = false;

        /**
         *  Handle transceiver "frame" event.
         * 
         *  @param {MBAsciiFrame} _frame
         *    - The received frame.
         */
        function _OnRxTxFrame(_frame) {
            //  Filter out unrelated frames.
            if (_frame.getAddress() != queryUnitID) {
                return;
            }
            if ((_frame.getFunctionCode() & 0x7F) != (queryFnCode & 0x7F)) {
                return;
            }

            //  Mark that we received the answer.
            syncLocalAnswerRcvd.fullfill(_frame);

            //  Detach the event.
            rxtx.off("frame", _OnRxTxFrame);
            clrOnRcvFrameCb = false;
        }

        try {
            //  Bind the answer receptor.
            if (!noAnswer) {
                rxtx.on("frame", _OnRxTxFrame);
                clrOnRcvFrameCb = true;
            }

            //  Transmit the query frame.
            {
                let cts = new ConditionalSynchronizer();
                let wh1 = rxtx.frameTransmit(frameQuery, cts);
                let wh2 = cancellator.waitWithCancellator(cts);
                let rsv = null;
                try {
                    rsv = await CreatePreemptivePromise([wh1, wh2]);
                } catch(error) {
                    if (error instanceof PreemptReject) {
                        error = error.getReason();
                    }
                    let msg = (error.message || "Unknown error.");
                    if (error instanceof MBDeviceError) {
                        throw new MBCommunicationError(msg);
                    }
                    throw error;
                } finally {
                    cts.fullfill();
                }
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Do nothing.
                } else {
                    //  Wait for the transmit wait handler to be settled.
                    try {
                        await wh1;
                    } catch(error) {
                        //  Do nothing.
                    }

                    if (wh == wh2) {
                        throw new MBOperationCancelledError(
                            "The cancellator was activated."
                        );
                    } else {
                        ReportBug("Invalid wait handler.", true, MBBugError);
                    }
                }
            }

            //  Return if no answer is needed.
            if (noAnswer) {
                return null;
            }

            //  Receive the answer frame.
            /**
             *  @type {?MBAsciiFrame}
             */
            let frameAnswer = null;
            {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = syncLocalAnswerRcvd.waitWithCancellator(cts);
                let wh2 = syncCmdClose.waitWithCancellator(cts);
                let wh3 = syncCmdTerminate.waitWithCancellator(cts);
                let wh4 = cancellator.waitWithCancellator(cts);
                let rsv = await CreatePreemptivePromise([wh1, wh2, wh3, wh4]);
                cts.fullfill();

                //  Handle the signal.
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    frameAnswer = rsv.getValue();
                } else if (wh == wh2 || wh == wh3) {
                    throw new MBInvalidOperationError(
                        "Transport is going to be closed or was already closed."
                    );
                } else if (wh == wh4) {
                    throw new MBOperationCancelledError(
                        "The cancellator was activated."
                    );
                } else {
                    ReportBug("Invalid wait handler.", true, MBBugError);
                }
            }

            //  Unbind the answer receptor.
            rxtx.off("frame", _OnRxTxFrame);
            clrOnRcvFrameCb = false;

            //  Build the answer object.
            return new MBTransportAnswer(
                frameAnswer.getFunctionCode(),
                frameAnswer.getData()
            );
        } finally {
            if (clrOnRcvFrameCb) {
                rxtx.off("frame", _OnRxTxFrame);
                clrOnRcvFrameCb = false;
            }

            //  Release the single query semaphore.
            semSingleQuery.signal();
        }
    };

    /**
     *  Wait for the transport to be closed.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @return {Promise<void>}
     *    - The promise object (resolves if succeed, rejects if error occurred). 
     */
    this.wait = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        try {
            await syncClosed.waitWithCancellator(cancellator);
        } catch(error) {
            let msg = (error.message || "Unknown error.");
            if (
                error instanceof ConditionalSynchronizer.OperationCancelledError
            ) {
                throw new MBOperationCancelledError(msg);
            }
            throw new MBError(msg);
        }
    };

    /**
     *  Get whether the transport was closed.
     * 
     *  @returns {Boolean}
     *    - True if so.
     */
    this.isClosed = function() {
        return syncClosed.isFullfilled();
    };

    /**
     *  Close the transport.
     * 
     *  @param {Boolean} [forcibly] 
     *    - True if the transport shall be closed forcibly.
     */
    this.close = function(
        forcibly = false
    ) {
        if (syncClosed.isFullfilled()) {
            throw new MBInvalidOperationError("Transport was already closed.");
        }
        if (forcibly) {
            syncCmdTerminate.fullfill();
        } else {
            syncCmdClose.fullfill();
        }
    };

    //
    //  Coroutine(s).
    //

    //  Main coroutine.
    (async function() {
        //  Wait for close signal.
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = syncCmdClose.waitWithCancellator(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                if (!rxtx.isClosed()) {
                    rxtx.close(false);
                }
            } else if (wh == wh2) {
                if (!rxtx.isClosed()) {
                    rxtx.close(true);
                    await rxtx.wait();
                }
                return;
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }

        //  Wait for terminate signal.
        {
            let cts = new ConditionalSynchronizer();
            let wh1 = rxtx.wait(cts);
            let wh2 = syncCmdTerminate.waitWithCancellator(cts);
            let rsv = await CreatePreemptivePromise([wh1, wh2]);
            cts.fullfill();
            let wh = rsv.getPromiseObject();
            if (wh == wh1) {
                //  Do nothing.
            } else if (wh == wh2) {
                if (!rxtx.isClosed()) {
                    rxtx.close(true);
                    await rxtx.wait();
                }
            } else {
                ReportBug("Invalid wait handler.", true, MBBugError);
            }
        }
    })().catch(function(error) {
        ReportBug(Util.format(
            "Main coroutine throw an exception (error=\"%s\").",
            error.message || "Unknown error."
        ), false, MBBugError);
    }).finally(function() {
        //  Set the closed signal.
        syncClosed.fullfill();

        //  Clean up.
        if (!rxtx.isClosed()) {
            rxtx.close(true);
        }
    });
}

/**
 *  Modbus ASCII master transport factory.
 * 
 *  @constructor
 *  @extends {IMBMasterTransportFactory}
 */
function MBAsciiMasterTransportFactory() {
    //  Let parent class initialize.
    IMBMasterTransportFactory.call(this);
    //
    //  Public methods.
    //    

    /**
     *  Get the name of the transport.
     * 
     *  @returns {String}
     *    - The name.
     */
    this.getName = function() {
        return "serial/ascii";
    };

    /**
     *  Create a transport instance.
     * 
     *  @throws {MBOperationCancelledError}
     *    - The cancellator was activated.
     *  @throws {MBConfigurationError}
     *    - Bad transport configuration.
     *  @throws {MBCommunicationError}
     *    - Communication error.
     *  @param {Object} configdict 
     *    - The transport configuration dictionary.
     *  @param {ConditionalSynchronizer} [cancellator]
     *    - The cancellator.
     *  @returns {Promise<IMBMasterTransport>}
     *    - The promise object (resolves with the transport object if succeed, 
     *      rejects if error occurred).
     */
    this.create = async function(
        configdict, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //
        //  Stage 1: Read/parse the configuration dictionary.
        //
        let portPath = null;
        let portDriver = null;
        let portOptions = null;
        try {
            //  Wrap the configuration.
            let root = XRTLibTraverse.WrapObject(configdict, false)
                                     .notNull()
                                     .typeOf(Object);

            //  Read device settings.
            let devRoot = root.sub("device")
                              .notNull()
                              .typeOf(Object);
            let devDriverName = devRoot.optionalSub(
                "driver", 
                MBGenericSerialPortDriver.DRIVER_NAME
            ).string().unwrap();
            portPath = devRoot.sub("path")
                              .notNull()
                              .string()
                              .unwrap();
            let devBaudrate = devRoot.sub("baudrate")
                                     .notNull()
                                     .integer()
                                     .min(1)
                                     .unwrap();
            let devDataBits = devRoot.optionalSub("data-bits", MBSL_DATABIT_7)
                                     .integer()
                                     .oneOf([MBSL_DATABIT_7, MBSL_DATABIT_8])
                                     .unwrap();
            let devParity = devRoot.optionalSub(
                "parity", 
                "even"
            ).selectFromObject({
                "none": MBSL_PARITY_NONE,
                "even": MBSL_PARITY_EVEN,
                "odd": MBSL_PARITY_ODD
            }).unwrap();
            let devStopBits = devRoot.optionalSub("stop-bits", MBSL_STOPBIT_1)
                                     .integer()
                                     .oneOf([MBSL_STOPBIT_1, MBSL_STOPBIT_2])
                                     .unwrap();

            //  Build serial port options.
            portOptions = new MBSerialPortOption(
                devBaudrate, 
                devDataBits, 
                devStopBits, 
                devParity
            );

            //  Find the driver.
            portDriver = MBSerialPortDriverRegistry.GetGlobal()
                                                   .getDriver(devDriverName);
            if (portDriver === null) {
                throw new MBConfigurationError(Util.format(
                    "No such driver (name=\"%s\").",
                    devDriverName
                ));
            }
        } catch(error) {
            // if (error instanceof MBConfigurationError) {
            //     throw error;
            // }
            throw new MBConfigurationError(error.message || "Unknown error.");
        }

        //
        //  Open serial port.
        //
        let port = null;
        try {
            port = await portDriver.open(portPath, portOptions);
        } catch(error) {
            throw new MBCommunicationError(Util.format(
                "Failed to open device (error=\"%s\").",
                error.message || "Unknown error."
            ))
        }

        //  Create the master transport.
        return new MBAsciiMasterTransport(
            new MBAsciiTransceiver(port),
            new MBAsciiMasterTransportOption()
        );
    };
}

//
//  Inheritances.
//
Util.inherits(MBAsciiMasterTransport, IMBMasterTransport);
Util.inherits(MBAsciiMasterTransportFactory, IMBMasterTransportFactory);

//  Export public APIs.
module.exports = {
    "MBAsciiMasterTransport": MBAsciiMasterTransport,
    "MBAsciiMasterTransportFactory": MBAsciiMasterTransportFactory
};