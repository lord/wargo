#!/usr/bin/env node
'use strict'
const getos = require('getos')
const log = require('./src/log')

process.on('unhandledRejection', (error) => {
  console.warn('unhandledRejection:', error.message)
  process.exit(1)
})

getos((e, os) => {
  if (e) {
    log('warning: os identification error: ', e)
    process.detailedos = {os: 'linux'}
  } else {
    process.detailedos = os
  }
  let args = process.argv.slice(2)
  require('./src/cmd.js')(args)
})
