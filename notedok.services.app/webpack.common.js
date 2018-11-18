const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        notedok: './src/notedok.js',
        shared: './src/shared.js'
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: './[name].bundle.js'
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
    plugins: [
        new htmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            chunks: ['notedok']
        }),
        new htmlWebpackPlugin({
            filename: 'shared.html',
            template: './src/shared.html',
            chunks: ['shared']
        }),
        new copyWebpackPlugin([
            { from: './src/favicon.ico' }
        ])
    ],
    devtool: 'source-map'
};