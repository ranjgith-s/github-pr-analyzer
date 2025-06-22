import fs from 'fs';
const summary = JSON.parse(
  fs.readFileSync('coverage/coverage-summary.json', 'utf8')
);
const pct = summary.total.lines.pct;
const readme = fs.readFileSync('README.md', 'utf8');
const updated = readme.replace(/Line coverage: .*%/, `Line coverage: ${pct}%`);
fs.writeFileSync('README.md', updated);
