var path = require('path');

module.exports = {
  entry: ['babel-polyfill', './index.ts'],
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '']
  },
  plugins: [
  ],
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader!ts-loader'
      }
    ]
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  }
};
