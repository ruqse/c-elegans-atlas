// Build in memory, publish immutable bundles, then replace HTML atomically.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const esbuild=require('esbuild');
process.chdir(path.resolve(__dirname,'..'));
const result=esbuild.buildSync({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'esm',target:'es2022',outdir:'dist/assets',entryNames:'atlas',write:false,define:{'process.env.NODE_ENV':'"production"'}});
fs.mkdirSync('dist/assets',{recursive:true});
const outputs={};
for(const file of result.outputFiles){
  const ext=path.extname(file.path),hash=crypto.createHash('sha256').update(file.contents).digest('hex').slice(0,12);
  const name=`atlas-${hash}${ext}`,temp=`dist/assets/.${name}.${process.pid}.tmp`;
  fs.writeFileSync(temp,file.contents);fs.renameSync(temp,`dist/assets/${name}`);outputs[ext]=name;
}
fs.cpSync('public','dist',{recursive:true,mode:fs.constants.COPYFILE_FICLONE,filter:(src,dest)=>{
  const source=fs.statSync(src);if(!source.isFile()||!fs.existsSync(dest))return true;
  const target=fs.statSync(dest);return source.size!==target.size||source.mtimeMs>target.mtimeMs;
}});
const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C. elegans Atlas</title><link rel="stylesheet" href="./assets/${outputs['.css']}"></head><body><div id="root"></div><script type="module" src="./assets/${outputs['.js']}"></script></body></html>`;
const temp=`dist/.index-${process.pid}.html`;fs.writeFileSync(temp,html);fs.renameSync(temp,'dist/index.html');
console.log('Static atlas built in dist/',outputs);
