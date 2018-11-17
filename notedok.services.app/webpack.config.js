const htmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/notedok.js',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        new htmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html'
        })
    ],
    watch: true,
    devtool: 'source-map'
};