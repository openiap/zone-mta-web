const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map',
    optimization: {
      minimize: false
    },
    resolve: {
    symlinks: false
    },
  },
})
