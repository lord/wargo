'use strict'
const log = require('./log')

const cmakeVersionCheck = out => {
  let matches = out.match(new RegExp(/version (\d+)\.(\d+).(\d+)/, 'm'))
  if (matches) {
    let v1 = parseInt(matches[1])
    let v2 = parseInt(matches[2])
    let v3 = parseInt(matches[3])
    if (v1 > 3 || (v1 === 3 && v2 > 4) || (v1 === 3 && v2 === 4 && v3 >= 3)) {
      return true
    }
    log(
      `you need cmake 3.4.3 or newer, it looks like you have ${v1}.${v2}.${v3}`
    )
    return false
  } else {
    log(
      'failed to detect cmake version. make sure you have 3.4.3 or newer installed!'
    )
    return true
  }
}

const pythonVersionCheck = out => {
  let matches = out.match(new RegExp(/Python (\d+)\.(\d+)/, 'm'))
  if (matches) {
    let v1 = parseInt(matches[1])
    let v2 = parseInt(matches[2])
    if (v1 >= 3) {
      log(
        `looks like your python is Python 3, unfortunately emsdk expects Python 2`
      )
      return false
    }
  } else {
    log('failed to detect python version. make sure python points to python 2')
  }
  return true
}

const getChecksForDependenciesWithCommands = (
  dependencies,
  preDependencyCommand,
  postDependencyCommand
) => {
  const dependenciesTemplate = {
    cmake: [
      'cmake --version',
      'cmake',
      `cmake 3.4.3 or newer not found. Try installing '${preDependencyCommand} cmake ${postDependencyCommand}' and rerunning?`,
      cmakeVersionCheck
    ],
    python: [
      'python --version 2>&1',
      'python',
      `python not found. Try installing '${preDependencyCommand} python ${postDependencyCommand}' and rerunning?`,
      pythonVersionCheck
    ],
    curl: [
      'curl --version',
      'curl',
      `curl not found. Try installing '${preDependencyCommand} curl ${postDependencyCommand}' and rerunning?`
    ],
    git: [
      'git --version',
      'git',
      `git not found. Try installing '${preDependencyCommand} git ${postDependencyCommand}' and rerunning?`
    ],
    brew: [
      'brew --version',
      'brew',
      'brew not found. Try installing at https://brew.sh and rerunning?'
    ],
    rustup: [
      'rustup target add wasm32-unknown-emscripten',
      'rustup',
      'rustup not found. Try installing at https://rustup.rs and rerunning?'
    ],
    cargo: [
      'cargo --version',
      'cargo',
      'cargo not found. Try installing at https://rustup.rs and rerunning?'
    ]
  }
  return dependencies.map(dependency => dependenciesTemplate[dependency])
}

function getChecksForDistro (os, distro) {
  const distroChecks = {
    darwin: getChecksForDependenciesWithCommands(
      ['brew', 'rustup', 'cargo', 'git', 'curl', 'python', 'cmake'],
      'with brew install'
    ),
    fedora: getChecksForDependenciesWithCommands(
      ['rustup', 'cargo', 'git', 'curl', 'python', 'cmake'],
      'with sudo dnf install'
    ),
    ubuntu: getChecksForDependenciesWithCommands(
      ['rustup', 'cargo', 'git', 'curl', 'python', 'cmake'],
      'with sudo apt-get install'
    ),
    default: getChecksForDependenciesWithCommands(
      ['rustup', 'cargo', 'git', 'curl', 'python', 'cmake'],
      '',
      'via your distributions package manager'
    )
  }
  const lowerKeyOs = os.toLowerCase()
  if (lowerKeyOs === 'darwin') {
    return distroChecks.darwin
  } else if (distro) {
    const lowerKeyDistro = distro.toLowerCase()
    const distroKey = Object.keys(distroChecks).find(key =>
      key.includes(lowerKeyDistro)
    )
    if (!distroKey) {
      return distroChecks.default
    } else {
      return distroChecks[distroKey]
    }
  } else {
    return distroChecks.default
  }
}

module.exports = { getChecksForDistro }
