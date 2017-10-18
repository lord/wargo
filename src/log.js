"use strict"

const chalk = require('chalk')

module.exports = function(...args) {
  args.unshift(chalk.green.bold('  Setup wasm'))
  console.warn(...args)
}