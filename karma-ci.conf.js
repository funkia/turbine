const browsers = {
  sl_chrome_35: {
    base: "SauceLabs",
    browserName: "chrome",
    platform: "Windows 7",
    version: "35"
  },
  sl_firefox_50: {
    base: "SauceLabs",
    browserName: "firefox",
    version: "50"
  },
  sl_firefox_45: {
    base: "SauceLabs",
    browserName: "firefox",
    version: "45"
  },
  sl_ie_11: {
    base: "SauceLabs",
    browserName: "internet explorer",
    platform: "Windows 8.1",
    version: "11"
  },
  sl_ie_10: {
    base: "SauceLabs",
    browserName: "internet explorer",
    platform: "Windows 7",
    version: "10"
  },
  sl_edge_13: {
    base: "SauceLabs",
    browserName: "MicrosoftEdge",
    platform: "Windows 10",
    version: "13.10586"
  },
  sl_safari: {
    base: "SauceLabs",
    browserName: "safari",
    platform: "macOS 10.12",
    version: "10.0"
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
      startConnect: false
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
