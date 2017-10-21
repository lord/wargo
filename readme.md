<p align="center">
  <img src="https://raw.githubusercontent.com/lord/img/master/logo-wargo.png" alt="wargo: Easy Rust to Webassembly" width="226">
  <br>
  <a href="https://travis-ci.org/lord/wargo"><img src="https://travis-ci.org/lord/wargo.svg?branch=master" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/wargo"><img src="https://img.shields.io/npm/v/wargo.svg" alt="NPM Version"></a>
</p>

`wargo` makes it easy to compile Rust into WebAssembly on macOS or Linux. To install:

    npm install -g wargo

To use, just `wargo build` instead of `cargo build`. We'll automatically make sure the Emscripten compiler is installed and configured before each run.

    cargo new --bin meow
    cd meow
    wargo build

Want to run your tests in the browser? No problem — we've got `wargo test`. Just run Selenium locally, set some environment variables, and you're ready to go.

    export WEBDRIVER_HOST="localhost"
    export WEBDRIVER_PORT="5555"
    wargo test

Don't want to install Selenium? `wargo` can also run tests using [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy).

    export SAUCE_USERNAME="your username"
    export SAUCE_ACCESS_KEY="blah-1234-1234-1234"
    export WEBDRIVER_CAPABILITIES='{"browserName": "chrome"}'
    wargo test

For more information, check out [the tutorial blog post](https://lord.io/blog/2017/wargo).