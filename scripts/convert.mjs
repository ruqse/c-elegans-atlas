import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const sourceDir=path.join(root,'data/source');
export const commit='937839d19f505d0dff9aebb1e3bc69f7855942a8';
export const sourceUrl=`https://github.com/openworm/wormbrowser/blob/${commit}/org.openworm.wormbrowser/war/models/Virtual_Worm/`;
export function readModel(){
  const context=vm.createContext({MODELS:{}});
  vm.runInContext(fs.readFileSync(path.join(sourceDir,'Virtual_Worm_February_2012.js'),'utf8'),context,{timeout:1000});
  return Object.values(context.MODELS)[0];
}
// Independent implementation of the documented legacy delta/zigzag and high-watermark formats.
export function decode(text,entry,params){
  const count=entry.attribRange[1], attrs=new Float32Array(count*8);
  let cursor=entry.attribRange[0];
  for(let component=0;component<8;component++){
    let previous=0;
    for(let vertex=0;vertex<count;vertex++){
      const code=text.charCodeAt(cursor++); assert(Number.isFinite(code),'Truncated vertex stream');
      previous+=(code>>>1)^-(code&1);
      attrs[vertex*8+component]=(previous+params.decodeOffsets[component])*params.decodeScales[component];
    }
  }
  assert.equal(cursor,entry.indexRange[0],'Unexpected index offset');
  const indices=new Uint32Array(entry.indexRange[1]*3); let highest=0;
  for(let i=0;i<indices.length;i++){
    const code=text.charCodeAt(cursor++); assert(Number.isFinite(code),'Truncated index stream');
    const value=highest-code; assert(value>=0&&value<count,'Index out of range');
    indices[i]=value; if(code===0)highest++;
  }
  return {attrs,indices};
}

const groups={
  arcade_cells:['Arcade cells',['digestive']], body_wall_muscle:['Body-wall muscles',['muscular']],
  coelomocyte:['Coelomocytes',['coelomocytes']], 'dtc_&_somatic_gonad':['Gonadal sheath and distal tip cells',['reproductive']],
  even:['Pharyngeal muscles (even source group)',['muscular','digestive']], odd:['Pharyngeal muscles (odd source group)',['muscular','digestive']],
  excretory_cell:['Excretory cell',['excretory']], excretory_duct_cell:['Excretory duct',['excretory']],
  excretory_gland_cells:['Excretory gland',['excretory']], excretory_pore_cell:['Excretory pore',['excretory']],
  germline:['Germ line',['reproductive']], glr_cells:['GLR cells',['other']],head_mesodermal_cell:['Head mesodermal cell',['other']],
  hypodermis:['Hypodermis',['surface']],seam_cell:['Seam cells',['surface']],
  interneuron:['Neurons (legacy interneuron group)',['nervous']],motor_neuron:['Neurons (legacy motor group)',['nervous']],
  neurunkfunc:['Neurons (legacy unclassified group)',['nervous']], polymodalneuron:['Neurons (legacy polymodal group)',['nervous']],
  sensoryneuron:['Neurons (legacy sensory group)',['nervous']],temp_drg_color:['Neurons (legacy temporary group)',['nervous']],
  intestine:['Intestine',['digestive']], marginal_cells:['Pharyngeal marginal cells',['digestive']],
  'phary_&_rect_glands':['Pharyngeal and rectal glands',['digestive']],pharyngeal_epithelium:['Pharyngeal epithelium',['digestive']],
  rectal_epithelium:['Rectal epithelium',['digestive']],sheathother:['Sheath cells',['nervous']],socketcell:['Socket-cell source group',['nervous']],
  spermath_uterin_valve:['Spermatheca–uterine valves',['reproductive']],spermatheca:['Spermathecae',['reproductive']],
  'sphnc_&_anal_dep_musc':['Sphincter and anal depressor muscles',['muscular','digestive']],stomatoint_muscle:['Stomatointestinal muscles',['muscular','digestive']],
  uterine_muscle:['Uterine muscles',['muscular','reproductive']],uterus:['Uterus',['reproductive']],
  'vpi_&_vir':['Alimentary valves',['digestive']],vulva_epithelium:['Vulval epithelium',['reproductive']],vulval_muscle:['Vulval muscles',['muscular','reproductive']]
};
export function classify(name,material){
  assert(groups[material],`Unmapped material: ${material}`);
  let [group,systems]=groups[material];
  // Explicit exceptions; never interpret the old material names as a current cell-function ontology.
  if(name==='cuticle')group='Cuticle';
  if(name==='anus')group='Anus (legacy pharyngeal-epithelium material)';
  if(name==='xxxl'||name==='xxxr'){group='XXX cells (legacy socket-cell material)';systems=['other'];}
  const isNeuron=['interneuron','motor_neuron','neurunkfunc','polymodalneuron','sensoryneuron','temp_drg_color'].includes(material);
  return {group,systems,isNeuron};
}

