import { readFile, writeFile } from 'node:fs/promises';
import { assertValid, dataScript, exportYaml } from './lib/data.mjs';

try {
  const data = JSON.parse(await readFile('all-configs.json', 'utf8'));
  assertValid(data, { corrected: true });
  await Promise.all([writeFile('all-configs.js', dataScript(data)), writeFile('models.yml', exportYaml(data))]);
  console.log('Generated all-configs.js and models.yml from all-configs.json.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
