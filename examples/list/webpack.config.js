module.exports = {
  entry: {
    app: ["./index.ts"]
  },
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  resolve: {
    extensions: ['', '.webpack.js', '.ts', '.js', '.tsx', 'jsx']
  },
  devtool: 'inline-source-map',
  module: {
    loaders: [
      {test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
    ]
  },
  devServer: {
    contentBase: "./",
    port: 8080
  }
};