export function convert(){
  const model=readModel(),objects=new Map(),sourceFiles=[],out=path.join(root,'public/atlas');
  let segments=0,totalTriangles=0;
  for(const [file,entries] of Object.entries(model.urls)){
    const bytes=fs.readFileSync(path.join(sourceDir,file)),text=bytes.toString('utf8');
    sourceFiles.push({file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
    for(const [entryIndex,entry] of entries.entries()){
      const {attrs,indices}=decode(text,entry,model.decodeParams);
      assert.equal(entry.lengths.reduce((a,b)=>a+b,0),indices.length);
      let start=0;
      for(const [j,name] of entry.names.entries()){
        let object=objects.get(name);
        if(!object){object={id:name,name:classify(name,entry.material).isNeuron?name.toUpperCase():name.replaceAll('_',' '),sourceName:name,material:entry.material,...classify(name,entry.material),positions:[],normals:[],indices:[],segments:[],bounds:[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]]};objects.set(name,object);}
        assert.equal(object.material,entry.material,'Source name has conflicting materials');
        const remap=new Map(),indexCount=entry.lengths[j];
        object.segments.push({file,entry:entryIndex,slot:j,indexStart:start,indexCount});segments++;
        for(let k=start;k<start+indexCount;k++){
          const old=indices[k]; let next=remap.get(old);
          if(next===undefined){
            next=object.positions.length/3;remap.set(old,next);
            for(let c=0;c<3;c++){
              const p=attrs[old*8+c]; assert(Number.isFinite(p));
              object.positions.push(p);object.normals.push(attrs[old*8+c+5]);
              object.bounds[0][c]=Math.min(object.bounds[0][c],p);object.bounds[1][c]=Math.max(object.bounds[1][c],p);
            }
          }
          object.indices.push(next);
        }
        start+=indexCount;totalTriangles+=indexCount/3;
      }
    }
  }
  const buffers=[],parts=[];let offset=0;
  for(const obj of objects.values()){
    const {positions,normals,indices,...meta}=obj;
    const p=new Float32Array(positions),n=new Float32Array(normals),i=new Uint32Array(indices);
    parts.push({...meta,positionOffset:offset,normalOffset:offset+p.byteLength,indexOffset:offset+p.byteLength+n.byteLength,vertexCount:p.length/3,indexCount:i.length});
    for(const v of [p,n,i]){buffers.push(Buffer.from(v.buffer));offset+=v.byteLength;}
  }
  const buffer=Buffer.concat(buffers),compressed=gzipSync(buffer,{level:9});fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'geometry.bin'),buffer);fs.writeFileSync(path.join(out,'geometry.bin.gz'),compressed);
  const summary={objects:parts.length,sourceSegments:segments,triangles:totalTriangles,vertices:parts.reduce((s,p)=>s+p.vertexCount,0),neuronNamedObjects:parts.filter(p=>p.isNeuron).length,bytes:buffer.length,gzipBytes:compressed.length};
  const manifest={version:1,model:'Virtual Worm February 2012',scope:'Adult hermaphrodite reference reconstruction',sourceUrl,commit,geometry:'geometry.bin',gzip:'geometry.bin.gz',sha256:crypto.createHash('sha256').update(buffer).digest('hex'),decodeParams:model.decodeParams,summary,parts};
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
  const sourceManifest={commit,sourceUrl,files:[...sourceFiles,...['Virtual_Worm_February_2012.js','legacy-loader.js','LICENSE'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceDir,file))).digest('hex')}))]};
  fs.writeFileSync(path.join(out,'source-files.json'),JSON.stringify(sourceManifest,null,2));
  fs.writeFileSync(path.join(out,'inventory.tsv'),['source_name\tdisplay_name\tsource_material\tdisplay_systems\tsegments\ttriangles\tsource',...parts.map(p=>[p.id,p.name,p.material,p.systems.join(';'),p.segments.length,p.indexCount/3,sourceUrl+'Virtual_Worm_February_2012.js'].join('\t'))].join('\n')+'\n');
  console.log(JSON.stringify(summary,null,2));
  return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url))convert();
