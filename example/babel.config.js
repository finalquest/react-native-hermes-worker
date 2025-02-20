const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');

module.exports = getConfig(
  {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      path.resolve(__dirname, '../src/plugins/index.js'), // Use the local Babel plugin
    ],
  },
  { root, pkg }
);
