const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(file, 'utf8');

// 1. .modal-card padding and gap
css = css.replace(/padding: clamp\(var\(--space-md\), 3cqh, var\(--space-lg\)\);/g, 'padding: var(--space-xl);');
css = css.replace(/gap: clamp\(var\(--space-sm\), 2cqh, var\(--space-md\)\);/g, 'gap: var(--space-xl);');

// 2. .col-tools and .col-settings gaps
css = css.replace(/gap: clamp\(var\(--space-sm\), 2cqh, var\(--space-lg\)\);/g, 'gap: var(--space-xl);');
css = css.replace(/gap: var\(--space-md\);\s*height: 100%;/g, 'gap: var(--space-xl);\n  height: 100%;');

// 3. .section-block and .section-title
css = css.replace(/margin-top: var\(--space-md\);/g, 'margin-top: var(--space-xl);');
css = css.replace(/font-size: 16px; font-weight: 900; color: var\(--color-text-muted\); text-transform: uppercase; letter-spacing: 1px; margin-bottom: var\(--space-sm\);/g, 'font-size: 13px; font-weight: 900; color: #9A9289; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: var(--space-md);');

// 4. .pill padding
css = css.replace(/padding: var\(--space-sm\) var\(--space-md\);/g, 'padding: 12px 20px;');

// 5. .btn-action padding
css = css.replace(/\.btn-action \{[\s\S]*?padding: 16px;/g, match => match.replace('padding: 16px;', 'padding: 24px;'));

fs.writeFileSync(file, css);
console.log('Updated index.css modal spacing');
