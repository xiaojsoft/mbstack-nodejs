//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This module defines serial line diagnostic counters listed in 
//        the table of section 6.1.1 of the specification.
//

//  Counter numbers.
const CNTRNO_BUSMESSAGE  = 1;  //  Bus Message Count.
const CNTRNO_BUSCOMERROR = 2;  //  Bus Communication Error Count.
const CNTRNO_SLVEXCERROR = 3;  //  Slave Exception Error Count.
const CNTRNO_SLVMESSAGE  = 4;  //  Slave Message Count.
const CNTRNO_SLVNORESP   = 5;  //  Slave No Response Count.
const CNTRNO_SLVNAK      = 6;  //  Slave NAK Count.
const CNTRNO_SLVBUSY     = 7;  //  Slave Busy Count.
const CNTRNO_BUSCHROVR   = 8;  //  Bus Character Overrun Count.

//  Counter sub-function code.
const CNTRSUBFN_BUSMESSAGE  = 0x0B;  //  Bus Message Count.
const CNTRSUBFN_BUSCOMERROR = 0x0C;  //  Bus Communication Error Count.
const CNTRSUBFN_SLVEXCERROR = 0x0D;  //  Slave Exception Error Count.
const CNTRSUBFN_SLVMESSAGE  = 0x0E;  //  Slave Message Count.
const CNTRSUBFN_SLVNORESP   = 0x0F;  //  Slave No Response Count.
const CNTRSUBFN_SLVNAK      = 0x10;  //  Slave NAK Count.
const CNTRSUBFN_SLVBUSY     = 0x11;  //  Slave Busy Count.
const CNTRSUBFN_BUSCHROVR   = 0x12;  //  Bus Character Overrun Count.

//  Export public APIs.
module.exports = {
    "CNTRNO_BUSMESSAGE": CNTRNO_BUSMESSAGE,
    "CNTRNO_BUSCOMERROR": CNTRNO_BUSCOMERROR,
    "CNTRNO_SLVEXCERROR": CNTRNO_SLVEXCERROR,
    "CNTRNO_SLVMESSAGE": CNTRNO_SLVMESSAGE,
    "CNTRNO_SLVNORESP": CNTRNO_SLVNORESP,
    "CNTRNO_SLVNAK": CNTRNO_SLVNAK,
    "CNTRNO_SLVBUSY": CNTRNO_SLVBUSY,
    "CNTRNO_BUSCHROVR": CNTRNO_BUSCHROVR,
    "CNTRSUBFN_BUSMESSAGE": CNTRSUBFN_BUSMESSAGE,
    "CNTRSUBFN_BUSCOMERROR": CNTRSUBFN_BUSCOMERROR,
    "CNTRSUBFN_SLVEXCERROR": CNTRSUBFN_SLVEXCERROR,
    "CNTRSUBFN_SLVMESSAGE": CNTRSUBFN_SLVMESSAGE,
    "CNTRSUBFN_SLVNORESP": CNTRSUBFN_SLVNORESP,
    "CNTRSUBFN_SLVNAK": CNTRSUBFN_SLVNAK,
    "CNTRSUBFN_SLVBUSY": CNTRSUBFN_SLVBUSY,
    "CNTRSUBFN_BUSCHROVR": CNTRSUBFN_BUSCHROVR
};