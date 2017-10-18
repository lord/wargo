"use strict"

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

function getEnv() {
  if (checkInstall('test -e ~/.emsdk/emsdk_env.sh')) {
    var cmd = 'cd ~/.emsdk && source emsdk_env.sh > /dev/null 2> /dev/null && node -pe "JSON.stringify(process.env)"';
    let res = child_process.execSync(cmd, {env: process.env, stdio: 'pipe'})
    process.env = JSON.parse(res.toString())
  }
}

module.exports = function() {
  if (checkInstall('emcc --help')) {
    log('using emcc already in $PATH')
    return
  }

  log('checking dependencies...')
  let checks = [
    ['rustup target add wasm32-unknown-emscripten', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
    ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
    ['gcc --version', 'gcc', 'gcc not found. Try installing with `sudo apt-get install build-essential` and rerunning?'],
    ['python --version', 'python', 'python not found. Try installing with `sudo apt-get install python` and rerunning?'],
  ]

  if (process.platform === "darwin") {
    checks = [
      ['brew --version', 'brew', 'brew not found. Try installing at https://brew.sh and rerunning?'],
      ['rustup --version', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
      ['cmake --version', 'cmake', 'cmake not found. Try installing with `brew install cmake` and rerunning?'],
      ['python --version', 'python', 'python not found. Try installing with `brew install python` and rerunning?'],
    ]
  }

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

  if (checkInstall('[[ -x ~/.emsdk/emsdk ]]')) {
    log('found emsdk installation in ~/.emsdk')
    log('setting environment...')
    getEnv()
    if (checkInstall('emcc --help')) {
      return
    } else {
      log('couldn\'t find emcc')
    }
  } else {
    log('emsdk not found, installing to ~/.emsdk...')
    child_process.execSync(`mkdir ~/.emsdk && cd ~/.emsdk && curl ${EMSDK_URL} | tar --strip-components=1 -zxvf -`, {stdio: 'pipe', env: process.env})
    if (!checkInstall('[[ -x ~/.emsdk/emsdk ]]')) {
      log('installation failed! file a bug at https://github.com/lord/wargo?')
      process.exit(1)
    }
  }

  log('installing emcc...')
  child_process.execSync(`cd ~/.emsdk && ./emsdk install sdk-1.37.22-64bit`, {env: process.env, stdio: [null, 1, 2]})
  child_process.execSync(`cd ~/.emsdk && ./emsdk activate sdk-1.37.22-64bit`, {env: process.env, stdio: [null, 1, 2]})
  getEnv()
  if (checkInstall('emcc --help')) {
    return
  } else {
    log('couldn\'t install emcc. file a bug at https://github.com/lord/wargo?')
  }
}