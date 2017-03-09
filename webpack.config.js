var webpack = require("webpack");
var path = require("path");

var ExternalsPlugin = require("webpack2-externals-plugin");
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
    libraryTarget: "var",
    umdNamedDefine: true
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: "ts-loader",
      exclude: /node_modules/,
      options: {
        configFileName: "./tsconfig-web.json"
      }
    }]
  },
  resolve: {
    modules: [path.resolve("./src"), "node_modules"],
    extensions: [".ts", ".js"]
  },
  plugins: [
    new UglifyJsPlugin({include: /\.min\.js$/, minimize: true}),
    new ExternalsPlugin({include: path.resolve(__dirname, "./node_modules")})
  ]
};

module.exports = config;
