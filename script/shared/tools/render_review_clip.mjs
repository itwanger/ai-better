// Bounded diagnostic excerpt only, never the full episode/export path.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(workspace,'package.json'));
const {bundle}=require('@remotion/bundler');
const {openBrowser,selectComposition,renderMedia}=require('@remotion/renderer');
const {values:v}=parseArgs({options:{project:{type:'string'},composition:{type:'string'},out:{type:'string'},from:{type:'string'},to:{type:'string'}}});
if(!v.project||!v.composition||!v.out)throw new Error('Need --project --composition --out --from --to');
const root=path.join(path.resolve(v.project),'remotion');
const url=await bundle({entryPoint:path.join(root,'src/Root.tsx'),rootDir:root,publicDir:path.join(root,'public')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
  const composition=await selectComposition({serveUrl:url,id:v.composition,puppeteerInstance:browser});
  const from=Number(v.from),to=Number(v.to);
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>=composition.durationInFrames||to-from>=composition.fps*12)throw new Error('Review clips must be valid and <=12 seconds');
  fs.mkdirSync(path.dirname(path.resolve(v.out)),{recursive:true});
  await renderMedia({serveUrl:url,composition,frameRange:[from,to],codec:'h264',scale:.5,
    concurrency:2,puppeteerInstance:browser,outputLocation:path.resolve(v.out),logLevel:'error'});
}finally{await browser.close({silent:true});}
console.log(v.out);
