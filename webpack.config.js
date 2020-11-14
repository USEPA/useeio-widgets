const path = require('path');
const buildDir = path.resolve(__dirname, 'build');
const CopyPlugin = require('copy-webpack-plugin');

const config = {
    entry: {
        // we could also generate a small JS library for every widget
        // 'ImpactChart': './src/impact-chart.ts',
        // 'FilterWidget': './src/filter-widget.ts',
        // 'SectorDelete': './src/sector-list.ts',
        'useeio_widgets': './src/main.ts',
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
        new CopyPlugin({
            patterns: [
                { from: 'src/**/*.html', to: buildDir, flatten: true },
                { from: 'src/**/*.css', to: buildDir, flatten: true },
                {
                    from: 'node_modules/d3/dist/d3.min.js',
                    to: buildDir + '/lib/d3.min.js',
                    toType: 'file',
                },
                {
                    from: 'node_modules/apexcharts/dist/apexcharts.min.js',
                    to: buildDir + '/lib/apexcharts.min.js', 
                    toType: 'file'
                },
                {
                    from: 'node_modules/apexcharts/dist/apexcharts.css',
                    to: buildDir + '/lib/apexcharts.css', 
                    toType: 'file'
                },
                /*
                // We compile React into the generated library but we could
                // also reference it as an external dependency (see below). 
                // This would be useful when React is already available in
                // the page where the widgets whould be included.
                {
                    from: 'node_modules/react/umd/react.production.min.js',
                    to: buildDir + '/lib/react.production.min.js', toType: 'file'
                },
                {
                    from: 'node_modules/react-dom/umd/react-dom.production.min.js',
                    to: buildDir + '/lib/react-dom.production.min.js', toType: 'file'
                },
                */
            ]
        }),
    ],

    externals: {
        "d3": "d3",
        "apexcharts": "apexcharts",
        /*
        "react": "React",
        "react-dom": "ReactDOM",
        */
    }
};

module.exports = (_env, argv) => {
    if (argv.mode === 'development') {
        config.devtool = 'source-map';
    }
    return config;
};