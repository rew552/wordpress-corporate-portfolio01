import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_FILES = new Set([
  'blueprint.json',
  'demo/launch-blueprint.json',
  'demo/admin-launch-blueprint.json',
]);
const BINARY_FILE_PATTERN = /\.(?:png|pdf)$/i;

async function read(path) {
  return readFile(resolve(ROOT, path), 'utf8');
}

async function walk(directory) {
  const files = [];
  const entries = await readdir(resolve(ROOT, directory), { withFileTypes: true });

  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;

    if (GENERATED_FILES.has(path) || BINARY_FILE_PATTERN.test(path)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else {
      files.push(path);
    }
  }

  return files;
}

const runtimeFiles = [
  ...(await walk('theme')),
  ...(await walk('plugins')),
  ...(await walk('demo/content')),
  'demo/setup.php',
];

const runtimeContents = new Map(
  await Promise.all(runtimeFiles.map(async (path) => [path, await read(path)]))
);

for (const [path, content] of runtimeContents) {
  assert(!/\b(?:TODO|FIXME|HACK)\b/.test(content), `Temporary marker found in ${path}`);
  assert(!/\bdebugger\s*;/.test(content), `Debugger statement found in ${path}`);
}

const formScript = runtimeContents.get('plugins/yohaku-demo-form/form.js');
for (const forbidden of [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\.innerHTML\b/,
  /\bdocument\.write\s*\(/,
  /\beval\s*\(/,
]) {
  assert(!forbidden.test(formScript), `Demo form must not use ${forbidden}`);
}
assert(formScript.includes('event.preventDefault()'), 'Demo form must cancel native submission');
assert(formScript.includes('status.textContent'), 'Demo form must render status as text, not HTML');

const themePhp = runtimeContents.get('theme/yohaku/functions.php');
const pluginPhp = runtimeContents.get('plugins/yohaku-demo-form/yohaku-demo-form.php');
const setupPhp = runtimeContents.get('demo/setup.php');
const runtimePhp = `${themePhp}\n${pluginPhp}\n${setupPhp}`;

assert(!/\$_(?:GET|POST|REQUEST|COOKIE|FILES)\s*\[/.test(runtimePhp), 'Runtime PHP must not process request globals');
assert(!/\b(?:wp_ajax_|admin_post_|register_rest_route)\b/.test(runtimePhp), 'Unexpected request endpoint found');
assert(themePhp.includes('esc_html__'), 'Theme skip-link text must be escaped');
assert(themePhp.includes('esc_attr'), 'Theme metadata attributes must be escaped');
assert(themePhp.includes('esc_url'), 'Theme metadata URLs must be escaped');
assert(pluginPhp.includes("current_user_can('edit_pages')"), 'Editor-only demo affordances need a capability check');
assert(pluginPhp.includes('esc_url'), 'Plugin output URLs must be escaped');
assert(pluginPhp.includes('no nonce or server-side request handler'), 'Non-submitting form security rationale must stay explicit');
assert(setupPhp.includes("require_once '/wordpress/wp-load.php'"), 'Playground seed must bootstrap WordPress explicitly');
assert(setupPhp.includes('JSON_THROW_ON_ERROR'), 'Seed JSON parsing must fail loudly on invalid content');

const publicTextFiles = [
  ...runtimeFiles,
  'README.md',
  'scripts/build.mjs',
  'scripts/validate.mjs',
  '.gitignore',
];

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token)\b\s*[:=]\s*['"][^'"]{8,}/i,
  /\/Users\/[^/\s]+\//,
  /[A-Za-z]:\\Users\\[^\\\s]+\\/,
  /[A-Za-z0-9._%+-]+@gmail\.com/i,
];

for (const path of publicTextFiles) {
  const content = runtimeContents.get(path) ?? await read(path);
  for (const pattern of secretPatterns) {
    assert(!pattern.test(content), `Potential private information found in ${path}: ${pattern}`);
  }
}

const buildScript = await read('scripts/build.mjs');
for (const generatedPath of GENERATED_FILES) {
  if (generatedPath === 'blueprint.json') continue;
  assert(buildScript.includes(generatedPath), `Build script must identify generated artifact: ${generatedPath}`);
}
assert(!buildScript.includes('README.template.md'), 'README must remain a directly edited source file');
assert(!buildScript.includes("writeFile(absolutePath('README.md')"), 'Build must not overwrite README.md');

console.log('PASS: public-source hygiene, demo security boundaries, capability checks, escaping, and generated/source separation.');
