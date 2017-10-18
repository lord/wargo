const static = require('node-static');
const path = require('path')
const log = require('./log')

module.exports = function(filename) {
  log('running tests...')
  let jsname = path.posix.basename(filename)
  let staticdir = path.join(path.posix.dirname(filename), 'deps')
  let staticServe = new static.Server(staticdir);
  require('http').createServer(function (request, response) {
    if (request.url === '/') {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/html');
      response.end(`
        <doctype !HTML>
        <html>
          <head>
            <script>
              var kinds = ['error', 'info', 'debug', 'warn', 'log'];
              window.TEST_LOGS = [];
              kinds.forEach(function (kind) {
                var old = console[kind];
                console[kind] = function() {
                  var args = Array.prototype.slice.call(arguments);
                  old.apply(this, args);
                  window.TEST_LOGS.push(args.join(' '));
                }
              });
            </script>
            <script src='/${jsname}'></script>
          </head>
          <body>
          </body>
        </html>
      `);
    } else {
      request.addListener('end', function () {
        staticServe.serve(request, response);
      }).resume();
    }
  }).listen(9182);
  return
  var client = require('webdriverio').remote({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    host: 'localhost',
    port: 4445,
    desiredCapabilities: {
      browserName: 'chrome'
    }
  })

  client
    .init()
    .url('http://www.meow.com')
    .getTitle().then(function(title) {
      console.log('Title was: ' + title);
    })
    .end();
}
