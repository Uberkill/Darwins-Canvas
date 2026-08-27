const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/ui/components/WorldSetupModal.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/padding: 12px 20px;/g, 'padding: var(--space-md) var(--space-lg);');
css = css.replace(/margin-top: 16px;/g, 'margin-top: var(--space-lg);');

fs.writeFileSync(file, css);
console.log('Refined CSS 4');
