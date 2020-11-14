const fs = require('fs');

let endpoint = null;
let apikey = null;
let args = {};

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
            args[flag.substring(2)] = arg;
            break;
    }
    flag = null;
}

if (!endpoint) {
    endpoint = 'http://localhost/api';
    console.log('No endpoint set; use default: ' + endpoint);
}
if (endpoint.endsWith('/')) {
    endpoint = endpoint.substring(0, endpoint.length - 1);
}
if (!apikey) {
    console.log('No API key set; use none');
}

const http = endpoint.startsWith('https')
    ? require('https')
    : require('http');

// the target folder where we store the downloaded data
const targetDir = __dirname + '/../build/api';

/** Fetches the resource with the given path from the API. */
async function fetch(path) {
    return new Promise((resolve, reject) => {

        const url = `${endpoint}${path}`;
        console.log(`fetch data from ${url}`);
        const options = {};
        if (apikey) {
            options.headers = {
                'x-api-key': apikey,
            };
        }

        http.get(url, options, (response) => {

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
            .on('abort', reject)
            .on('error', reject);
    });
}

/** Downloads the data of a model with the given ID into the data folder. */
async function download(modelID) {
    if (!modelID) {
        return;
    }

    // first create the model folders (blocking)
    const mappedDir = args[modelID];
    const dir = mappedDir
        ? targetDir + '/' + mappedDir
        : targetDir + '/' + modelID;
    [dir, dir + '/matrix', dir + '/demands'].forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    });

    // download index and matrix files (non-blocking)
    const paths = [
        '/sectors',
        '/flows',
        '/indicators',
    ];
    ['A', 'B', 'C', 'D', 'L', 'U'].forEach(matrix => {
        paths.push('/matrix/' + matrix);
    });
    for (const path of paths) {
        fetch(`/${modelID}${path}`)
            .then(data => {
                const file = `${dir}${path}.json`;
                console.log('write file', file);
                fs.writeFile(file, data, () => { });
            })
            .catch(error => {
                console.log('failed to download', path, ':', error);
            });
    }

    // download the demand vectors
    const demandsText = await fetch(`/${modelID}/demands`);
    fs.writeFile(`${dir}/demands.json`, demandsText, () => { });
    const demands = JSON.parse(demandsText);
    for (const demand of demands) {
        fetch(`/${modelID}/demands/${demand.id}`)
            .then(data => {
                const file = `${dir}/demands/${demand.id}.json`;
                console.log('write file', file);
                fs.writeFile(file, data, () => { });
            })
            .catch(error => {
                console.log('failed to download demand', demand.id, ':', error);
            });
    }
}

(async function main() {
    try {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }
        fetch('/sectorcrosswalk.csv').then(csv => {
            fs.writeFile(targetDir + '/sectorcrosswalk.csv', csv, () => { });
        });
        const modelText = await fetch('/models');
        fs.writeFile(targetDir + '/models.json', modelText, () => { });
        const models = JSON.parse(modelText);
        for (const model of models) {
            download(model.id);
        }
    } catch (e) {
        console.log('Download failed:');
        console.log(e);
    }
})();
