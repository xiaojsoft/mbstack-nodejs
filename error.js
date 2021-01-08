//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const Util = require("util");

//
//  Classes.
//

/**
 *  MB error.
 * 
 *  @constructor
 *  @extends {Error}
 *  @param {String} [message]
 *      - The message.
 */
function MBError(message = "") {
    //  Let parent class initialize.
    Error.call(this, message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

/**
 *  MB bug error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBBugError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB type error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBTypeError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB parameter error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBParameterError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB invalid operation error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBInvalidOperationError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB operation cancelled error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBOperationCancelledError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB configuration error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBConfigurationError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB parse error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBParseError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB communication error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBCommunicationError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB communication end of stream error.
 * 
 *  @constructor
 *  @extends {MBCommunicationError}
 *  @param {String} [message]
 *      - The message.
 */
function MBCommunicationEndOfStreamError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB invalid frame error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBInvalidFrameError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB invalid node error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBInvalidNodeError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB invalid data address error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBInvalidDataAddressError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB invalid data value error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBInvalidDataValueError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB protocol service existed error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBProtocolServiceExistedError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB protocol service not exist error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBProtocolServiceNotExistError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB transport existed error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBTransportExistedError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB transport not exist error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBTransportNotExistError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB initiate error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBInitiateError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB peer error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBPeerError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

/**
 *  MB timeout error.
 * 
 *  @constructor
 *  @extends {MBError}
 *  @param {String} [message]
 *      - The message.
 */
function MBTimeoutError(message = "") {
    //  Let parent class initialize.
    MBError.call(this, message);
}

//
//  Inheritances.
//
Util.inherits(MBError, Error);
Util.inherits(MBBugError, MBError);
Util.inherits(MBTypeError, MBError);
Util.inherits(MBParameterError, MBError);
Util.inherits(MBInvalidOperationError, MBError);
Util.inherits(MBOperationCancelledError, MBError);
Util.inherits(MBConfigurationError, MBError);
Util.inherits(MBParseError, MBError);
Util.inherits(MBCommunicationError, MBError);
Util.inherits(MBCommunicationEndOfStreamError, MBCommunicationError);
Util.inherits(MBInvalidFrameError, MBError);
Util.inherits(MBInvalidNodeError, MBError);
Util.inherits(MBInvalidDataAddressError, MBError);
Util.inherits(MBInvalidDataValueError, MBError);
Util.inherits(MBProtocolServiceExistedError, MBError);
Util.inherits(MBProtocolServiceNotExistError, MBError);
Util.inherits(MBTransportExistedError, MBError);
Util.inherits(MBTransportNotExistError, MBError);
Util.inherits(MBInitiateError, MBError);
Util.inherits(MBPeerError, MBError);
Util.inherits(MBTimeoutError, MBError);

//  Export public APIs.
module.exports = {
    "MBError": MBError,
    "MBBugError": MBBugError,
    "MBTypeError": MBTypeError,
    "MBParameterError": MBParameterError,
    "MBInvalidOperationError": MBInvalidOperationError,
    "MBOperationCancelledError": MBOperationCancelledError,
    "MBConfigurationError": MBConfigurationError,
    "MBParseError": MBParseError,
    "MBCommunicationError": MBCommunicationError,
    "MBCommunicationEndOfStreamError": MBCommunicationEndOfStreamError,
    "MBInvalidFrameError": MBInvalidFrameError,
    "MBInvalidNodeError": MBInvalidNodeError,
    "MBInvalidDataAddressError": MBInvalidDataAddressError,
    "MBInvalidDataValueError": MBInvalidDataValueError,
    "MBProtocolServiceExistedError": MBProtocolServiceExistedError,
    "MBProtocolServiceNotExistError": MBProtocolServiceNotExistError,
    "MBTransportExistedError": MBTransportExistedError,
    "MBTransportNotExistError": MBTransportNotExistError,
    "MBInitiateError": MBInitiateError,
    "MBPeerError": MBPeerError,
    "MBTimeoutError": MBTimeoutError
};