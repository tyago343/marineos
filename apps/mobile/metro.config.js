const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

const appNodeModules = path.resolve(projectRoot, "node_modules");

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = originalResolveRequest ?? context.resolveRequest;

  const singletonPkgs = ["react", "react-native", "react-dom"];
  for (const pkg of singletonPkgs) {
    if (moduleName === pkg || moduleName.startsWith(pkg + "/")) {
      return resolve(
        { ...context, originModulePath: path.join(projectRoot, "index.js") },
        moduleName,
        platform
      );
    }
  }

  return resolve(context, moduleName, platform);
};

module.exports = config;
