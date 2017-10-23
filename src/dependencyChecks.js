"use strict"

const cmakeVersionCheck = (out) => {
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

const pythonVersionCheck = (out) => {
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

const getChecksWithCommands = (command) => [
      ['cmake --version', 'cmake', `cmake 3.4.3 or newer not found. Try installing with '${command} cmake' and rerunning?`, cmakeVersionCheck],
      ['python --version 2>&1', 'python', `python not found. Try installing with '${command} python' and rerunning?`, pythonVersionCheck],
      ['curl --version', 'curl', `curl not found. Try installing with '${command} curl' and rerunning?`],
      ['git --version', 'git', `git not found. Try installing with '${command} git' and rerunning?`],
  ]

function getChecksForDistro(os, distro) {
  const distroChecks = {
    darwin: [
      [
        "brew --version",
        "brew",
        "brew not found. Try installing at https://brew.sh and rerunning?"
      ],
      [
        "rustup target add wasm32-unknown-emscripten",
        "rustup",
        "rustup not found. Try installing at https://rustup.rs and rerunning?"
      ],
      [
        "cargo --version",
        "cargo",
        "cargo not found. Try installing at https://rustup.rs and rerunning?"
      ]
    ].concat(getChecksWithCommands("brew install")),
    fedora: [
      ['rustup target add wasm32-unknown-emscripten', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
    ].concat(getChecksWithCommands('sudo dnf install')),
    ubuntu: [
      ['rustup target add wasm32-unknown-emscripten', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
    ].concat(getChecksWithCommands('sudo apt-get')),
    default: [
      ['rustup target add wasm32-unknown-emscripten', 'rustup', 'rustup not found. Try installing at https://rustup.rs and rerunning?'],
      ['cargo --version', 'cargo', 'cargo not found. Try installing at https://rustup.rs and rerunning?'],
      ['cmake --version', 'cmake', 'cmake 3.4.3 or newer not found. Try installing cmake via your distributions package manager', cmakeVersionCheck],
      ['python --version 2>&1', 'python', 'python not found. Try installing python via your distributions package manager', pythonVersionCheck],
      ['curl --version', 'curl', 'curl not found. Try installing curl via your distributions package manager'],
      ['git --version', 'git', 'git not found. Try installing git via your distributions package manager'],
    ]
  };
  const lowerKeyOs = os.toLowerCase();
  if (lowerKeyOs === "darwin") {
    return distroChecks.darwin;
  } else if (distro) {
    const lowerKeyDistro = distro.toLowerCase();
    const distroKey = Object.keys(distroChecks).find(key =>
      key.includes(lowerKeyDistro)
    );
    if (!distroKey) {
      return distroChecks.default;
    } else {
      return distroChecks[distroKey];
    }
  } else {
    return distroChecks.default;
  }
}

module.exports = { getChecksForDistro };
