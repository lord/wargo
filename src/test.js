const child_process = require('child_process')
const log = require('./log')

function check(client) {
  return client
    .execute(function() {
      var res = [window.runtimeExited, window.EXITSTATUS, window.TEST_LOGS];
      window.TEST_LOGS=[];
      return res;
    })
    .then((res) => {
      let val = res.value
      if (Array.isArray(val[2])) {
        val[2].forEach((log) => {
          console.warn(log)
        })
        if (val[0]) {
          process.exit(val[1])
        }
      } else {
        log('invalid response from window')
      }
      return check(client)
    })
}

module.exports = function(filename) {
  log('running tests...')

  let child = child_process.exec(`node testserver.js ${filename}`, {cwd: __dirname}, function(err) {
    if (err) {
      console.warn(err)
      process.exit(1)
    }
  })
  process.on('exit', function() {
    child.kill();
  })

  var client = require('webdriverio').remote({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    host: process.env.WEBDRIVER_HOST || 'localhost',
    port: process.env.WEBDRIVER_PORT || 4445,
    desiredCapabilities: JSON.parse(process.env.WEBDRIVER_CAPABILITIES || "{}")
  })

  client
    .on('error', function(e) {
      console.log('webdriver error:', e)
    })
    .on('end', function(e) {
      console.log('webdriver end:', e)
    })
    .init()
    .url('http://localhost:9182')
    .then(() => {
      return check(client)
    })
    .end()
}
