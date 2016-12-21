module.exports = function(config) {
  config.set({
    frameworks: ["mocha", "karma-typescript"],
    files: [
      {pattern: "src/**/*.ts"},
      {pattern: "test/**/*.ts"}
    ],
    preprocessors: {
      "src/**/*.ts": ["karma-typescript"],
      "test/**/*.ts": ["karma-typescript"]
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["Chrome"],
    karmaTypescriptConfig: {
      tsconfig: "tsconfig-test.json"
    }
  });
};
