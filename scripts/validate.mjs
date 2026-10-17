import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(resolve(root,p),'utf8');
const blueprint = JSON.parse(await read('blueprint.json'));
const schemaPath = resolve(dirname(require.resolve('@wp-playground/blueprints')), 'blueprint-schema.json');
const validate = new Ajv({strict:false,allErrors:true}).compile(JSON.parse(await readFile(schemaPath,'utf8')));
assert(validate(blueprint),JSON.stringify(validate.errors,null,2));
const readme = await read('README.md');
const launch = readme.match(/\[公開サイトを体験する →\]\(([^)]+)\)/)?.[1];
const adminLaunch = readme.match(/\[CMS管理画面を試す ↗\]\(([^)]+)\)/)?.[1];
assert(launch,'Public Launch link missing');
assert(adminLaunch,'Admin Launch link missing');
const rawBase='https://raw.githubusercontent.com/rew552/wordpress-corporate-portfolio01/main/demo/';
for (const [value,file] of [[launch,'launch-blueprint.json'],[adminLaunch,'admin-launch-blueprint.json']]) {
 const url = new URL(value);
 assert.equal(url.origin,'https://playground.wordpress.net');
 assert.equal(url.searchParams.get('blueprint-url'),rawBase+file);
 assert(value.length<512,'Launch link should stay short enough for GitHub Markdown');
}
const launchBlueprint = JSON.parse(await read('demo/launch-blueprint.json'));
const adminLaunchBlueprint = JSON.parse(await read('demo/admin-launch-blueprint.json'));
assert(validate(launchBlueprint),JSON.stringify(validate.errors,null,2));
assert(validate(adminLaunchBlueprint),JSON.stringify(validate.errors,null,2));
assert.equal(launchBlueprint.landingPage,'/');
assert.equal(adminLaunchBlueprint.landingPage,'/wp-admin/');
assert.deepEqual(adminLaunchBlueprint.steps,launchBlueprint.steps);
const compressed = launchBlueprint.steps[1].code.match(/base64_decode\('([^']+)'\)/)[1];
const payload = JSON.parse(inflateSync(Buffer.from(compressed,'base64')).toString('utf8'));
assert.deepEqual(payload.files,blueprint.steps.find(s=>s.step==='writeFiles').filesTree.files);
const binaryCode=blueprint.steps.find(s=>s.step==='runPHP').code;
const canonicalBinary=JSON.parse(Buffer.from(binaryCode.match(/base64_decode\("([^" ]+)"\)/)[1],'base64').toString('utf8'));
assert.deepEqual(payload.binary,canonicalBinary);
assert.deepEqual(launchBlueprint.steps.slice(2),blueprint.steps.slice(3));
assert.deepEqual(launchBlueprint.preferredVersions,blueprint.preferredVersions);
assert((await read('demo/launch.html')).includes(launch));
assert((await read('demo/launch.html')).includes(adminLaunch));
assert.equal(JSON.parse(await read('theme/yohaku/theme.json')).version,3);
for(const path of ['docs/requirements.md','docs/design.md','docs/test-checklist.md','docs/publishing.md','.gitignore','LICENSE']) assert((await read(path)).trim());
assert(readme.includes('自主制作'));
assert(readme.includes('screenshots/playground-admin.png'));
assert(readme.includes('管理画面から文章・画像・お知らせ・ナビゲーションを更新'));
const home = await read('demo/content/home.html');
const css = await read('theme/yohaku/assets/site.css');
const qualityCss = await read('theme/yohaku/assets/quality-polish.css');
const functions = await read('theme/yohaku/functions.php');
const plugin = await read('plugins/yohaku-demo-form/yohaku-demo-form.php');
const demoCss = await read('plugins/yohaku-demo-form/demo.css');
const company = await read('demo/content/company.html');
const resources = await read('demo/content/resources.html');
const single = await read('theme/yohaku/templates/single.html');
const servicePattern = await read('theme/yohaku/patterns/services.php');
const qualityScript = await read('scripts/quality.mjs');
const workflow = await read('.github/workflows/issue-1-build.yml');
assert(home.includes('id="cms-demo"'));
assert(home.includes('{{ADMIN}}site-editor.php'));
assert(css.includes('text-wrap:balance'));
assert(css.includes('.cms-demo'));
assert(plugin.includes('portfolio-demo-bar'));
assert(plugin.includes('yohaku_demo_guide'));
assert((await read('theme/yohaku/assets/favicon.svg')).includes('<svg'));
assert((await read('theme/yohaku/assets/og-image.svg')).includes('1200'));

/* Issue #4 visual-system regression guards. */
for (const primitive of ['section-shell','section-header','split-grid','content-measure','wide-content']) {
 assert(css.includes(`.${primitive}`),`Missing layout primitive: ${primitive}`);
 assert(home.includes(primitive),`Home does not use layout primitive: ${primitive}`);
}
assert(!/max-width\s*:[^;{}]*ch\b/i.test(css),'Do not use ch for Japanese max-width');
assert(home.indexOf('02 / OUR APPROACH') < home.indexOf('06 / CMS DEMO'),'CMS demo must stay after the corporate story');
assert(home.includes('news-featured') && home.includes('news-compact'),'Editorial News layout missing');
assert(home.includes('DEMO CASE'),'Demo case section missing');

/* Issue #6 finishing-quality regression guards. */
assert(qualityCss.includes('overflow-wrap:normal'),'Issue #6 must neutralize global anywhere wrapping');
assert(qualityCss.includes('@media(max-width:1023px)') && qualityCss.includes('@media(max-width:767px)'),'Unified tablet/mobile breakpoints missing');
assert(!demoCss.includes('@media(max-width:760px)'),'Demo Bar must not keep the legacy 760px breakpoint');
assert(demoCss.includes('@media(max-width:767px)'),'Demo Bar must share the mobile breakpoint');
assert(qualityCss.includes('.skip-link') && functions.includes('本文へスキップ'),'Skip link implementation missing');
assert(functions.includes('id="main-content"'),'Stable main landmark target missing');
assert(qualityCss.includes('aria-current="page"'),'Current navigation state style missing');
assert(servicePattern.includes('service-row__title-link'),'Service title link target missing');
assert(servicePattern.includes('"lock":{"move":true,"remove":true}'),'Service pattern structure lock missing');
assert(company.includes('company-profile__row') && company.includes('company-stance'),'Editorial Company layout missing');
assert(resources.includes('resource-card') && resources.includes('PASSWORD PROTECTED / DEMO'),'Resource card layout missing');
assert(single.includes('post-meta') && single.includes('post-body') && single.includes('post-navigation'),'Single post editorial layout missing');
assert(qualityScript.includes('599, 600, 601') && qualityScript.includes('781, 782, 783') && qualityScript.includes('1023, 1024'),'Breakpoint boundary coverage missing');
assert(qualityScript.includes('axeWidths = [390, 820, 1440]'),'Mobile/tablet/desktop axe coverage missing');
assert(qualityScript.includes('visual-baseline.json') && qualityScript.includes('createHash'),'Visual screenshot regression guard missing');
assert(!workflow.includes('Commit refreshed screenshots'),'CI must not auto-accept screenshot baselines');
assert(workflow.includes('visual-regression-actual'),'Visual regression evidence artifact missing');

console.log('PASS: Blueprint schema, Playground artifacts, CMS affordances, Issue #4 layout primitives, Issue #6 responsive/a11y/CMS/visual-regression guards, visual assets, and required documentation.');
