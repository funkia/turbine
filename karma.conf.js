module.exports = function(config) {
  config.set({
    frameworks: ["mocha", "karma-typescript"],
    files: [
      { pattern: "src/**/*.ts" },
      { pattern: "test/**/*.ts" },
      { pattern: "test/**/*.tsx" }
    ],
    preprocessors: {
      "src/**/*.ts": ["karma-typescript"],
      "test/**/*.ts": ["karma-typescript"],
      "test/**/*.tsx": ["karma-typescript"]
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
