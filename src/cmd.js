"use strict"

const child_process = require('child_process')
const setup = require('./setup')
const cargo = require('./cargo')
const test = require('./test')
const log = require('./log')

const HELP_STR = `wargo automatically configures the emscripten compiler environment for your cargo command,
on any linux or mac os computer.

Usage:
    wargo <cargo subcommand> [<args>...]

Some special commands are:
    build   runs 'cargo build --target=wasm32... <args>'
    test    builds the test binary into WebAssembly, and then runs it using selenium
    setup   just installs emcc without building anything`

module.exports = function(argv) {
  let subcommand = argv[0]
  if (subcommand === undefined) {
      console.warn(HELP_STR)
      process.exit(0)
  }

  setup()

  // sanity checks
  child_process.execSync('emcc -v', {env: process.env, stdio: 'inherit'})

  switch (subcommand) {
    case 'setup':
      process.exit(0)
    case 'test':
      argv.push('--target=wasm32-unknown-emscripten')
      argv.push('--no-run')
      // run first with std non-json output
      cargo(argv, false, () => {
        argv.push('--message-format=json')
        // run again to get target output
        cargo(argv, true, (out) => {
          let lines = out.split('\n')
          for (let i in lines) {
            if (lines[i].trim().length > 0) {
              let dat = JSON.parse(lines[i])
              if (dat && dat.profile && dat.profile.test)
                if (dat.filenames && dat.filenames.length > 0 && dat.filenames[0].match("\.js$")) {
                  test(dat.filenames[0])
                  return
                } else {
                  child_process.execSync('find target', {env: process.env, stdio: 'inherit'})
                }
            }
          }
          log("couldn't identify test binary")
          log("output was", JSON.stringify(out))
          process.exit(1)
        })
      })
      return
    case 'build':
      argv.push('--target=wasm32-unknown-emscripten')
      cargo(argv)
      return
    default:
      cargo(argv)
      return
  }
}