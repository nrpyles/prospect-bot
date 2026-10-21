import { spawnSync } from 'node:child_process';

const steps = [
  ['unit tests', ['test:unit']],
  ['database integration', ['test:integration']],
  ['TypeScript', ['exec', 'tsc', '--noEmit']],
  ['lint', ['lint']],
  ['production build', ['build']],
  ['browser checks', ['test:e2e']],
];
let failed = false;
for (const [name, args] of steps) {
  if (name === 'database integration' && !process.env.TEST_DATABASE_URL) {
    process.stderr.write('NOT RUN: database integration needs TEST_DATABASE_URL\n');
    failed = true;
    continue;
  }
  if (name === 'browser checks' && !(process.env.CRM_E2E_BASE_URL && process.env.CRM_E2E_STORAGE_STATE)) {
    process.stderr.write('NOT RUN: browser checks need CRM_E2E_BASE_URL and CRM_E2E_STORAGE_STATE\n');
    failed = true;
    continue;
  }
  process.stdout.write(`Checking ${name}\n`);
  const result = spawnSync('pnpm', args, { stdio: 'inherit', env: process.env });
  if (result.error || result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
