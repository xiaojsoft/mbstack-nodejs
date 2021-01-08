#!/bin/sh
#
#  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
#  Use of this source code is governed by a BSD-style license that can be
#  found in the LICENSE.md file.
#

#  Go to the script directory.
VPN_SCRIPTREALPATH="`realpath \"$0\"`"
cd "`dirname \"${VPN_SCRIPTREALPATH}\"`"

#  Go to project root directory.
cd ".."

#  Generate the error file.
python3 scripts/ecg/generate.py MB error.template error.js

exit $?