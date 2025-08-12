/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

function updateCoverage() {
  const summaryPath = 'coverage/coverage-summary.json';
  if (!fs.existsSync(summaryPath)) {
    console.error(`Missing ${summaryPath}. Run tests with coverage first.`);
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const pct = summary?.total?.lines?.pct ?? 0;
  const readmePath = 'README.md';
  const readme = fs.readFileSync(readmePath, 'utf8');

  // Replace an existing standalone coverage line or append after the first H1.
  let nextContent = readme;
  if (/^Line coverage: .*%$/m.test(readme)) {
    nextContent = readme.replace(
      /^Line coverage: .*%$/m,
      `Line coverage: ${pct}%`
    );
  } else if (/^#\s.*$/m.test(readme)) {
    // After first H1 add the line
    nextContent = readme.replace(/^(#\s.*$)/m, `$1\n\nLine coverage: ${pct}%`);
  } else {
    nextContent = `${readme}\n\nLine coverage: ${pct}%\n`;
  }

  fs.writeFileSync(readmePath, nextContent);
  console.log(`Updated README line coverage to ${pct}%`);
}

updateCoverage();
