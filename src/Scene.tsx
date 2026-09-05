import {useEffect,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {SYSTEMS,partOpacity,type Atlas,type SceneState,type Part} from './atlas';
import {alignStructures,explosionOffset} from './layout';

interface Props {atlas:Atlas;state:SceneState;onSelect:(id:string)=>void;onReady:()=>void;onError:(message:string)=>void}
export default function Scene({atlas,state,onSelect,onReady,onError}:Props){
  const host=useRef<HTMLDivElement>(null),update=useRef<(s:SceneState)=>void>(()=>{}),select=useRef(onSelect);
  select.current=onSelect;
  const latest=useRef(state);latest.current=state;
  useEffect(()=>{
    const el=host.current!;let disposed=false,frame=0,renderer:T.WebGLRenderer;
    const abort=new AbortController();
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{onError('3D rendering is unavailable. Enable WebGL or use a browser with graphics acceleration. The searchable source inventory remains available.');return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));renderer.outputColorSpace=T.SRGBColorSpace;renderer.localClippingEnabled=true;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.domElement.setAttribute('aria-label','Interactive 3D worm. Drag to rotate, scroll to zoom. Use the structure list for keyboard selection.');
    renderer.domElement.setAttribute('role','img');el.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.001,100);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=.025;controls.maxDistance=200;controls.zoomSpeed=.8;
    scene.add(new T.HemisphereLight(0xe8f4ff,0x89949b,1.2));
    const key=new T.DirectionalLight(0xffffff,2);key.position.set(-3,5,5);scene.add(key);
    const fill=new T.DirectionalLight(0xc9e5ff,.8);fill.position.set(2,-2,-4);scene.add(fill);
    const group=new T.Group();
    // Rigid rotation only; the source geometry and relative positions are unchanged.
    group.rotation.y=Math.PI/2;scene.add(group);
    const meshes=new Map<string,T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>>();
    const plane=new T.Plane(new T.Vector3(0,0,-1),100);
    let fullBox=new T.Box3(),sourceCenter=new T.Vector3();let previous:SceneState|undefined;
    const originalBoxes=new Map<string,T.Box3>();let layoutKey='',offsets=new Map<string,{offset:number[]}>();
    let amount=0,targetAmount=0,lastTime=0;const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let targets:{id:string;x:number;y:number;left:number;right:number;top:number;bottom:number}[]=[];
    const markerPositions=new Float32Array(atlas.parts.length*3),markerGeometry=new T.BufferGeometry();
    markerGeometry.setAttribute('position',new T.BufferAttribute(markerPositions,3));
    const markerMaterial=new T.PointsMaterial({color:0x70838b,size:3,sizeAttenuation:false,transparent:true,opacity:.6,depthTest:false});
    markerMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(distance(gl_PointCoord,vec2(0.5))>0.5) discard;');};
    const markers=new T.Points(markerGeometry,markerMaterial);markers.frustumCulled=false;markers.visible=false;markers.renderOrder=10;scene.add(markers);
    const updateTargets=()=>{
      targets=[];if(amount<=.75)return;
      const projected=new T.Vector3(),box=new T.Box3();
      for(const [id,mesh] of meshes){if(!mesh.visible)continue;box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
        for(let i=0;i<8;i++){projected.set((i&1)?box.max.x:box.min.x,(i&2)?box.max.y:box.min.y,(i&4)?box.max.z:box.min.z).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
        box.getCenter(projected).project(camera);if(projected.z< -1||projected.z>1)continue;targets.push({id,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});
      }
    };
    const hover=document.createElement('div');hover.className='hover-label';hover.hidden=true;el.appendChild(hover);
    const requestRender=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(time=>{
      frame=0;const moving=Math.abs(amount-targetAmount)>.00001;
      if(moving){const dt=Math.min((time-lastTime)/1000||.016,.05);amount=reducedMotion.matches?targetAmount:T.MathUtils.damp(amount,targetAmount,8,dt);if(Math.abs(amount-targetAmount)<.0001)amount=targetAmount;pose(latest.current);fitCurrent(latest.current);}
      lastTime=time;renderer.render(scene,camera);updateTargets();if(amount!==targetAmount)requestRender();
    });};
    const fit=(box:T.Box3,view:SceneState['view'],alignment=0)=>{
      if(box.isEmpty())return;
      const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      const halfFov=T.MathUtils.degToRad(camera.fov/2);
      const distance=Math.max(size.y/(2*Math.tan(halfFov)),size.x/(2*Math.tan(halfFov)*camera.aspect),.06)+size.z*.75;
      const direction=view==='side'?new T.Vector3(0,0,1):view==='opposite'?new T.Vector3(0,0,-1):new T.Vector3(.08,.42,1).normalize();
      const spherical=new T.Spherical().setFromVector3(direction);spherical.theta*=1-alignment;spherical.phi=T.MathUtils.lerp(spherical.phi,Math.PI/2,alignment);direction.setFromSpherical(spherical);
      camera.position.copy(center).addScaledVector(direction,distance*1.15);camera.up.set(0,1,0);controls.target.copy(center);controls.update();requestRender();
    };
    const visibleBox=()=>{const b=new T.Box3();for(const mesh of meshes.values())if(mesh.visible)b.union(new T.Box3().setFromObject(mesh));return b;};
    const pose=(s:SceneState)=>{
      const span=Math.max(...fullBox.getSize(new T.Vector3()).toArray());
      const inverseRotation=group.quaternion.clone().invert();
      for(const p of atlas.parts){
        const mesh=meshes.get(p.id)!;const opacity=partOpacity(p,s.layers);
        mesh.visible=s.isolate?p.id===s.selected:s.layout==='selection'?s.compare.includes(p.id):opacity>.001;
        // Reveal the separated pieces as they leave their transparent context layers.
        mesh.material.opacity=s.isolate||s.layout==='selection'?1:T.MathUtils.lerp(opacity,1,amount);
        mesh.material.transparent=mesh.material.opacity<.999;mesh.material.depthWrite=!mesh.material.transparent;
        mesh.material.emissive.set(p.id===s.selected?0x3b8479:0x000000);mesh.material.emissiveIntensity=p.id===s.selected?.25:0;
        const destination=offsets.get(p.id)?.offset??[0,0,0];
        const center=originalBoxes.get(p.id)!.getCenter(new T.Vector3()).toArray();
        const offset=explosionOffset(amount,destination,SYSTEMS.findIndex(x=>x.id===p.systems[0]),SYSTEMS.length,center,span);
        mesh.position.fromArray(offset).applyQuaternion(inverseRotation);
        mesh.material.clippingPlanes=s.cut>0?[plane]:[];
      }
      plane.constant=(1-s.cut/100)*fullBox.max.z+(s.cut/100)*fullBox.min.z;
      group.updateMatrixWorld(true);
      atlas.parts.forEach((p,i)=>{const mesh=meshes.get(p.id)!;const point=new T.Vector3();if(mesh.visible)mesh.geometry.boundingBox!.getCenter(point).applyMatrix4(mesh.matrixWorld);else point.set(10000,10000,10000);markerPositions.set(point.toArray(),i*3);});
      markerGeometry.attributes.position.needsUpdate=true;markers.visible=amount>.8&&!s.isolate;markerMaterial.opacity=Math.max(0,(amount-.8)/.2)*.55;
      controls.enableRotate=amount<=.8;
      controls.mouseButtons.LEFT=amount>.8?T.MOUSE.PAN:T.MOUSE.ROTATE;
      controls.touches.ONE=amount>.8?T.TOUCH.PAN:T.TOUCH.ROTATE;
    };
    const fitCurrent=(s:SceneState)=>{
      // Blend viewing direction too, so the final alignment never snaps into place.
      const extent=Math.max(0,(amount-.45)/.35),blend=Math.min(1,extent);
      const box=s.isolate||amount>0?visibleBox():fullBox;
      fit(box,s.view,blend);
    };
    const apply=(s:SceneState)=>{
      if(!meshes.size)return;
      const ids=atlas.parts.filter(p=>s.isolate?p.id===s.selected:s.layout==='selection'?s.compare.includes(p.id):partOpacity(p,s.layers)>.001).map(p=>p.id);
      const key=[camera.aspect,...ids].join('|');
      if(key!==layoutKey){offsets=alignStructures(ids.map(id=>{const b=originalBoxes.get(id)!;return {id,min:b.min.toArray(),max:b.max.toArray()};}),camera.aspect,Math.max(...fullBox.getSize(new T.Vector3()).toArray())*.004);layoutKey=key;}
      targetAmount=s.layout==='assembled'?0:s.separation/100;
      pose(s);
      const first=!previous,reset=first||s.reset!==previous!.reset,view=first||s.view!==previous!.view;
      const visibilityChanged=first||s.layers!==previous!.layers||s.isolate!==previous!.isolate||s.compare!==previous!.compare||s.layout!==previous!.layout||(s.isolate&&s.selected!==previous!.selected);
      if(reset||view||(visibilityChanged&&(amount>0||s.isolate)))fitCurrent(s);
      if(!first&&s.focus!==previous!.focus&&s.selected){const mesh=meshes.get(s.selected);if(mesh)fit(new T.Box3().setFromObject(mesh),amount>.8?'side':s.view);}
      previous=s;requestRender();
    };
    update.current=apply;
    const resize=()=>{
      const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
      renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
      if(!fullBox.isEmpty()){apply(latest.current);fitCurrent(latest.current);}requestRender();
    };
    const observer=new ResizeObserver(resize);observer.observe(el);controls.addEventListener('change',requestRender);resize();
    const ray=new T.Raycaster(),pointer=new T.Vector2();
    const pick=(x:number,y:number):Part|undefined=>{
      const rect=el.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
      // Low-opacity context surfaces intentionally do not intercept selection.
      const candidates=[...meshes.values()].filter(m=>m.visible&&m.material.opacity>=.15);
      const hit=ray.intersectObjects(candidates,false).find(h=>!latest.current.cut||plane.distanceToPoint(h.point)>=0);
      if(hit)return atlas.parts.find(p=>p.id===hit.object.name);
      if(amount>.8){const px=x-rect.left,py=y-rect.top;let best:typeof targets[number]|undefined,score=Infinity;
        for(const t of targets){const distance=Math.hypot(Math.max(t.left-px,0,px-t.right),Math.max(t.top-py,0,py-t.bottom));if(distance>8)continue;const next=distance+Math.hypot(px-t.x,py-t.y)*.03;if(next<score){score=next;best=t;}}
        if(best)return atlas.parts.find(p=>p.id===best!.id);
      }
      return undefined;
    };
    const pointers=new Map<number,{x:number;y:number}>();let dragged=false;
    const down=(e:PointerEvent)=>{if(pointers.size===0)dragged=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1)dragged=true;hover.hidden=true;};
    const move=(e:PointerEvent)=>{
      const start=pointers.get(e.pointerId);if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)dragged=true;
      if(pointers.size||e.pointerType==='touch'){hover.hidden=true;return;}
      const p=pick(e.clientX,e.clientY);hover.hidden=!p;
      if(p){hover.textContent=p.name;const rect=el.getBoundingClientRect();hover.style.left=Math.max(8,Math.min(e.clientX-rect.left+12,rect.width-180))+'px';hover.style.top=Math.max(8,e.clientY-rect.top-32)+'px';}
      renderer.domElement.style.cursor=p?'pointer':'grab';
    };
    const up=(e:PointerEvent)=>{const start=pointers.get(e.pointerId);const tap=start&&!dragged&&pointers.size===1&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<6;pointers.delete(e.pointerId);if(tap){const p=pick(e.clientX,e.clientY);if(p)select.current(p.id);}};
    const cancel=(e:PointerEvent)=>{pointers.delete(e.pointerId);dragged=true;hover.hidden=true;};
    const leave=()=>{hover.hidden=true;};
    const contextLost=(e:Event)=>{e.preventDefault();onError('The graphics context was lost. Reload the page to restore the 3D view.');};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('webglcontextlost',contextLost);
    async function load(){
      const compressed=typeof DecompressionStream!=='undefined';
      const response=await fetch('./atlas/'+(compressed?atlas.gzip:atlas.geometry),{signal:abort.signal});
      if(!response.ok)throw new Error(`Geometry download failed (${response.status}).`);
      let buffer:ArrayBuffer;
      if(compressed){const bytes=await response.arrayBuffer();const gzip=new Uint8Array(bytes);buffer=gzip[0]===31&&gzip[1]===139?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():bytes;}else buffer=await response.arrayBuffer();
      if(disposed)return;if(buffer.byteLength!==atlas.summary.bytes)throw new Error('Geometry size does not match the source manifest.');
      if(crypto.subtle){const digest=await crypto.subtle.digest('SHA-256',buffer);const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==atlas.sha256)throw new Error('Geometry checksum failed. The model is not the validated asset.');}
      if(disposed)return;
      for(const p of atlas.parts){
        const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positionOffset,p.vertexCount*3),3));geometry.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,p.normalOffset,p.vertexCount*3),3));geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indexOffset,p.indexCount),1));
        geometry.boundingBox=new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1]));geometry.computeBoundingSphere();
        const material=new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===p.systems[0])!.color,roughness:.6,metalness:.04,side:T.DoubleSide});
        const mesh=new T.Mesh(geometry,material);mesh.name=p.id;group.add(mesh);meshes.set(p.id,mesh);
      }
      group.updateMatrixWorld(true);fullBox=new T.Box3().setFromObject(group);sourceCenter=fullBox.getCenter(new T.Vector3());group.position.sub(sourceCenter);group.updateMatrixWorld(true);fullBox=new T.Box3().setFromObject(group);
      for(const [id,mesh] of meshes)originalBoxes.set(id,new T.Box3().setFromObject(mesh));
      apply(latest.current);onReady();
    }
    load().catch(error=>{if(!disposed&&error.name!=='AbortError')onError(error.message);});
    return ()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',contextLost);for(const mesh of meshes.values()){mesh.geometry.dispose();mesh.material.dispose();}markerGeometry.dispose();markerMaterial.dispose();renderer.dispose();el.replaceChildren();update.current=()=>{};};
  },[atlas,onReady,onError]);
  useEffect(()=>update.current(state),[state]);
  return <div className="scene" ref={host}/>;
}
