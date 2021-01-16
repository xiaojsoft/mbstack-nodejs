//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Constants.
//

//  Maximum length of the data field of the PDU.
const MAX_PDU_DATA_LENGTH = 252;

//  Maximum PDU length.
const MAX_PDU_LENGTH = MAX_PDU_DATA_LENGTH + 1;

//  Export public APIs.
module.exports = {
    "MAX_PDU_DATA_LENGTH": MAX_PDU_DATA_LENGTH,
    "MAX_PDU_LENGTH": MAX_PDU_LENGTH
};