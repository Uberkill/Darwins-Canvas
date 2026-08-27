const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.tool-label \{ font-weight: 900; font-size: 16px;/g, '.tool-label { font-weight: 900; font-size: 17px;');
css = css.replace(/font-weight: 900; font-size: 14px; font-family: var\(--font-body\);\n  border: 3px solid var\(--color-border\);/g, 'font-weight: 900; font-size: 15px; font-family: var(--font-body);\n  border: 3px solid var(--color-border);');

fs.writeFileSync(file, css);
console.log('Updated font sizes');
