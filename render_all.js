const canvasMod = require('@napi-rs/canvas');
const { createCanvas } = canvasMod;
global.Path2D = canvasMod.Path2D;
global.Image = canvasMod.Image || function(){};
const fs = require('fs');
const path = require('path');

function makeCanvas(w=10,h=10){ const c=createCanvas(w,h); c.style={}; return c; }

const document = {
  _els: {},
  createElement(tag){ if(tag==='canvas') return makeCanvas(); const el={tagName:tag, style:{}, hidden:false, children:[], appendChild(x){this.children.push(x);}, after(){}, prepend(){}, setAttribute(){}, getContext(){return null;} }; return el; },
  getElementById(id){ if(!this._els[id]){ const c=makeCanvas(); c.id=id; this._els[id]=c; } return this._els[id]; },
  querySelectorAll(){ return []; },
  querySelector(){ return null; },
  body: { style:{}, appendChild(){}, prepend(){} },
  head: { appendChild(){} },
  fonts: { ready: Promise.resolve() },
};
global.document = document;
global.location = { search: '?bare=1&frame=0' };
global.navigator = {};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.window = global;

const filmPath = process.argv[2];
const outDir = process.argv[3] || '/home/user/VOE/out';
const html = fs.readFileSync(filmPath, 'utf8');
const dir = path.dirname(path.resolve(filmPath));
// inline every <script src> in order, and every inline script, as one program
const parts = [];
const tagRe = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m;
while ((m = tagRe.exec(html)) !== null) {
  const attrs = m[1], code = m[2];
  const src = /src\s*=\s*["']([^"']+)["']/.exec(attrs);
  if (src) parts.push(fs.readFileSync(path.resolve(dir, src[1]), 'utf8'));
  else if (code.trim()) parts.push(code);
}
const combined = parts.join('\n;\n');
new Function(combined)();

const wait = () => new Promise((resolve) => {
  const check = () => { if (global.__ready) resolve(); else setTimeout(check, 50); };
  check();
});
wait().then(async () => {
  const N = global.__NDRAW;
  const fps = global.__fps;
  console.log('READY', N, fps, global.__size);
  fs.mkdirSync(outDir, {recursive:true});
  const framesDir = outDir + '/frames';
  fs.mkdirSync(framesDir, {recursive:true});
  const onlyArg = process.argv[4];
  const only = onlyArg ? onlyArg.split(',').map(Number) : null;
  const list = only || Array.from({length:N},(_,i)=>i);
  for (const i of list) {
    const dataUrl = global.__frame(i);
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(framesDir + '/' + String(i).padStart(4,'0') + '.png', buf);
    if (!only && i % 20 === 0) console.log('rendered', i, '/', N);
  }
  // wav if available
  if (global.__wav) {
    try {
      const b64 = await global.__wav();
      if (b64) fs.writeFileSync(outDir + '/score.wav', Buffer.from(b64, 'base64'));
    } catch(e) { console.log('wav err', e.message); }
  }
  fs.writeFileSync(outDir + '/meta.json', JSON.stringify({N, fps, size: global.__size}, null, 2));
  console.log('DONE');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
