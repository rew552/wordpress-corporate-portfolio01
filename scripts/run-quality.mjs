import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const detached = process.platform !== 'win32';
const server = spawn('npm', ['run', 'start'], {
  stdio: ['ignore', 'pipe', 'pipe'],
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

const readyPattern = /Ready! WordPress is running on http:\/\/127\.0\.0\.1:9400/;
let output = '';
let resolveReady;
let rejectReady;
const ready = new Promise((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});

const forward = (stream, target) => {
  stream.on('data', (chunk) => {
    target.write(chunk);
    output = (output + chunk.toString()).slice(-8192);
    if (readyPattern.test(output)) resolveReady();
  });
};

forward(server.stdout, process.stdout);
forward(server.stderr, process.stderr);
server.once('error', rejectReady);
server.once('exit', (code) => {
  if (!readyPattern.test(output)) {
    rejectReady(new Error(`Playground server exited before becoming ready (code ${code}).`));
  }
});

try {
  await Promise.race([
    ready,
    delay(120000).then(() => {
      throw new Error('Timed out waiting for wp-playground-cli readiness.');
    }),
  ]);

  console.log('Playground ready: wp-playground-cli reported the running WordPress URL.');
  await delay(1500);

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
