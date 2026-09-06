import { readFile } from 'node:fs/promises';
import { inspectDataset, verifyExports } from './lib/data.mjs';

try {
  const data = JSON.parse(await readFile('all-configs.json', 'utf8'));
  const report = inspectDataset(data, { corrected: true });
  if (!process.argv.includes('--json-only')) {
    const [js, yaml] = await Promise.all([readFile('all-configs.js', 'utf8'), readFile('models.yml', 'utf8')]);
    report.errors.push(...verifyExports(data, js, yaml));
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
