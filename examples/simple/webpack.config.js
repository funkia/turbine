var path = require('path');

module.exports = {
  entry: ['babel-polyfill', './index.ts'],
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    modules: [
      path.join(__dirname, 'src'),
      "node_modules"
    ]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          "babel-loader",
          "ts-loader"
        ]
      }
    ]
  }
};
