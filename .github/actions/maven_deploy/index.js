const Fs = require('fs');
const Path = require('path');
const ChildProcess = require('child_process');

// TODO: Use GitHub's lib for this
function getInput(key) {
  return process.env[`INPUT_${key.replace(/ /g, '_').toUpperCase()}`] || '';
}

const repositoryId = getInput('repository_id') || 'songoda-deployment';
const repositoryUrl = getInput('repository_url');
const repositoryUrlSnapshots = getInput('repository_url_snapshots') || repositoryUrl;

const onlyDeployPom = getInput('only_deploy_pom') === 'true';
const mavenPomFile = getInput('maven_pom_path') || './pom.xml';
const mavenOutputDir = getInput('maven_out_dir') || './target/';

if (!Fs.existsSync(mavenPomFile)) {
  throw new Error(`Pom file '${mavenPomFile}' does not exist`);
}
if (!onlyDeployPom && !Fs.existsSync(mavenOutputDir)) {
  throw new Error(`Maven output directory '${mavenOutputDir}' does not exist`);
}

// TODO: Do not use #determineArtifacts if onlyDeployPom is true and extract #isSnasphot result from pom.xml in that case
const artifactsToDeploy = determineArtifacts(getPotentialArtifactFiles());
const repositoryUrlToUse = isSnapshot(artifactsToDeploy.artifact) ? repositoryUrlSnapshots : repositoryUrl;

const exitCode = runMavenCommand(buildDeployProcessArguments());
process.exit(exitCode);

/** @return { string[] } */
function getPotentialArtifactFiles() {
  const filesInMavenOutputDir = Fs.readdirSync(mavenOutputDir);
  return filesInMavenOutputDir.filter(file => file.endsWith('.jar') && !file.startsWith('original-')).map(file => Path.join(mavenOutputDir, file));
}

/**
 * @param { string[] } files
 * @return { {artifact: string, sources?: string} }
 */
function determineArtifacts(files) {
  const result = {};

  const potentialSourcesFiles = files.filter(file => file.endsWith('-sources.jar'));
  if (potentialSourcesFiles.length > 1) {
    throw new Error(`Found more than one sources jar file: ${potentialSourcesFiles.join(', ')}`);
  }
  if (potentialSourcesFiles.length === 1) {
    result.sources = potentialSourcesFiles[0];
  }

  if (result.sources) {
    files = files.filter(file => file !== result.sources);
  }

  if (files.length > 1) {
    throw new Error(`Found more than one artifact jar file: ${files.join(', ')}`);
  }

  result.artifact = files[0];
  return result;
}

/**
 * @param { string } artifactPath
 * @return boolean
 */
function isSnapshot(artifactPath) {
  return artifactPath.endsWith('-SNAPSHOT.jar');
}

/** @return { string[] } */
function buildDeployProcessArguments() {
  const deployProcessArguments = [
    'deploy:deploy-file',
    `-DrepositoryId=${repositoryId}`,
    `-Durl=${repositoryUrlToUse}`
  ];

  deployProcessArguments.push(`-DpomFile=${mavenPomFile}`);

  if (onlyDeployPom) {
    deployProcessArguments.push(`-Dfile=${mavenPomFile}`);

    return deployProcessArguments;
  }

  deployProcessArguments.push(`-Dfile=${artifactsToDeploy.artifact}`);

  if (artifactsToDeploy.sources) {
    deployProcessArguments.push(`-Dsources=${artifactsToDeploy.sources}`);
  }

  return deployProcessArguments;
}

/** @return { int } */
function runMavenCommand(processArguments) {
  const command = 'mvn';

  console.log('Running', command, processArguments);
  const mvnProcess = ChildProcess.spawnSync(command, processArguments, {stdio: 'inherit'});

  return mvnProcess.status;
}
