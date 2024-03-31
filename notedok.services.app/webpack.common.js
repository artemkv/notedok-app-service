const path = require('path');
const webpack = require('webpack');
const htmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        // Main page
        notedok: './src/notedok.js',
        // Shows the shared note, read-only view
        shared: './src/shared.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './[name].[contenthash].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    optimization: {
        // Extract boilerplate code into runtime chunk
        runtimeChunk: 'single',
        // Keeps modules id consistent between builds
        moduleIds: 'deterministic',
        // Put all third-party dependencies into the vendors chunk
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    plugins: [
        new htmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            chunks: ['runtime', 'vendors', 'notedok']
        }),
        new htmlWebpackPlugin({
            filename: 'shared.html',
            template: './src/shared.html',
            chunks: ['runtime', 'vendors', 'shared']
        }),
        new CopyPlugin({
            patterns: [
                { from: './src/favicon.ico' },
            ]
        })
    ],
    devtool: 'source-map'
};