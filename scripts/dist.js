// this script packages the build folder into a distribution package.
// it appends some meta data like date, branch, commit hash to the
// generated zip file. the output is written to the `dist` folder.

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const process = require('child_process');


const main = () => {

    // run a clean build
    console.log('Clean the build folders ...');
    process.execSync('npm run clean');
    console.log('Run the build ...');
    process.execSync('npm run build');
    console.log('Create the distribution package...');
    
    // locate folders
    const distDir = path.resolve(__dirname, '../dist');
    fs.mkdirSync(distDir, {recursive: true});
    const buildDir = path.resolve(__dirname, '../build');

    // collect meta-data for the zip
    const date = new Date().toISOString().substring(0, 10);
    const branch = process
        .execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim();
    const commit = process
        .execSync('git rev-parse --short HEAD')
        .toString()
        .trim();

    // create the zip
    const zip = `${distDir}/useeio-widgets-${date}-${branch}-${commit}.zip`;
    const stream = fs.createWriteStream(zip);
    stream.on('close', () => console.log('All done'));
    const archive = archiver('zip');
    archive.pipe(stream);
    archive.directory(buildDir, 'useeio-widgets');
    archive.finalize();

};

main();
