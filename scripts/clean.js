const fs = require('fs');

const buildDir = __dirname + '/../build';
for (const file of fs.readdirSync(buildDir)) {
    const path = buildDir + '/' + file;
    const stats = fs.lstatSync(path);
    if (stats.isFile()) {
        fs.unlinkSync(path);
    } else if (file === 'lib') {
        fs.rmdirSync(path, { recursive: true });
    }
}

const distDir = __dirname + '/../dist';
fs.rmdirSync(distDir, {recursive: true});
