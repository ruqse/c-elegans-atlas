import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {alignStructures} from './layout';
import type {NeuralDataset} from './NeuralAtlas';

interface State {ids:string[];aligned:boolean;reset:number}
export default function NeuralScene({dataset,ids,aligned,reset}:{dataset:NeuralDataset}&State){
  const host=useRef<HTMLDivElement>(null),update=useRef<()=>void>(()=>{}),latest=useRef<State>({ids,aligned,reset});
  latest.current={ids,aligned,reset};
  const [status,setStatus]=useState('Loading selected meshes…'),[error,setError]=useState('');
  useEffect(()=>{
    const el=host.current!;let disposed=false,frame=0,generation=0,controller=new AbortController();
    let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setError('WebGL is unavailable. Source downloads remain accessible.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','3D neural EM source meshes. Select objects using the checkboxes.');el.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.0001,1000),root=new T.Group();
    // One shared unit conversion for rendering only; never rescale individual meshes.
    const scale=1e-5;root.scale.setScalar(scale);scene.add(root);
    const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=.001;controls.maxDistance=500;
    scene.add(new T.HemisphereLight(0xffffff,0x53738b,2));const light=new T.DirectionalLight(0xffffff,2.5);light.position.set(3,5,6);scene.add(light);
    const draco=new DRACOLoader();draco.setDecoderPath('./draco/');draco.setWorkerLimit(2);const loader=new GLTFLoader().setDRACOLoader(draco);
    const meshes=new Map<string,T.Group>(),sourceBoxes=new Map<string,T.Box3>();
    const dispose=(object:T.Object3D)=>object.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
    const render=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(()=>{frame=0;renderer.render(scene,camera);});};
    const fit=()=>{const box=new T.Box3().setFromObject(root);if(box.isEmpty())return;const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const distance=Math.max(size.y,size.x/camera.aspect,.01)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))+size.z;camera.position.copy(center).add(new T.Vector3(0,0,distance*1.25));controls.target.copy(center);controls.update();render();};
    const arrange=()=>{
      if(disposed)return;
      const all=[...sourceBoxes.values()];const box=all.reduce((b,x)=>b.union(x),new T.Box3());const gap=box.isEmpty()?.01:Math.max(box.getSize(new T.Vector3()).length()*.035,.01);
      const positions=alignStructures([...sourceBoxes].map(([id,b])=>({id,min:b.min.toArray(),max:b.max.toArray()})),camera.aspect,gap);
      for(const [id,object] of meshes){object.position.set(0,0,0);if(latest.current.aligned)object.position.fromArray(positions.get(id)!.offset).divideScalar(scale);}
      root.updateMatrixWorld(true);controls.enableRotate=!latest.current.aligned;fit();
    };
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();arrange();};
    const observer=new ResizeObserver(resize);observer.observe(el);controls.addEventListener('change',render);resize();
    let lastIds='';
    const sync=()=>{
      const key=latest.current.ids.join('|');
      if(key===lastIds){arrange();return;}lastIds=key;
      const run=++generation;controller.abort();controller=new AbortController();const signal=controller.signal;
      for(const [id,object] of meshes)if(!latest.current.ids.includes(id)){root.remove(object);dispose(object);meshes.delete(id);sourceBoxes.delete(id);}
      setError('');setStatus(latest.current.ids.length?'Loading selected meshes…':'Select objects from the index to begin.');arrange();
      const needed=latest.current.ids.filter(id=>!meshes.has(id));
      // Sequential parsing bounds peak memory while preserving the complete source mesh.
      (async()=>{
        for(const id of needed){
          const entry=dataset.objects.find(o=>o.uid===id);if(!entry)throw Error(`${id} is absent from this source dataset.`);
          const response=await fetch(entry.local,{signal});if(!response.ok)throw Error(`${id}: source download failed (${response.status}).`);
          const bytes=await response.arrayBuffer();
          if(bytes.byteLength!==entry.bytes)throw Error(`${id}: source size mismatch.`);
          if(crypto.subtle){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==entry.sha256)throw Error(`${id}: checksum mismatch.`);}
          if(disposed||run!==generation)return;
          const data=await loader.parseAsync(new TextDecoder().decode(bytes),'');
          if(disposed||run!==generation){dispose(data.scene);return;}
          const object=data.scene;root.add(object);meshes.set(id,object);root.updateMatrixWorld(true);
          sourceBoxes.set(id,new T.Box3().setFromObject(object));
          arrange();setStatus(`Loaded ${meshes.size} of ${latest.current.ids.length} source objects…`);
        }
        if(!disposed&&run===generation)setStatus(latest.current.ids.length?'':'Select objects from the index to begin.');
      })().catch(e=>{if(!disposed&&run===generation&&e.name!=='AbortError'){setError(e.message);setStatus('');}});
    };
    lastIds='__initial__';update.current=sync;sync();
    const lost=(e:Event)=>{e.preventDefault();setError('The graphics context was lost. Reload to restore the neural view.');};renderer.domElement.addEventListener('webglcontextlost',lost);
    return()=>{disposed=true;++generation;controller.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();draco.dispose();for(const o of meshes.values())dispose(o);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();el.replaceChildren();update.current=()=>{};};
  },[dataset]);
  useEffect(()=>update.current(),[ids,aligned,reset]);
  return <><div className="scene" ref={host}/>{status&&<div className="neural-status" role="status">{status}</div>}{error&&<div className="loading error" role="alert"><strong>Mesh could not be loaded</strong><p>{error}</p><button onClick={()=>window.location.reload()}>Reload</button></div>}</>;
}
