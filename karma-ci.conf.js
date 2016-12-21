var browsers = {                                 // 1
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7',
    version: '35'
  },
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '50'
  },
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
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
    reporters: ["mocha", "saucelabs", "karma-typescript"],
    sauceLabs: {
      testName: 'Karma and Sauce Labs demo',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      startConnect: false
    },
    browsers: Object.keys(browsers),
    customLaunchers: browsers,
    karmaTypescriptConfig: {
      tsconfig: "tsconfig-test.json",
      reports: {
	json: "coverage"
      }
    },
    singleRun: true
  });
};
