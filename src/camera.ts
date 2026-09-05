import {MOUSE,TOUCH} from 'three';
import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

export function setPanMode(controls:OrbitControls,pan:boolean){
  controls.enablePan=true;
  controls.screenSpacePanning=true;
  controls.enableRotate=!pan;
  controls.mouseButtons.LEFT=pan?MOUSE.PAN:MOUSE.ROTATE;
  controls.touches.ONE=pan?TOUCH.PAN:TOUCH.ROTATE;
}
