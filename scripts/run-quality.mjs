import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const base = 'http://127.0.0.1:9400/';
const detached = process.platform !== 'win32';
const server = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  detached,
  shell: process.platform === 'win32',
});

const stopServer = () => {
  if (!server.pid || server.killed) return;
  try {
    if (detached) process.kill(-server.pid, 'SIGTERM');
    else server.kill('SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
};

process.on('SIGINT', () => { stopServer(); process.exit(130); });
process.on('SIGTERM', () => { stopServer(); process.exit(143); });

try {
  let ready = false;
  for (let attempt = 1; attempt <= 90; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(`Playground server exited before becoming ready (code ${server.exitCode}).`);
    }
    try {
      const response = await fetch(base, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
      if (response.status >= 200 && response.status < 500) {
        ready = true;
        console.log(`Playground ready: HTTP ${response.status}`);
        break;
      }
    } catch {
      // WordPress/PHP runtimes are downloaded on first start, so retries are expected.
    }
    await delay(2000);
  }
  if (!ready) throw new Error('Timed out waiting for the local Playground server.');

  const tests = spawn('npm', ['run', 'quality:browser'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const code = await new Promise((resolve, reject) => {
    tests.once('error', reject);
    tests.once('exit', resolve);
  });
  if (code !== 0) throw new Error(`Browser quality checks failed with exit code ${code}.`);
} finally {
  stopServer();
}
