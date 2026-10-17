import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(resolve(root,p));
async function walk(dir) {
 const out=[];
 for(const item of (await readdir(resolve(root,dir),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
  const path=dir+'/'+item.name;
  if(['demo/launch.html','demo/launch-blueprint.json'].includes(path)) continue;
  if(item.isDirectory()) out.push(...await walk(path)); else out.push(path);
 }
 return out;
}
const files = {};
const binary = [];
for(const [source,target] of [['theme/yohaku','themes/yohaku'],['plugins/yohaku-demo-form','plugins/yohaku-demo-form'],['demo','yohaku-demo']]) {
 for(const path of await walk(source)) {
  const relative=target+path.slice(source.length);
  const content=await read(path);
  if(/\.(png|pdf)$/.test(path)) binary.push([relative,content.toString('base64')]);
  else files[relative]=content.toString('utf8');
 }
}
const blueprint = {
 $schema:'https://playground.wordpress.net/blueprint-schema.json',
 meta:{title:'Yohaku Works - WordPress Corporate Portfolio',author:'Portfolio project',description:'自主制作・架空企業。標準ブロックテーマと編集可能なデモ。'},
 preferredVersions:{php:'8.3',wp:'latest'},
 landingPage:'/',login:true,
 steps:[
  {step:'setSiteLanguage',language:'ja'},
  {step:'writeFiles',writeToPath:'/wordpress/wp-content',filesTree:{name:'wp-content',files}},
  {step:'runPHP',code:'<?php foreach (json_decode(base64_decode("'+Buffer.from(JSON.stringify(binary)).toString('base64')+'"), true) as $file) { file_put_contents("/wordpress/wp-content/" . $file[0], base64_decode($file[1])); }'},
  {step:'activateTheme',themeFolderName:'yohaku'},
  {step:'activatePlugin',pluginPath:'yohaku-demo-form/yohaku-demo-form.php'},
  {step:'runPHP',code:"<?php require '/wordpress/wp-content/yohaku-demo/setup.php';"}
 ]
};
await writeFile(resolve(root,'blueprint.json'),JSON.stringify(blueprint,null,2)+'\n');
// GitHub sanitizes very long hrefs. Compress only the transport payload;
// readable blueprint.json remains the canonical CLI/debug artifact.
const archive = deflateSync(Buffer.from(JSON.stringify({files,binary})),{level:9}).toString('base64');
const bootstrap = "<?php $payload = json_decode(gzuncompress(base64_decode('"+archive+"')), true, 512, JSON_THROW_ON_ERROR); foreach ($payload['files'] as $path=>$content) { $target='/wordpress/wp-content/'.$path; if (!is_dir(dirname($target))) { mkdir(dirname($target),0777,true); } file_put_contents($target,$content); } foreach ($payload['binary'] as $file) { $target='/wordpress/wp-content/'.$file[0]; if (!is_dir(dirname($target))) { mkdir(dirname($target),0777,true); } file_put_contents($target,base64_decode($file[1])); }";
const launchBlueprint = {...blueprint,steps:[blueprint.steps[0],{step:'runPHP',code:bootstrap},...blueprint.steps.slice(3)]};
await writeFile(resolve(root,'demo/launch-blueprint.json'),JSON.stringify(launchBlueprint,null,2)+'\n');
const launch='https://playground.wordpress.net/#'+encodeURIComponent(JSON.stringify(launchBlueprint)).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
if(launch.length>32000) throw new Error('Launch URL exceeds the verified GitHub link budget.');
await mkdir(resolve(root,'demo'),{recursive:true});
await writeFile(resolve(root,'demo/launch.html'),'<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Launch Yohaku Works</title><style>body{font:18px/1.9 sans-serif;max-width:680px;margin:12vh auto;padding:24px;background:#f7f8f2;color:#163d35}a{color:inherit}</style><h1>余白ワークス</h1><p>自主制作 / 架空企業のWordPressデモ</p><p><a href="'+launch+'">Launch in WordPress Playground →</a></p><p>ブラウザ上に専用環境を作成します。管理画面への自動ログイン付き。起動には数十秒〜数分かかる場合があります。</p></html>');
const readme=await read(resolve(root,'README.template.md')).then(b=>b.toString());
await writeFile(resolve(root,'README.md'),readme.replace('{{LAUNCH_URL}}',launch));
console.log('Built standalone Blueprint and launch links. '+Buffer.byteLength(launch)+' URL bytes.');
