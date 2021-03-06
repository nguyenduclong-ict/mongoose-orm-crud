/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
const tsConfig = require("./tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");
const baseUrl = process.env.NODE_ENV === "production" ? "./dist" : "./src";
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});
