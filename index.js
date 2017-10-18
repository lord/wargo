#!/usr/bin/env node

let args = process.argv.slice(2)
require('./src/cmd.js')(args)
