"use strict"

const log = require('./log')
const child_process = require('child_process')
const chalk = require('chalk')
const path = require('path')

const CHECK = chalk.green.bold('✔')
const CROSS = chalk.red.bold('✘')
const EMSDK_URL = "https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz"

const LINUX_SCRIPT = `
mkdir ~/.emccinstall
cd ~/.emccinstall &&
curl -L -o emscripten.tgz https://github.com/koute/emscripten-build/releases/download/emscripten-1.37.21-1-x86_64-unknown-linux-gnu/emscripten-1.37.21-1-x86_64-unknown-linux-gnu.tgz &&
tar -xf emscripten.tgz
`

function checkInstall(cmd) {
  try {
    child_process.execSync(cmd, {stdio: 'pipe', env: process.env})
  } catch (e) {
    return false
  }

  return true
}

function getEnv() {
  if (checkInstall('test -e ~/.emsdk/emsdk_env.sh')) {
    var cmd = 'cd ~/.emsdk && source emsdk_env.sh > /dev/null 2> /dev/null && node -pe "JSON.stringify(process.env)"';
    let res = child_process.execSync(cmd, {env: process.env, stdio: 'pipe', shell: '/bin/bash'})
    process.env = JSON.parse(res.toString())
  }
}

module.exports = function() {
  if (checkInstall('emcc --help')) {
    log('using emcc already in $PATH')
    return
  }

  log('checking dependencies...')
  let checks

  if (process.platform === "darwin") {
    checks = [
      ['brew --version', 'brew', 'brew not found. Try installing at https://brew.sh and rerunning?'],
      ['rustup --version', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
      ['cmake --version', 'cmake', 'cmake not found. Try installing with `brew install cmake` and rerunning?'],
      ['python --version', 'python', 'python not found. Try installing with `brew install python` and rerunning?'],
      ['curl --version', 'curl', 'curl not found. Try installing with `brew install curl` and rerunning?'],
    ]
  } else {
    checks = [
      ['rustup target add wasm32-unknown-emscripten', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
      ['cmake --version', 'cmake', 'cmake not found. Try installing with `sudo apt-get install cmake` and rerunning?'],
      ['python --version', 'python', 'python not found. Try installing with `sudo apt-get install python` and rerunning?'],
      ['curl --version', 'curl', 'curl not found. Try installing with `sudo apt-get install curl` and rerunning?'],
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

  if (process.platform === "darwin") {
    if (checkInstall('test -x ~/.emsdk/emsdk')) {
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
      if (!checkInstall('test -x ~/.emsdk/emsdk')) {
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
  } else {
    if (!checkInstall('test -x ~/.emccinstall/emscripten/emcc')) {
      log('installing emcc...')
      child_process.execSync(LINUX_SCRIPT, {env: process.env, stdio: 'inherit'})
    }
    let epath = path.join(process.env.HOME, '.emccinstall', 'emscripten')
    let epathFastcomp = path.join(process.env.HOME, '.emccinstall', 'emscripten-fastcomp')

    process.env.PATH = [process.env.PATH, epath, epathFastcomp].join(':')
    process.env.EMSCRIPTEN = epath
    process.env.EMSCRIPTEN_FASTCOMP = epathFastcomp
    process.env.LLVM = epathFastcomp
    if (!checkInstall('test -x ~/.emccinstall/emscripten/emcc')) {
      log('couldn\'t install emcc. file a bug at https://github.com/lord/wargo?')
    }
  }
}