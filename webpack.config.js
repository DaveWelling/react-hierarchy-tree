const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');

module.exports = {
    devtool: 'source-map',
    mode: process.env.NODE_ENV,
    entry: {
        main: ['./src/index']
    },
    output: {
        filename: '[name].[hash].js',
        chunkFilename: '[name].[hash].js'
    },
    stats: {
        excludeModules: 'mini-css-extract-plugin'
    },
    devServer: {
        contentBase: './src',
        historyApiFallback: {
            index: '/index.html'
        },
        port: 80,
        host: '0.0.0.0',
        allowedHosts: ['localhost', 'novel.davewelling.com'],
        hot: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                // include symlinked libraries so other packages are pre-compiled with babel.
                exclude: /.*node_modules((?!localModule).)*$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [require.resolve('@babel/preset-env'), require.resolve('@babel/preset-react')]
                    }
                }
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            // This is a feature of `babel-loader` for Webpack (not Babel itself).
                            // It enables caching results in ./node_modules/.cache/babel-loader/
                            // directory for faster rebuilds.
                            cacheDirectory: true
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    process.env.NODE_ENV === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader'
                ]
            },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
            { test: /\.(woff|woff2)$/, loader: 'url-loader?prefix=font/&limit=5000' },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml' },
            { test: /\.(png|jpg|gif)$/, use: [{ loader: 'url-loader', options: { limit: 8192 } }] }
        ]
    },
    plugins: [
        // Copy the iOS icon to the root of the bundle
        new CopyWebpackPlugin([
            {
                from: './src/apple-touch-icon.png',
                to: 'apple-touch-icon.png'
            }
        ]),
        // Make browser version avoid using Node specific stuff
        new webpack.NormalModuleReplacementPlugin(
            /^fs$/,
            path.resolve(__dirname, './src/database/fakeFs.js')
        ),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // dropping locales makes moment WAY smaller.
        new webpack.DefinePlugin({
            __PRODUCTION__: process.env.NODE_ENV === 'production',
            __TESTING__: false
        }),
        new HtmlWebPackPlugin({
            template: 'src/index.html',
            filename: './index.html',
            favicon: 'src/favicon.png',
            chunks: ['main']
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[hash].css',
            chunkFilename: '[id].css'
        }),
        new WorkboxPlugin.GenerateSW({
            // Do not precache images
            exclude: [/\.(?:png|jpg|jpeg|svg)$/],
            // Define runtime caching rules.
            runtimeCaching: [
                {
                    // Match any request that ends with .png, .jpg, .jpeg or .svg.
                    urlPattern: /\.(?:png|jpg|jpeg|svg)$/,

                    // Apply a cache-first strategy.
                    handler: 'CacheFirst',

                    options: {
                        // Use a custom cache name.
                        cacheName: 'curatorimages',

                        // Only cache 10 images.
                        expiration: {
                            maxEntries: 10
                        }
                    }
                },
                {
                    urlPattern: /fonts\.gstatic\.com\/(.*)/,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'google-font-file-cache',
                        expiration: {
                            maxEntries: 10
                        }
                    }
                },
                {
                    urlPattern: /fonts\.googleapis\.com\/(.*)/,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'google-font-style-cache',
                        expiration: {
                            maxEntries: 10
                        }
                    }
                }
            ]
        }),
        new WebpackPwaManifest({
            name: 'Curator',
            short_name: 'Curator',
            description: 'Hierarchical Editor',
            start_url: '/index.html',
            background_color: '#137b85',
            theme_color: '#137b85',
            orientation: 'any',
            icons: [
              {
                src: path.resolve('src/apple-touch-icon.png'),
                sizes: [96, 128, 192, 256, 384, 512] // multiple sizes
              }
            ]
          })
    ]
};
