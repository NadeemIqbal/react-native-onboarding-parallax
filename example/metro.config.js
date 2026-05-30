// Lets the example consume the library from its source one directory up, while
// forcing a single copy of react / react-native (the example's) so hooks work.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const peerDeps = ['react', 'react-native'];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

config.resolver.blockList = new RegExp(
  '(' +
    peerDeps
      .map((name) => escapeRegExp(path.join(workspaceRoot, 'node_modules', name)) + '\\/.*$')
      .join('|') +
    ')',
);

config.resolver.extraNodeModules = peerDeps.reduce((acc, name) => {
  acc[name] = path.resolve(projectRoot, 'node_modules', name);
  return acc;
}, {});

module.exports = config;
