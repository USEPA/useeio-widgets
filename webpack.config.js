const path = require('path');
const buildDir = path.resolve(__dirname, 'build');
const CopyPlugin = require('copy-webpack-plugin');

const config = {
    entry: {
        // we could generate a small JS lib for every widget
        // 'ImpactChart': './src/impact-chart.ts',
        // 'FilterWidget': './src/filter-widget.ts',
        // 'SectorList': './src/sector-list.ts',
        // 'ImpactHeatmap': './src/impact-heatmap.ts',
        'useeio_widgets': './src/useeio-widgets.ts',
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
        path: buildDir + '/lib',
        libraryTarget: 'var',
        library: ['useeio' /*, '[name]' */],
    },

    plugins: [
        new CopyPlugin([
            { from: 'src/**/*.html', to: buildDir, flatten: true },
            { from: 'src/**/*.css', to: buildDir, flatten: true },
            {
                from: 'node_modules/d3/dist/d3.min.js',
                to: buildDir + '/lib/d3.min.js', type: 'file'
            },
            {
                from: 'node_modules/apexcharts/dist/apexcharts.min.js',
                to: buildDir + '/lib/apexcharts.min.js', type: 'file'
            },
            {
                from: 'node_modules/apexcharts/dist/apexcharts.css',
                to: buildDir + '/lib/apexcharts.css', type: 'file'
            }
        ]),
    ],

    externals: {
        "d3": "d3",
        "apexcharts": "apexcharts",
    }
};

module.exports = (_env, argv) => {
    if (argv.mode === 'development') {
        config.devtool = 'source-map';
    }
    return config;
};