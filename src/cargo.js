'use strict'

const childProcess = require('child_process')
const log = require('./log')

const FIXLLVMMAC = `
  brew install llvm;
  NEWLLVM="$(brew ls llvm | grep llvm-ar$)"
  OLDLLVM="$(which llvm-ar)"
  mv $OLDLLVM $OLDLLVM.old &&
  ln -s $NEWLLVM $OLDLLVM
`

module.exports = function (args, captureStdOut = false, done = null, tryagain = true) {
  let cmd = 'cargo ' + args.join(' ')
  log(`running '${cmd}'`)
  let res = childProcess.exec(`${cmd} --color always`, {env: process.env, stdio: 'pipe'})
  let errBuf = ''
  let outBuf = ''
  res.stdout.on('data', (dat) => {
    outBuf += dat.toString()
    // if not capturing output to done, print
    if (!captureStdOut) {
      process.stdout.write(dat)
    }
  })
  res.stderr.on('data', (dat) => {
    errBuf += dat.toString()
    process.stderr.write(dat)
  })
  res.on('exit', (code, signal) => {
    if (code !== 0) {
      if (tryagain && errBuf.indexOf('dyld: Symbol not found: _futimens') >= 0) {
        log('mac linker error detected, see https://github.com/kripken/emscripten/issues/5418')
        log('performing fix...')
        childProcess.execSync(FIXLLVMMAC, {stdio: [null, process.stdout, process.stderr], env: process.env})
        log('rerunning cargo command...')
        module.exports(args, done, false)
        return
      } else if (errBuf.indexOf('the `wasm32-unknown-emscripten` target may not be installed') >= 0) {
        log("looks like you're missing the wasm target. sometimes this happens when using the system-installed emscripten.")
        log('to fix, either remove `emcc` from your $PATH, or run rustup target add wasm32-unknown-emscripten')
      }
      process.exit(code)
    } else if (done) {
      done(outBuf)
    }
  })
}
