// Keep the upload compact; restore the exact uncompressed fallback during build.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../public/atlas');
const atlas=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const bytes=zlib.gunzipSync(fs.readFileSync(path.join(root,atlas.gzip)));
const hash=crypto.createHash('sha256').update(bytes).digest('hex');
if(bytes.length!==atlas.summary.bytes||hash!==atlas.sha256)throw new Error('Geometry does not match the validated manifest.');
const target=path.join(root,atlas.geometry);
if(!fs.existsSync(target)||crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')!==hash)fs.writeFileSync(target,bytes);
console.log('Verified original geometry:',bytes.length,'bytes; SHA-256',hash);
