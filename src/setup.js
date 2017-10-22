"use strict";

const log = require("./log");
const getChecksForDistro = require("./helpers").getChecksForDistro;
const child_process = require("child_process");
const chalk = require("chalk");

const CROSS = chalk.red.bold("✘");
const EMSDK_URL =
  "https://s3.amazonaws.com/mozilla-games/emscripten/releases/emsdk-portable.tar.gz";
const EMSDK_URL_PREBUILT_TRUSTY =
  "https://github.com/lord/emsdk-build/releases/download/initial/emsdk-trusty.tgz";

function checkInstall(cmd, fn) {
  let res;
  try {
    res = child_process.execSync(cmd, { stdio: "pipe", env: process.env });
  } catch (e) {
    return false;
  }

  if (!fn) {
    return true;
  }

  return fn(res.toString());
}

function getEnv() {
  if (checkInstall("test -e ~/.emsdk/emsdk_env.sh")) {
    var cmd =
      // eslint-disable-next-line quotes
      'cd ~/.emsdk && source emsdk_env.sh > /dev/null 2> /dev/null && node -pe "JSON.stringify(process.env)"';
    let res = child_process.execSync(cmd, {
      env: process.env,
      stdio: "pipe",
      shell: "/bin/bash"
    });
    process.env = JSON.parse(res.toString());
  }
}

module.exports = function() {
  if (checkInstall("emcc --version")) {
    log("using emcc already in $PATH");
    return;
  }

  log("checking dependencies...");

  const checks = getChecksForDistro(process.detailedos.dist);

  let didErr = false;
  checks.forEach(([cmd, name, errMsg, fn = null]) => {
    if (!checkInstall(cmd, fn)) {
      log("   ", CROSS, name);
      log("     ", chalk.red(errMsg));
      didErr = true;
    }
  });

  if (didErr) {
    log("some dependencies were missing.");
    process.exit(1);
  }

  if (checkInstall("test -x ~/.emsdk/emsdk")) {
    log("found emsdk installation in ~/.emsdk");
  } else {
    log("emsdk not found, installing to ~/.emsdk...");
    if (process.detailedos.codename === "trusty") {
      child_process.execSync(
        `mkdir ~/.emsdk && cd ~/.emsdk && curl -L ${EMSDK_URL_PREBUILT_TRUSTY} | tar --strip-components=1 -zxf -`,
        { stdio: "inherit", env: process.env }
      );
      child_process.execSync(
        "cd ~/.emsdk && ./emsdk activate --build=Release sdk-tag-1.37.22-64bit",
        { env: process.env, stdio: "inherit" }
      );
    } else {
      child_process.execSync(
        `mkdir ~/.emsdk && cd ~/.emsdk && curl -L ${EMSDK_URL} | tar --strip-components=1 -zxvf -`,
        { stdio: "inherit", env: process.env }
      );
    }
    if (!checkInstall("test -x ~/.emsdk/emsdk")) {
      log("installation failed! file a bug at https://github.com/lord/wargo?");
      process.exit(1);
    }
  }

  log("setting environment...");
  getEnv();
  if (checkInstall("emcc --version")) {
    return;
  }

  log("installing emcc...");
  child_process.execSync("cd ~/.emsdk && ./emsdk install sdk-1.37.22-64bit", {
    env: process.env,
    stdio: [null, 1, 2]
  });
  child_process.execSync("cd ~/.emsdk && ./emsdk activate sdk-1.37.22-64bit", {
    env: process.env,
    stdio: [null, 1, 2]
  });
  getEnv();
  if (checkInstall("emcc --version")) {
    return;
  } else {
    log("couldn't install emcc. file a bug at https://github.com/lord/wargo?");
  }
};
