"use strict"

const log = require('./log')
const child_process = require('child_process')
const chalk = require('chalk')
const path = require('path')

const CHECK = chalk.green.bold('✔')
const CROSS = chalk.red.bold('✘')
const EMSDK_URL = "https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz"
const EMSDK_URL_PREBUILT_TRUSTY = "https://github.com/lord/emsdk-build/releases/download/initial/emsdk-trusty.tgz"

function checkInstall(cmd, fn) {
  let res
  try {
    res = child_process.execSync(cmd, {stdio: 'pipe', env: process.env})
  } catch (e) {
    return false
  }

  if (!fn) {
    return true
  }

  return fn(res.toString())
}

function getEnv() {
  if (checkInstall('test -e ~/.emsdk/emsdk_env.sh')) {
    var cmd = 'cd ~/.emsdk && source emsdk_env.sh > /dev/null 2> /dev/null && node -pe "JSON.stringify(process.env)"';
    let res = child_process.execSync(cmd, {env: process.env, stdio: 'pipe', shell: '/bin/bash'})
    process.env = JSON.parse(res.toString())
  }
}

module.exports = function() {
  if (checkInstall('emcc --version')) {
    log('using emcc already in $PATH')
    return
  }

  log('checking dependencies...')
  let checks

  let cmakeVersionCheck = (out) => {
    let matches = out.match(new RegExp(/version (\d+)\.(\d+).(\d+)/, "m"))
    if (matches) {
      let v1 = parseInt(matches[1])
      let v2 = parseInt(matches[2])
      let v3 = parseInt(matches[3])
      if (v1>3 || (v1===3 && v2>4) || (v1===3 && v2===4 && v3>=3)) {
        return true
      }
      log(`you need cmake 3.4.3 or newer, it looks like you have ${v1}.${v2}.${v3}`)
      return false
    } else {
      log('failed to detect cmake version. make sure you have 3.4.3 or newer installed!')
      return true
    }
  }
  let pythonVersionCheck = (out) => {
    let matches = out.match(new RegExp(/Python (\d+)\.(\d+)/, "m"))
    if (matches) {
      let v1 = parseInt(matches[1])
      let v2 = parseInt(matches[2])
      if (v1>=3) {
        log(`looks like your python is Python 3, unfortunately emsdk expects Python 2`)
        return false
      }
    } else {
      log('failed to detect python version. make sure python points to python 2')
    }
    return true
  }

  if (process.platform === "darwin") {
    checks = [
      ['brew --version', 'brew', 'brew not found. Try installing at https://brew.sh and rerunning?'],
      ['rustup --version', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
      ['cmake --version', 'cmake', 'cmake 3.4.3 or newer not found. Try installing with `brew install cmake` and rerunning?', cmakeVersionCheck],
      ['python --version 2>&1', 'python', 'python not found. Try installing with `brew install python` and rerunning?', pythonVersionCheck],
      ['curl --version', 'curl', 'curl not found. Try installing with `brew install curl` and rerunning?'],
      ['git --version', 'git', 'git not found. Try installing with `brew install git` and rerunning?'],
    ]
  } else {
    checks = [
      ['rustup target add wasm32-unknown-emscripten', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
      ['cmake --version', 'cmake', 'cmake 3.4.3 or newer not found. Try installing with `sudo apt-get install cmake` and rerunning?', cmakeVersionCheck],
      ['python --version 2>&1', 'python', 'python not found. Try installing with `sudo apt-get install python` and rerunning?', pythonVersionCheck],
      ['curl --version', 'curl', 'curl not found. Try installing with `sudo apt-get install curl` and rerunning?'],
      ['git --version', 'git', 'git not found. Try installing with `sudo apt-get install git` and rerunning?'],
    ]
  }

  let didErr = false
  checks.forEach(([cmd, name, errMsg, fn=null]) => {
    if (!checkInstall(cmd, fn)) {
      log('   ', CROSS, name)
      log('     ', chalk.red(errMsg))
      didErr = true
    }
  })

  if (didErr) {
    log('some dependencies were missing.')
    process.exit(1)
  }

  if (checkInstall('test -x ~/.emsdk/emsdk')) {
    log('found emsdk installation in ~/.emsdk')
  } else {
    log('emsdk not found, installing to ~/.emsdk...')
    if (process.detailedos.codename === "trusty") {
      child_process.execSync(`mkdir ~/.emsdk && cd ~/.emsdk && curl -L ${EMSDK_URL_PREBUILT_TRUSTY} | tar --strip-components=1 -zxf -`, {stdio: 'inherit', env: process.env})
      child_process.execSync(`cd ~/.emsdk && ./emsdk activate --build=Release sdk-tag-1.37.22-64bit`, {env: process.env, stdio: 'inherit'})
    } else {
      child_process.execSync(`mkdir ~/.emsdk && cd ~/.emsdk && curl -L ${EMSDK_URL} | tar --strip-components=1 -zxvf -`, {stdio: 'inherit', env: process.env})
    }
    if (!checkInstall('test -x ~/.emsdk/emsdk')) {
      log('installation failed! file a bug at https://github.com/lord/wargo?')
      process.exit(1)
    }
  }

  log('setting environment...')
  getEnv()
  if (checkInstall('emcc --version')) {
    return
  }

  log('installing emcc...')
  child_process.execSync(`cd ~/.emsdk && ./emsdk install sdk-1.37.22-64bit`, {env: process.env, stdio: [null, 1, 2]})
  child_process.execSync(`cd ~/.emsdk && ./emsdk activate sdk-1.37.22-64bit`, {env: process.env, stdio: [null, 1, 2]})
  getEnv()
  if (checkInstall('emcc --version')) {
    return
  } else {
    log('couldn\'t install emcc. file a bug at https://github.com/lord/wargo?')
  }
}