"use strict";

module.exports = {
  extends: "plugin:@phanect/node+ts",

  env: {
    node: true,
  },
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: [ "@phanect" ],
};
