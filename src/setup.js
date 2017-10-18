const log = require('./log')
const child_process = require('child_process')
const chalk = require('chalk')

const CHECK = chalk.green.bold('✔')
const CROSS = chalk.red.bold('✘')
const EMSDK_URL = "https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz"

function checkInstall(cmd) {
  try {
    child_process.execSync(cmd, {stdio: 'pipe', env: process.env})
  } catch (e) {
    return false
  }

  return child_process
}

module.exports = function() {
  log('checking dependencies...')
  let checks = [
    ['rustup --version', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
    ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
    ['cmake --version', 'cmake', 'cmake not found. Try installing with `brew install cmake` and rerunning?'],
    ['python --version', 'python', 'python not found. Try installing with `brew install python` and rerunning?'],
  ]

  let didErr = false
  checks.forEach(([cmd, name, errMsg]) => {
    if (checkInstall(cmd)) {
      log('   ', CHECK, name)
    } else {
      log('   ', CROSS, name)
      log('     ', chalk.red(errMsg))
      didErr = true
    }
  })

  if (didErr) {
    log('some dependencies were missing.')
    process.exit(1)
  }
}