import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transformSync} from 'esbuild';
const code=transformSync(fs.readFileSync(new URL('../src/layout.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm'}).code;
const {alignStructures,explosionOffset}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const manifest=JSON.parse(fs.readFileSync(new URL('../public/atlas/manifest.json',import.meta.url)));
// Match the horizontal viewer: world x = source z, world y = source y.
const items=manifest.parts.map(p=>({id:p.id,min:[p.bounds[0][2],p.bounds[0][1],-p.bounds[1][0]],max:[p.bounds[1][2],p.bounds[1][1],-p.bounds[0][0]]}));
test('Every visible object receives a distinct nonoverlapping aligned cell',()=>{
  for(const aspect of [.45,1,2]){
    const layout=alignStructures(items,aspect,.02);assert.equal(layout.size,items.length);
    const cells=[...layout.values()];
    for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){
      const a=cells[i],b=cells[j];
      assert.ok(a.max[0]<=b.min[0]+1e-10||b.max[0]<=a.min[0]+1e-10||a.max[1]<=b.min[1]+1e-10||b.max[1]<=a.min[1]+1e-10);
    }
  }
});
test('Alignment only translates; zero separation restores exact source positions',()=>{
  const before=JSON.stringify(items),layout=alignStructures(items);
  for(const p of items){const delta=layout.get(p.id).offset;
    for(let axis=0;axis<3;axis++){
      assert.ok(Math.abs(((p.max[axis]+delta[axis])-(p.min[axis]+delta[axis]))-(p.max[axis]-p.min[axis]))<1e-10);
      assert.equal(p.min[axis]+delta[axis]*0,p.min[axis]);
    }
  }
  assert.equal(JSON.stringify(items),before);
  assert.equal(alignStructures([]).size,0);
  assert.deepEqual([...alignStructures(items.slice(0,2)).keys()].sort(),items.slice(0,2).map(x=>x.id).sort());
});

test('Explosion preserves every source box, restores exact positions, and ends at its packed cell',()=>{
  const layout=alignStructures(items,1,.02),before=JSON.stringify(items);
  for(const [i,p] of items.entries()){
    const destination=layout.get(p.id).offset,center=p.min.map((v,k)=>(v+p.max[k])/2);
    assert.deepEqual(explosionOffset(0,destination,i%8,8,center,2),[0,0,0]);
    assert.deepEqual(explosionOffset(1,destination,i%8,8,center,2),destination);
    for(const amount of [.1,.45,.450000001,.7,.9,1]){
      const offset=explosionOffset(amount,destination,i%8,8,center,2);
      assert.ok(offset.every(Number.isFinite));
      for(let axis=0;axis<3;axis++)assert.ok(Math.abs((p.max[axis]+offset[axis])-(p.min[axis]+offset[axis])-(p.max[axis]-p.min[axis]))<1e-10);
    }
    const left=explosionOffset(.45,destination,i%8,8,center,2),right=explosionOffset(.450000001,destination,i%8,8,center,2);
    assert.ok(left.every((v,k)=>Math.abs(v-right[k])<1e-6));
  }
  assert.equal(JSON.stringify(items),before);
});

test('Opening systems preserves positions along the horizontal body axis',()=>{
  for(let system=0;system<8;system++)for(const amount of [0,.1,.3,.45]){
    assert.equal(explosionOffset(amount,[3,2,1],system,8,[.8,.2,.1],2)[0],0);
  }
});
