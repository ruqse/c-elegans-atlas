import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {root,sourceDir,readModel,classify} from './convert.mjs';

const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/atlas/manifest.json')));
const raw=fs.readFileSync(path.join(root,'public/atlas/geometry.bin'));
const buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
test('geometry checksum, gzip roundtrip, unique names, and valid buffer ranges',()=>{
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.sha256);
  assert.deepEqual(gunzipSync(fs.readFileSync(path.join(root,'public/atlas/geometry.bin.gz'))),raw);
  assert.equal(new Set(manifest.parts.map(p=>p.id)).size,manifest.parts.length);
  for(const p of manifest.parts){
    assert.equal(p.indexCount%3,0);assert(p.vertexCount>0);
    const positions=new Float32Array(buffer,p.positionOffset,p.vertexCount*3);
    const normals=new Float32Array(buffer,p.normalOffset,p.vertexCount*3);
    const indices=new Uint32Array(buffer,p.indexOffset,p.indexCount);
    assert(positions.every(Number.isFinite));assert(normals.every(Number.isFinite));assert(indices.every(i=>i<p.vertexCount));
    for(let j=0;j<positions.length;j++)assert(positions[j]>=p.bounds[0][j%3]&&positions[j]<=p.bounds[1][j%3]);
  }
});
test('every output triangle has exactly the original decoded positions and normals, in order',()=>{
  const legacy=vm.createContext({Float32Array,Uint16Array});
  vm.runInContext(fs.readFileSync(path.join(sourceDir,'legacy-loader.js'),'utf8'),legacy,{timeout:1000});
  const model=readModel(),decoded=new Map();
  for(const [file,entries] of Object.entries(model.urls)){
    const text=fs.readFileSync(path.join(sourceDir,file),'utf8');
    entries.forEach((entry,index)=>legacy.decompressMesh(text,entry,model.decodeParams,(attrs,indices)=>decoded.set(`${file}:${index}`,{attrs,indices,entry})));
  }
  let compared=0;const used=new Set();
  for(const p of manifest.parts){
    const positions=new Float32Array(buffer,p.positionOffset,p.vertexCount*3),normals=new Float32Array(buffer,p.normalOffset,p.vertexCount*3),indices=new Uint32Array(buffer,p.indexOffset,p.indexCount);
    let cursor=0;
    for(const segment of p.segments){
      const key=`${segment.file}:${segment.entry}`,d=decoded.get(key);assert(d);
      assert.equal(d.entry.names[segment.slot],p.sourceName);assert.equal(d.entry.material,p.material);
      const unique=`${key}:${segment.slot}`;assert(!used.has(unique));used.add(unique);
      for(let i=0;i<segment.indexCount;i++){
        const original=d.indices[segment.indexStart+i],converted=indices[cursor++];
        for(let c=0;c<3;c++){
          assert.equal(positions[converted*3+c],d.attrs[original*8+c]);
          assert.equal(normals[converted*3+c],d.attrs[original*8+c+5]);
        }
        compared++;
      }
    }
    assert.equal(cursor,p.indexCount);
  }
  const expected=Object.values(model.urls).flat().reduce((s,e)=>s+e.names.length,0);
  assert.equal(used.size,expected);assert.equal(compared/3,manifest.summary.triangles);
});
test('source hashes detect changed or missing assets',()=>{
  const sources=JSON.parse(fs.readFileSync(path.join(root,'public/atlas/source-files.json')));
  for(const file of sources.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceDir,file.file))).digest('hex'),file.sha256);
});
test('classification retains shared muscles and flags legacy exceptions',()=>{
  assert.deepEqual(classify('vm1l_ant','vulval_muscle').systems,['muscular','reproductive']);
  assert.deepEqual(classify('pm1','odd').systems,['muscular','digestive']);
  assert.deepEqual(classify('xxxl','socketcell').systems,['other']);
  assert.throws(()=>classify('new','unknown'));
  assert.equal(manifest.parts.filter(p=>p.sourceName==='cuticle').length,1);
});
