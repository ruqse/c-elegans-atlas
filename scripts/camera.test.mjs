import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {transformSync} from 'esbuild';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const code=transformSync(fs.readFileSync(new URL('../src/camera.ts',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
const module={exports:{}};
new Function('module','exports','require',code)(module,module.exports,createRequire(import.meta.url));
const {setPanMode}=module.exports;

// Exercise the installed OrbitControls with pointer gestures, without needing WebGL.
class Canvas extends EventTarget {
  style={};clientWidth=800;clientHeight=400;
  setPointerCapture(){}
  releasePointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
}
function setup(t){
  const canvas=new Canvas(),camera=new PerspectiveCamera(32,2,.001,100);
  camera.position.set(1,2,6);
  const controls=new OrbitControls(camera,canvas);
  t.after(()=>controls.dispose());
  return {canvas,camera,controls};
}
function pointer(canvas,type,x,y,options={}){
  const event=new Event(type,{cancelable:true});
  Object.assign(event,{pointerId:1,pointerType:'mouse',button:0,clientX:x,clientY:y,pageX:x,pageY:y,...options});
  canvas.dispatchEvent(event);
}
function drag(canvas,dx,dy=0,options={}){
  pointer(canvas,'pointerdown',300,180,options);
  pointer(canvas,'pointermove',300+dx,180+dy,options);
  pointer(canvas,'pointerup',300+dx,180+dy,options);
}
function pose(camera,controls){return {position:camera.position.clone(),target:controls.target.clone(),rotation:camera.quaternion.clone()};}
function assertTranslation(camera,controls,before){
  const displacement=camera.position.clone().sub(before.position);
  assert.ok(displacement.length()>1e-4,'drag moves the camera');
  assert.ok(displacement.distanceTo(controls.target.clone().sub(before.target))<1e-10,'camera and target move together');
  assert.ok(camera.quaternion.angleTo(before.rotation)<1e-7,'view orientation is preserved');
}

for(const pointerType of ['mouse','touch']){
  test(`${pointerType} drags pan left, right and vertically without rotating`,t=>{
    const {canvas,camera,controls}=setup(t);
    setPanMode(controls,true);
    for(const [dx,dy] of [[80,0],[-80,0],[0,60]]){
      const before=pose(camera,controls);
      drag(canvas,dx,dy,{pointerType});
      assertTranslation(camera,controls,before);
      const right=new Vector3(1,0,0).applyQuaternion(before.rotation);
      if(dx)assert.ok(camera.position.clone().sub(before.position).dot(right)*dx<0,'camera translation follows the horizontal drag');
    }
  });
}
test('changing drag mode preserves the view and turning Pan off restores rotation',t=>{
  const {canvas,camera,controls}=setup(t);
  setPanMode(controls,true);drag(canvas,70);
  const before=pose(camera,controls);
  setPanMode(controls,false);
  assert.ok(camera.position.equals(before.position));
  assert.ok(controls.target.equals(before.target));
  assert.ok(camera.quaternion.equals(before.rotation));
  drag(canvas,60);
  assert.ok(camera.quaternion.angleTo(before.rotation)>.01);
  assert.ok(controls.target.equals(before.target));
});
test('Shift-drag and right-drag pan while rotation is enabled',t=>{
  const {canvas,camera,controls}=setup(t);
  setPanMode(controls,false);
  for(const options of [{shiftKey:true},{button:2}]){
    const before=pose(camera,controls);
    drag(canvas,80,0,options);
    assertTranslation(camera,controls,before);
  }
});
test('Pan mode keeps wheel and pinch zoom available without rotating',t=>{
  const {canvas,camera,controls}=setup(t);
  setPanMode(controls,true);
  const before=pose(camera,controls),distance=camera.position.distanceTo(controls.target);
  const wheel=new Event('wheel',{cancelable:true});Object.assign(wheel,{deltaY:-100,clientX:400,clientY:200});canvas.dispatchEvent(wheel);
  assert.ok(camera.position.distanceTo(controls.target)<distance);
  const zoomedDistance=camera.position.distanceTo(controls.target);
  pointer(canvas,'pointerdown',300,180,{pointerType:'touch',pointerId:1});
  pointer(canvas,'pointerdown',400,180,{pointerType:'touch',pointerId:2});
  pointer(canvas,'pointermove',440,180,{pointerType:'touch',pointerId:2});
  pointer(canvas,'pointerup',440,180,{pointerType:'touch',pointerId:2});
  pointer(canvas,'pointerup',300,180,{pointerType:'touch',pointerId:1});
  assert.ok(camera.position.distanceTo(controls.target)<zoomedDistance);
  assert.ok(camera.quaternion.angleTo(before.rotation)<1e-7);
});
