const browsers = {
  sl_chrome: {
    base: "SauceLabs",
    browserName: "chrome",
    platform: "Windows 7"
  },
  sl_firefox: {
    base: "SauceLabs",
    browserName: "firefox",
    platform: "Windows 7"
  },
  sl_safari: {
    base: "SauceLabs",
    browserName: "safari",
    platform: "macOS 10.12"
  },
  // sl_ie_11: {
  //   base: "SauceLabs",
  //   browserName: "internet explorer",
  //   platform: "Windows 8.1",
  //   version: "11"
  // },
  // sl_ie_10: {
  //   base: "SauceLabs",
  //   browserName: "internet explorer",
  //   platform: "Windows 7",
  //   version: "10"
  // },
  sl_edge: {
    base: "SauceLabs",
    browserName: "MicrosoftEdge",
    platform: "Windows 10"
  }
};

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
    reporters: ["saucelabs", "karma-typescript"],
    sauceLabs: {
      testName: "Funnel - Travis CI Karma",
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      startConnect: false,
      verbose: true
    },
    browsers: Object.keys(browsers),
    customLaunchers: browsers,
    concurrency: 5,
    karmaTypescriptConfig: {
      tsconfig: "tsconfig-test.json",
      reports: {
	json: "coverage"
      }
    },
    singleRun: true
  });
};
