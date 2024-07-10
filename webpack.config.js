const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.js', // Your app's entry point
  target: 'node', // Target Node.js environment
  mode: 'development',
  output: {
    filename: 'index.js', // Output filename
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
  externals: [nodeExternals()], // Exclude Node.js core modules
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [],
  resolve: {
    extensions: ['.js'],
  },
};
