// this is just a demo script how this could be done

const fs = require('fs');

const fractionDigits = 3;
const dir = __dirname + '/../build/api/MODEL42/matrix/'
const data = fs.readFileSync(dir + 'L.json');
const matrix = JSON.parse(data.toString('utf-8'));
const fmt = JSON.stringify(matrix, (_key, val) => {
    if (!val.toExponential)
        return val;
    const str = val.toString();
    const exp = val.toExponential(fractionDigits);
    return str.length < exp.length
        ? val
        : Number(exp);
});
fs.writeFileSync(dir + 'L_red.json', fmt);
