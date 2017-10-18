const chalk = require('chalk')

module.exports = function(...args) {
  args.unshift(chalk.green.bold('       wargo'))
  console.warn(...args)
}