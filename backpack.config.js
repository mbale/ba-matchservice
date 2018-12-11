module.exports = {
    webpack: (config, options, webpack) => {
      config.entry.main = [
        './src/index.ts'
      ]

      config.resolve = {
        extensions: [".ts", ".js", ".json"]
      };

      config.module.rules.push(
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
      );

      return config
    }
}