"use strict";

const { join } = require("path");

module.exports = {
  extends: "plugin:@phanect/node+ts",

  env: {
    node: true,
  },
  parserOptions: {
    project: join(__dirname, "./tsconfig.json"),
  },
  plugins: [ "@phanect" ],
};
