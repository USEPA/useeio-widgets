const fs = require('fs');
const http = require('http');

const endpoint = 'http://localhost/api';

// the target folder where we store the downloaded data
const targetDir = '../build/api';

async function fetch(path) {
    return new Promise((resolve, reject) => {

        const url = `${endpoint}${path}`;
        console.log(`fetch data from ${url}`)
        http.get(url, (response) => {

            // check the status code
            const status = response.statusCode;
            if (status != 200) {
                reject(`status: ${status} ${response.statusMessage}`);
                return;
            }

            // read the response text
            let body = '';
            response.setEncoding('utf-8');
            response.on('data', (chunk) => {
                body += chunk;
            });
            response.on('end', () => {
                resolve(body);
            }).on('error', reject);

        })
            .on("abort", reject)
            .on("error", reject);
    });
}

(async function main() {
    try {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }

        const modelText = await fetch('/models');
        fs.writeFile(targetDir + '/models', modelText, () => { });
        const models = JSON.parse(modelText);

        for (const model of models) {
            const dir = targetDir + '/' + model.id;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            const paths = [
                '/sectors',
                '/flows',
                '/indicators',
                '/demands'
            ];
            for (const p of paths) {
                const path = `/${model.id}${p}`
                const data = await fetch(path);
                fs.writeFile(dir + p, data, () => { });
            }
        }


    } catch (e) {
        console.log("Download failed:")
        console.log(e);
    }
})();
