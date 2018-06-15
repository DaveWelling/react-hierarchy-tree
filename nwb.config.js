const path = require('path');
module.exports = {
  type: 'react-app',
  webpack: {
    rules: {
      babel: {
        exclude: /node_modules\/(?![redux\-orm])/,
        options: {babelrc: false, cacheDirectory: true}
      }
    }
    // config(config) {
    //   config.ignore =  "/node_modules/(?![redux-orm])/"
    //   return config;
    // }
  }
  // webpack: {
  //   aliases: {
  //     'redux-orm': path.resolve(__dirname, 'node_modules', 'redux-orm','lib', 'index.js')
  //   }
  // }
}
