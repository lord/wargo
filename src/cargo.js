const child_process = require('child_process')
const log = require('./log')

module.exports = function(args) {
  let cmd = 'cargo ' + args.join(' ')
  log(`running '${cmd}'`)
  try {
    child_process.execSync(cmd, {stdio: [null, process.stdout, process.stderr], env: process.env})
  } catch (e) {
    process.exit(e.status)
  }
}