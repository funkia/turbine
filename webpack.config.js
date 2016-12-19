var webpack = require("webpack");
var path = require("path");

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

var config = {
  entry: {
    "funnel": __dirname + "/src/index.ts",
    "funnel.min": __dirname + "/src/index.ts"
  },
  devtool: "source-map",
  output: {
    path: __dirname + "/dist",
    filename: "[name].js",
    library: "funnel",
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    loaders: [
      {test: /\.ts$/, loader: "ts-loader", exclude: /node_modules/}
    ]
  },
  resolve: {
    root: path.resolve('./src'),
    extensions: ["", ".ts", ".js"]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({ include: /\.min\.js$/, minimize: true})
  ]
};

module.exports = config;
