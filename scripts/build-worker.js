#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

// Update Hermes path to match React Native's location
const HERMES_ENGINE_PATH = path.join(
  __dirname,
  '../example/ios/Pods/hermes-engine'
);
const HERMES_PATH = path.join(HERMES_ENGINE_PATH, 'destroot/bin/hermesc');

const configPath = path.join(process.cwd(), 'hermes-workers.json');

// Add check for Hermes path
if (!fs.existsSync(HERMES_PATH)) {
  console.error(`Error: Hermes compiler not found at ${HERMES_PATH}`);
  console.error(
    'Make sure you have run "pod install" in the example/ios directory'
  );
  process.exit(1);
}

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
  console.log('ENTRYYYY', entryPoint);
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

  // Build for each platform
  buildForPlatform('ios', entryPoint, iosBundle, iosHermes);
}
