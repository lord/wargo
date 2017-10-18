#!/usr/bin/env node
"use strict"

let args = process.argv.slice(2)
require('./src/cmd.js')(args)
