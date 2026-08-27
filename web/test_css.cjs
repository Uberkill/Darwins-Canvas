const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/ui/components/WorldSetupModal.css');
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/padding: 32px 32px 16px 32px;/g, 'padding: var(--space-xl) var(--space-xl) var(--space-md) var(--space-xl);');
css = css.replace(/gap: 16px;/g, 'gap: var(--space-md);');
css = css.replace(/padding: 12px 20px;/g, 'padding: var(--space-md) var(--space-xl);');
css = css.replace(/margin-top: 16px;/g, 'margin-top: var(--space-md);');
css = css.replace(/gap: 8px;/g, 'gap: var(--space-sm);');
css = css.replace(/gap: 4px;/g, 'gap: var(--space-xs);');
css = css.replace(/margin-bottom: 6px;/g, 'margin-bottom: var(--space-sm);');
css = css.replace(/padding: 0 12px;/g, 'padding: 0 var(--space-md);');
css = css.replace(/margin: 8px 0 0 0;/g, 'margin: var(--space-sm) 0 0 0;');

fs.writeFileSync(file, css);
console.log('Updated CSS 2');
