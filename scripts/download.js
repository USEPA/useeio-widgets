const fs = require('fs');

let endpoint = null;
let apikey = null;

// parse command line arguments
// --endpoint <API endpoint>
// --apikey <API key>
let flag = null;
for (const arg of process.argv) {
    if (arg.startsWith('--')) {
        flag = arg;
        continue;
    }
    if (!flag) {
        continue;
    }
    switch (flag) {
        case '--endpoint':
            endpoint = arg;
            break;
        case '--apikey':
            apikey = arg;
            break;
        default:
            break;
    }
    flag = null;
}

if (!endpoint) {
    endpoint = 'http://localhost/api';
    console.log("No endpoint set; use default: " + endpoint);
}
if (!apikey) {
    console.log("No API key set; use none");
}

const http = endpoint.startsWith('https')
    ? require('https')
    : require('http');

// the target folder where we store the downloaded data
const targetDir = __dirname + '/../build/api';

async function fetch(path) {
    return new Promise((resolve, reject) => {

        const url = `${endpoint}${path}`;
        console.log(`fetch data from ${url}`)
        const config = {};
        if (apikey) {
            config['x-api-key'] = apikey;
        }

        http.get(url, config, (response) => {

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
            if (!fs.existsSync(dir + '/matrix')) {
                fs.mkdirSync(dir + '/matrix');
            }

            const paths = [
                '/sectors',
                '/flows',
                '/indicators',
                '/demands',
                '/matrix/A',
                '/matrix/B',
                '/matrix/C',
                '/matrix/D',
                '/matrix/L',
                '/matrix/U'
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
