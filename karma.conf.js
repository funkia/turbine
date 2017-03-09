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
    reporters: ["mocha", "karma-typescript"],
    browsers: ["Chrome", "Chromium"],
    karmaTypescriptConfig: {
      tsconfig: "tsconfig-test.json",
      reports: {
	html: "coverage",
	text: ""
      }
    }
  });
};
