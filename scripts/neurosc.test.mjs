import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const root=new URL('../public/neurosc/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root)));
test('All archived NeuroSC files match their source snapshot and have self-contained buffers',()=>{
  for(const dataset of catalog.datasets){
    const api=JSON.parse(fs.readFileSync(new URL(`${dataset.timepoint}/source-api.json`,root)));
    assert.deepEqual(dataset.objects.map(o=>o.uid),api.map(o=>o.uid));
    assert.equal(new Set(dataset.objects.map(o=>o.uid)).size,dataset.objects.length);
    for(const o of dataset.objects){
      const raw=fs.readFileSync(new URL(`${dataset.timepoint}/${o.filename}`,root));
      assert.equal(raw.length,o.bytes);assert.equal(createHash('sha256').update(raw).digest('hex'),o.sha256);
      const gltf=JSON.parse(raw);assert.equal(gltf.asset.version,'2.0');
      for(const b of gltf.buffers)assert.ok(b.uri.startsWith('data:'));
      assert.ok(!gltf.images);assert.ok(gltf.meshes.length>0);
    }
  }
});
test('Every archived Draco mesh decodes with finite positions and valid triangle indices',async()=>{
  const module={exports:{}};
  const wrapper=fs.readFileSync(new URL('../public/draco/draco_wasm_wrapper.js',import.meta.url),'utf8');
  new Function('module','exports','require','__dirname',wrapper)(module,module.exports,createRequire(import.meta.url),'/tmp');
  const d=await module.exports({wasmBinary:fs.readFileSync(new URL('../public/draco/draco_decoder.wasm',import.meta.url))});
  const decoder=new d.Decoder();let triangles=0,vertices=0,accessorCountDifferences=0;
  for(const dataset of catalog.datasets)for(const o of dataset.objects){
    const g=JSON.parse(fs.readFileSync(new URL(`${dataset.timepoint}/${o.filename}`,root)));
    for(const m of g.meshes)for(const p of m.primitives){
      const e=p.extensions.KHR_draco_mesh_compression,bv=g.bufferViews[e.bufferView];
      const bytes=Buffer.from(g.buffers[bv.buffer].uri.split(',')[1],'base64').subarray(bv.byteOffset||0,(bv.byteOffset||0)+bv.byteLength);
      const b=new d.DecoderBuffer();b.Init(bytes,bytes.length);const mesh=new d.Mesh();
      const status=decoder.DecodeBufferToMesh(b,mesh);assert.ok(status.ok(),o.uid);
      const attr=decoder.GetAttributeByUniqueId(mesh,e.attributes.POSITION),positions=new d.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(mesh,attr,positions);
      assert.equal(positions.size(),mesh.num_points()*3);
      for(let i=0;i<positions.size();i++)assert.ok(Number.isFinite(positions.GetValue(i)),o.uid);
      const face=new d.DracoInt32Array();
      for(let i=0;i<mesh.num_faces();i++){decoder.GetFaceFromMesh(mesh,i,face);for(let j=0;j<3;j++)assert.ok(face.GetValue(j)>=0&&face.GetValue(j)<mesh.num_points(),o.uid);}
      if(g.accessors[p.attributes.POSITION].count!==mesh.num_points())accessorCountDifferences++;
      triangles+=mesh.num_faces();vertices+=mesh.num_points();
      for(const obj of [face,positions,mesh,b])d.destroy(obj);
    }
  }
  d.destroy(decoder);
  const result={date:'2026-09-05',objects:catalog.datasets.reduce((n,x)=>n+x.objects.length,0),triangles,vertices,accessorCountDifferences,note:'Counts are decoded source geometry inventory, not biological cell counts. Upstream accessor counts may differ from Draco output; rendering uses decoded topology.'};
  fs.writeFileSync(new URL('validation.json',root),JSON.stringify(result,null,2)+'\n');
  console.log(result);
});
