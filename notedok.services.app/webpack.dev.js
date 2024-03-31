const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    entry: {
        notedok: './src/notedok-diagnose.js'
    },
});