'use strict'

const staticSrv = require('node-static')
const path = require('path')

let jsname = path.posix.basename(process.argv[2])
let staticdir = path.join(path.posix.dirname(process.argv[2]), 'deps')
let staticServe = new staticSrv.Server(staticdir)
require('http').createServer(function (request, response) {
  if (request.url === '/') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html')
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
    `)
  } else {
    request.addListener('end', function () {
      staticServe.serve(request, response)
    }).resume()
  }
}).listen(9182)
