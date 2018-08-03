const path = require('path');
module.exports = {
  type: 'react-app',
  devServer: {
    port: 80,
    allowedHosts: [
      'localhost',
      'novel.davewelling.com'
    ]
  },
  webpack: {
    rules: {
      babel: {
        exclude: /node_modules\/(?![redux\-orm])/,
        options: {babelrc: false, cacheDirectory: true}
      }
    },
    html: {
      favicon: 'src/favicon.png'
    },
    copy: [
      // Copy directory contents to output
      {from: 'src/apple-touch-icon.png'}
    ]
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
