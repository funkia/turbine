module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'mocha', 'source-map-support'],
    files: [
      'test/**/*.ts'
    ],
    preprocessors: {
      'test/**/*.ts': ['browserify']
    },
    browserify: {
      debug: true,
      plugin: ['tsify']
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chromium'],
    singleRun: false,
    concurrency: Infinity
  });
};
