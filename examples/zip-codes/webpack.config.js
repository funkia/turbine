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

// module.exports = {
//   entry: {
//     app: ["./index.ts"]
//   },
//   output: {
//     path: __dirname,
//     filename: "bundle.js"
//   },
//   resolve: {
//     extensions: ['', '.webpack.js', '.ts', '.js', '.tsx', 'jsx']
//   },
//   devtool: 'inline-source-map',
//   module: {
//     loaders: [
//       {
//         test: /\.tsx?$/,
//         loader: 'awesome-typescript-loader'
//       },
//     ]
//   },
//   devServer: {
//     contentBase: "./",
//     port: 8080
//   }
// };
