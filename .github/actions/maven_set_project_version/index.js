const ChildProcess = require('child_process');

const possibleIncrementVersionValues = ['major', 'minor', 'patch', 'none'];
const stepInputs = getStepInputs();

const currentProjectVersion = getProjectVersion();
let newVersion = currentProjectVersion;

if (stepInputs.version != null) {
  newVersion = stepInputs.version;
}

if (stepInputs.incrementVersion != null && stepInputs.incrementVersion !== 'none') {
  newVersion = incrementVersion(newVersion, stepInputs.incrementVersion);
}

if (stepInputs.appendSnapshot) {
  newVersion = appendSnapshotSuffix(newVersion);
}

if (currentProjectVersion === newVersion) {
  console.log(`The current version is already set to "${newVersion}", nothing to do here`);
  process.exit(0);
}

assertValidVersion(newVersion);
const exitCode = runMavenCommand(['versions:set', '-DgenerateBackupPoms=false', `-DnewVersion=${newVersion}`]);
process.exit(exitCode);

/**
 * @param { string } version
 * @returns { string }
 */
function appendSnapshotSuffix(version) {
  if (/.*-b\d-SNAPSHOT$/.test(version)) {
    return version;
  }

  if (/.*-SNAPSHOT$/.test(version)) {
    if (process.env['GITHUB_REF'] !== 'refs/heads/development') {
      const runNumber = process.env['GITHUB_RUN_NUMBER'];
      if (/^\d+$/.test(runNumber)) {
        return version.replace(/-SNAPSHOT$/, `-b${runNumber}-SNAPSHOT`);
      }
    }

    return version;
  }

  return `${version}-SNAPSHOT`;
}

/**
 * @param { string } version
 * @param { 'major' | 'minor' | 'patch' } incrementType
 *
 * @return { string }
 */
function incrementVersion(version, incrementType) {
  const versionParts = version.match(/^(\d+)\.(\d+)\.(\d+)(-.*)?$/);
  if (!Array.isArray(versionParts)) {
    throw new Error(`Invalid version string "${version}"`);
  }

  let [, major, minor, patch, suffix] = versionParts;

  switch (incrementType) {
    case 'major':
      major = parseInt(major, 10) + 1;
      minor = 0;
      patch = 0;
      break;

    case 'minor':
      minor = parseInt(minor, 10) + 1;
      patch = 0;
      break;

    case 'patch':
      patch = parseInt(patch, 10) + 1;
      break;

    default:
      throw new Error(`Invalid increment_version value: "${incrementType}"`);
  }

  return `${major}.${minor}.${patch}${suffix || ''}`;
}

function getProjectVersion() {
  return runMavenCommandAndGetOutput(['help:evaluate', '-B', '-q', '-DforceStdout', '-Dexpression=project.version']);
}

/** @return { string } */
function runMavenCommandAndGetOutput(processArguments) {
  const command = 'mvn';

  const mvnProcess = ChildProcess.spawnSync(command, processArguments);
  if (mvnProcess.status !== 0) {
    throw new Error(`Failed to run ${command} with ${JSON.stringify(processArguments)}`);
  }

  return mvnProcess.stdout.toString();
}

/** @return { int } */
function runMavenCommand(processArguments) {
  const command = 'mvn';

  console.log('Running', command, processArguments);
  const mvnProcess = ChildProcess.spawnSync(command, processArguments, {stdio: 'inherit'});

  return mvnProcess.status;
}

/**
 * Check if the given version string looks like 1.2.3 and allows for -SNAPSHOT and -b123-SNAPSHOT suffixes
 *
 * @param { string } version
 */
function assertValidVersion(version) {
  const isValid = /^\d+\.\d+\.\d+(?:(?:-b\d+)?-SNAPSHOT)?$/.test(version);

  if (!isValid) {
    throw new Error(`Value for version ("${version}" given) needs to be in full SemVer notation (e.g. 1.2.3 not 1.2) and allows for "-SNAPSHOT" and "-b123-SNAPSHOT" like suffixes`);
  }
}

function getStepInputs() {
  const getInput = (key) => {
    // TODO: Use GitHub's lib for this
    return process.env[`INPUT_${key.replace(/ /g, '_').toUpperCase()}`] || '';
  };

  const inputs = {
    appendSnapshot: (getInput('append_snapshot') || 'true') === 'true',
    version: getInput('version') || undefined,
    incrementVersion: getInput('increment_version') || 'none'
  };

  if (!possibleIncrementVersionValues.includes(inputs.incrementVersion)) {
    throw new Error(`Invalid value for increment_version (must be one of ${JSON.stringify(possibleIncrementVersionValues)}): "${inputs.incrementVersion}"`);
  }

  if (inputs.version != null && inputs.incrementVersion !== 'none') {
    throw new Error('Cannot set version and increment_version at the same time');
  }

  if (inputs.version != null) {
    if (inputs.version.at(0) === 'v') {
      inputs.version = inputs.version.substring(1);
    }

    assertValidVersion(inputs.version);
  }

  return inputs;
}
