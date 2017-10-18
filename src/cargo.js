const child_process = require('child_process')
const log = require('./log')

const FIXLLVM = `
  brew install llvm;
  NEWLLVM="$(brew ls llvm | grep llvm-ar\$)"
  OLDLLVM="$(which llvm-ar)"
  mv $OLDLLVM $OLDLLVM.old &&
  ln -s $NEWLLVM $OLDLLVM
`

module.exports = function(args) {
  let cmd = 'cargo ' + args.join(' ')
  log(`running '${cmd}'`)
  try {
    let res = child_process.execSync(cmd, {env: process.env})
  } catch (e) {
    if (e.stderr.toString().indexOf('dyld: Symbol not found: _futimens') >= 0) {
      log('mac linker error detected, see https://github.com/kripken/emscripten/issues/5418')
      log('performing fix...')
      child_process.execSync(FIXLLVM, {stdio: [null, process.stdout, process.stderr], env: process.env})
      log('rerunning cargo command...')
      module.exports(args)
    }
    process.exit(e.status)
  }
}