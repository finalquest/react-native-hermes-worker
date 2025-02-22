#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

function findHermesCompiler() {
  // Get platform-specific folder for Hermes
  const platform = process.platform;
  let hermesPlatformFolder;
  switch (platform) {
    case 'darwin':
      hermesPlatformFolder = 'osx-bin';
      break;
    case 'linux':
      hermesPlatformFolder = 'linux64-bin';
      break;
    case 'win32':
      hermesPlatformFolder = 'win64-bin';
      break;
    default:
      console.error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }

  // Get Hermes path from react-native
  const hermesPath = path.join(
    __dirname,
    '../node_modules/react-native/sdks/hermesc',
    hermesPlatformFolder,
    platform === 'win32' ? 'hermesc.exe' : 'hermesc'
  );

  if (fs.existsSync(hermesPath)) {
    return hermesPath;
  }

  console.error('Error: Hermes compiler not found at:');
  console.error(`- Path: ${hermesPath}`);
  console.error(
    'Make sure you have react-native installed with Hermes enabled'
  );
  process.exit(1);
}

const HERMES_PATH = findHermesCompiler();
const configPath = path.join(process.cwd(), 'hermes-workers.json');

if (!fs.existsSync(configPath)) {
  console.error('Error: hermes-workers.json not found in project root');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!Array.isArray(config)) {
  console.error(
    'Error: hermes-workers.json should contain an array of entry points'
  );
  process.exit(1);
}

function ensureDirectoryExists(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function buildForPlatform(platform, entryPoint, bundleOutput, hermesOutput) {
  console.log(
    `\nBuilding worker for ${platform}... with entrypoint ${entryPoint}, bundleOut: ${bundleOutput} and hermesOut: ${hermesOutput}`
  );
  ensureDirectoryExists(bundleOutput);

  // Bundle with Metro
  console.log(`Bundling worker with Metro for ${platform}...`);
  child_process.execSync(
    `npx react-native bundle \
        --dev false \
        --entry-file ${entryPoint} \
        --bundle-output ${bundleOutput} \
        --platform ${platform}`,
    { stdio: 'inherit' }
  );

  // Compile with Hermes
  console.log(`Compiling with Hermes for ${platform}...`);
  child_process.execSync(
    `${HERMES_PATH} \
        -emit-binary \
        -out ${hermesOutput} \
        ${bundleOutput}`,
    { stdio: 'inherit' }
  );
}

for (const entryPoint of config) {
  const workerName = path.basename(entryPoint, path.extname(entryPoint));

  // iOS paths for this worker
  const iosBundle = path.join(
    process.cwd(),
    'ios/assets',
    `${workerName}.worker.bundle.js`
  );
  const iosHermes = path.join(
    process.cwd(),
    'ios/assets',
    `${workerName}.worker.bundle.hbc`
  );

  // Android paths for this worker
  const androidBundle = path.join(
    process.cwd(),
    'android/src/main/assets',
    `${workerName}.worker.bundle.js`
  );
  const androidHermes = path.join(
    process.cwd(),
    'android/src/main/assets',
    `${workerName}.worker.bundle.hbc`
  );

  // Build for each platform
  buildForPlatform('ios', entryPoint, iosBundle, iosHermes);
  buildForPlatform('android', entryPoint, androidBundle, androidHermes);
}
