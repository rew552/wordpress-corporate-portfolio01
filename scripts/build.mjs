import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DEMO_BASE = 'https://raw.githubusercontent.com/rew552/wordpress-corporate-portfolio01/main/demo/';
const BINARY_FILE_PATTERN = /\.(?:png|pdf)$/i;

const GENERATED_DEMO_FILES = new Set([
  'demo/launch.html',
  'demo/launch-blueprint.json',
  'demo/admin-launch-blueprint.json',
]);

const SOURCE_TREES = [
  { source: 'theme/yohaku', target: 'themes/yohaku' },
  { source: 'plugins/yohaku-demo-form', target: 'plugins/yohaku-demo-form' },
  { source: 'demo', target: 'yohaku-demo' },
];

function absolutePath(path) {
  return resolve(ROOT, path);
}

function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readBuffer(path) {
  return readFile(absolutePath(path));
}

async function readText(path) {
  return readFile(absolutePath(path), 'utf8');
}

async function walkSourceFiles(directory) {
  const files = [];
  const entries = await readdir(absolutePath(directory), { withFileTypes: true });

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const repositoryPath = `${directory}/${entry.name}`;

    if (GENERATED_DEMO_FILES.has(repositoryPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await walkSourceFiles(repositoryPath));
    } else {
      files.push(repositoryPath);
    }
  }

  return files;
}

async function collectPlaygroundPayload() {
  const files = {};
  const binary = [];

  for (const { source, target } of SOURCE_TREES) {
    for (const path of await walkSourceFiles(source)) {
      const targetPath = `${target}${path.slice(source.length)}`;
      const content = await readBuffer(path);

      if (BINARY_FILE_PATTERN.test(path)) {
        binary.push([targetPath, content.toString('base64')]);
      } else {
        files[targetPath] = content.toString('utf8');
      }
    }
  }

  return { files, binary };
}

function createBinaryWriterStep(binary) {
  const encodedBinary = Buffer.from(JSON.stringify(binary)).toString('base64');

  return {
    step: 'runPHP',
    code: `<?php foreach (json_decode(base64_decode("${encodedBinary}"), true) as $file) { file_put_contents("/wordpress/wp-content/" . $file[0], base64_decode($file[1])); }`,
  };
}

function createCanonicalBlueprint(payload) {
  return {
    $schema: 'https://playground.wordpress.net/blueprint-schema.json',
    meta: {
      title: 'Yohaku Works - WordPress Corporate Portfolio',
      author: 'Portfolio project',
      description: '自主制作・架空企業。公開サイトとCMS編集をそのまま体験できるWordPressポートフォリオ。',
    },
    preferredVersions: {
      php: '8.3',
      wp: 'latest',
    },
    landingPage: '/',
    login: true,
    steps: [
      { step: 'setSiteLanguage', language: 'ja' },
      {
        step: 'writeFiles',
        writeToPath: '/wordpress/wp-content',
        filesTree: {
          name: 'wp-content',
          files: payload.files,
        },
      },
      createBinaryWriterStep(payload.binary),
      { step: 'activateTheme', themeFolderName: 'yohaku' },
      { step: 'activatePlugin', pluginPath: 'yohaku-demo-form/yohaku-demo-form.php' },
      { step: 'runPHP', code: "<?php require '/wordpress/wp-content/yohaku-demo/setup.php';" },
    ],
  };
}

function createBootstrapCode(payload) {
  const archive = deflateSync(Buffer.from(JSON.stringify(payload)), { level: 9 }).toString('base64');

  return `<?php $payload = json_decode(gzuncompress(base64_decode('${archive}')), true, 512, JSON_THROW_ON_ERROR); foreach ($payload['files'] as $path=>$content) { $target='/wordpress/wp-content/'.$path; if (!is_dir(dirname($target))) { mkdir(dirname($target),0777,true); } file_put_contents($target,$content); } foreach ($payload['binary'] as $file) { $target='/wordpress/wp-content/'.$file[0]; if (!is_dir(dirname($target))) { mkdir(dirname($target),0777,true); } file_put_contents($target,base64_decode($file[1])); }`;
}

function createLaunchBlueprint(blueprint, payload, landingPage) {
  return {
    ...blueprint,
    landingPage,
    steps: [
      blueprint.steps[0],
      { step: 'runPHP', code: createBootstrapCode(payload) },
      ...blueprint.steps.slice(3),
    ],
  };
}

function createLaunchUrl(blueprintFile) {
  const url = new URL('https://playground.wordpress.net/');
  url.searchParams.set('blueprint-url', `${RAW_DEMO_BASE}${blueprintFile}`);
  return url.toString();
}

function renderLaunchPage(publicLaunchUrl, adminLaunchUrl) {
  return `<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Launch Yohaku Works</title>
<style>
body{font:18px/1.9 sans-serif;max-width:720px;margin:10vh auto;padding:24px;background:#f7f8f2;color:#163d35}
a{color:inherit;font-weight:700}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.actions a{border:1px solid #163d35;border-radius:4px;padding:10px 14px;text-decoration:none}
.actions a:first-child{background:#163d35;color:white}
</style>
<h1>余白ワークス</h1>
<p>自主制作 / 架空企業のWordPressデモ</p>
<div class="actions"><a href="${publicLaunchUrl}">公開サイトを見る →</a><a href="${adminLaunchUrl}">管理画面を試す ↗</a></div>
<p>ブラウザ上に専用環境を作成します。管理者として自動ログインします。</p>
</html>`;
}

async function writeGeneratedArtifacts(blueprint, launchBlueprint, adminLaunchBlueprint) {
  await mkdir(absolutePath('demo'), { recursive: true });
  await writeFile(absolutePath('blueprint.json'), formatJson(blueprint));
  await writeFile(absolutePath('demo/launch-blueprint.json'), formatJson(launchBlueprint));
  await writeFile(absolutePath('demo/admin-launch-blueprint.json'), formatJson(adminLaunchBlueprint));

  const publicLaunchUrl = createLaunchUrl('launch-blueprint.json');
  const adminLaunchUrl = createLaunchUrl('admin-launch-blueprint.json');
  const readmeTemplate = await readText('README.template.md');

  await writeFile(absolutePath('demo/launch.html'), renderLaunchPage(publicLaunchUrl, adminLaunchUrl));
  await writeFile(
    absolutePath('README.md'),
    readmeTemplate
      .replaceAll('{{LAUNCH_URL}}', publicLaunchUrl)
      .replaceAll('{{ADMIN_LAUNCH_URL}}', adminLaunchUrl)
  );
}

const payload = await collectPlaygroundPayload();
const blueprint = createCanonicalBlueprint(payload);
const launchBlueprint = createLaunchBlueprint(blueprint, payload, '/');
const adminLaunchBlueprint = createLaunchBlueprint(blueprint, payload, '/wp-admin/');

await writeGeneratedArtifacts(blueprint, launchBlueprint, adminLaunchBlueprint);

console.log('Built canonical Blueprint, public/admin launch Blueprints, launch page, and README.');
