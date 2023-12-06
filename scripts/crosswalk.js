// creates a NAICS => BEA code mapping and generates the naics.ts module.

const fs = require('fs');
const path = require('path');

const csv = `${__dirname}${path.sep}crosswalk.csv`;
const ts = `${__dirname}${path.sep}..${path.sep}src${path.sep}naics.ts`;

function lexLine(line) {
    let words = [];
    let word = '';
    let inQuotes = false;
    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (inQuotes) {
            word += char;
            continue;
        }
        if (char === ',') {
            words.push(word);
            word = '';
            continue;
        }
        word += char;
    }
    return words;
}

function main() {
    const text = fs.readFileSync(csv, { encoding: 'utf-8', flag: 'r' });
    const lines = text.split(/\r\n|\r|\n/);

    // print the column headers
    // lexLine(lines[0]).forEach(
    //     (header, col) => console.log(`${col}: ${header}`));

    const codes = {};
    for (let i = 1; i < lines.length; i++) {
        const row = lexLine(lines[i]);
        const bea = row[4].trim();
        const naics = row[12].trim();
        if (bea === '' || naics === '') {
            continue;
        }
        codes[naics] = bea;
    }

    const json = JSON.stringify(codes, null, 4);
    const module = `/** Maps the given NAICS code to a BEA 389 code. */
export function toBEA(naicsCode: string): string | undefined {
    return naicsToBEA[naicsCode];
}

const naicsToBEA: { [code: string]: string } = ${json};
`;
    fs.writeFileSync(ts, module);

}

main();
