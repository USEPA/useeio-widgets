const path = require('path');
const buildDir = path.resolve(__dirname, 'build');
const CopyPlugin = require('copy-webpack-plugin');

const config = {
    entry: {
        'ImpactChart': './src/impact-chart.ts',
        'FilterWidget': './src/filter-widget.ts',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: '[name].js',
        path: buildDir,
        libraryTarget: 'var',
        library: ['USEEIO', '[name]'],
    },

    plugins: [
        new CopyPlugin([
            { from: 'src/**/*.html', to: buildDir, flatten: true },
            { from: 'src/**/*.css', to: buildDir, flatten: true },
            {
                from: 'node_modules/d3/dist/d3.min.js',
                to: buildDir + '/lib/d3.min.js', type: 'file'
            },
        ]),
    ],

    externals: {
        "d3": "d3",
    }
};

module.exports = (_env, argv) => {
    if (argv.mode === 'development') {
        config.devtool = 'source-map';
    }
    return config;
};