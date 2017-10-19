#!/usr/bin/env node
"use strict"
const getos = require('getos')

process.on('unhandledRejection', (error) => {
  console.warn('unhandledRejection:', error.message)
  process.exit(1)
})

getos((e, os) => {
  if(e) return console.error(e)
  process.detailedos = os
  let args = process.argv.slice(2)
  require('./src/cmd.js')(args)
})
