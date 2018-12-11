const path = require('path')
const nodeExternals = require('webpack-node-externals');
const { CheckerPlugin } = require('awesome-typescript-loader');
const NodemonPlugin = require('nodemon-webpack-plugin');

module.exports = (argv) => {
  return {
    mode: argv.mode || 'development',
    devtool: argv.mode === 'development' ? 'inline-source-map' : 'source-map',
    entry: path.join(__dirname, 'src/index.ts'),
    output: {
      filename: 'app.js',
      path: path.resolve(__dirname, 'build'),
    },
    target: 'node',
    externals: [nodeExternals()],
    resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: ['.ts', '.tsx', '.js']
    },
    watch: true,
    module: {
      rules: [
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          loader: 'awesome-typescript-loader',
          options: {
            reportFiles: [
              "src/**/*.{ts,tsx}"
            ]
          }
        }
      ]
    },
    plugins: [
      new CheckerPlugin(),
      new NodemonPlugin({
        watch: path.resolve('./build/app.js'),
        ignore: ['*.js.map'],
        verbose: true,
      }),
    ]
  }
}
