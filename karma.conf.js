module.exports = function (config) {
  config.set({
    frameworks: ["mocha", "karma-typescript"],
    files: [
      { pattern: "src/**/*.ts" },
      { pattern: "test/**/*.ts" }
    ],
    preprocessors: {
      "src/**/*.ts": ["karma-typescript"],
      "test/**/*.ts": ["karma-typescript"]
    },
    reporters: ["mocha", "karma-typescript"],
    browsers: ["Chrome"],
    karmaTypescriptConfig: {
      tsconfig: "tsconfig.json",
      reports: {
        html: "coverage",
        text: ""
      },
      exclude: ["examples"],
      compilerOptions: {
        module: "commonjs"
      }
    }
  });
};
