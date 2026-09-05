export type SystemId='muscular'|'nervous'|'reproductive'|'digestive'|'surface'|'excretory'|'coelomocytes'|'other';
export interface System {id:SystemId;name:string;color:string;context:string;url:string}
const handbook='https://www.wormatlas.org/hermaphrodite/hermaphroditehomepage.htm';
export const SYSTEMS:System[]=[
  {id:'muscular',name:'Muscles',color:'#ad749f',context:'Body-wall, pharyngeal, uterine, vulval and alimentary muscle objects in this model. Shared structures also appear in the related system.',url:handbook},
  {id:'nervous',name:'Nervous system',color:'#b88c2f',context:'Neuron objects and the source sheath/socket groups. Legacy functional categories are retained only as source metadata, not endorsed as current neuron classifications.',url:'https://www.wormatlas.org/hermaphrodite/nervous/mainframe.htm'},
  {id:'reproductive',name:'Reproductive system',color:'#529d8e',context:'Gonadal, germ-line, spermathecal, uterine and vulval objects in this adult hermaphrodite model. Uterine and vulval muscle objects are shared with the muscle layer.',url:'https://www.wormatlas.org/hermaphrodite/egglaying%20apparatus/mainframe.htm'},
  {id:'digestive',name:'Alimentary system',color:'#eda58b',context:'Source pharyngeal, intestinal, rectal, valve and associated muscle groups. This view preserves the geometry present in the source export.',url:handbook},
  {id:'surface',name:'Body surface',color:'#94abbc',context:'Cuticle, hypodermal and seam-cell objects in the source model. Use low opacity to inspect internal objects.',url:handbook},
  {id:'excretory',name:'Excretory system',color:'#b6adf1',context:'Objects labelled excretory cell, duct, gland and pore in the source export.',url:handbook},
  {id:'coelomocytes',name:'Coelomocytes',color:'#90c68b',context:'Objects in the source coelomocyte material group.',url:handbook},
  {id:'other',name:'Other cells',color:'#b4bac2',context:'GLR, head mesodermal and XXX objects. XXX cells are separated from the legacy socket-cell display group; no functional claim is made here.',url:handbook}
];
export interface Part {id:string;name:string;sourceName:string;material:string;group:string;systems:SystemId[];isNeuron:boolean;bounds:[number[],number[]];positionOffset:number;normalOffset:number;indexOffset:number;vertexCount:number;indexCount:number;segments:{file:string;entry:number;slot:number;indexStart:number;indexCount:number}[]}
export interface Atlas {version:number;model:string;scope:string;sourceUrl:string;commit:string;sha256:string;geometry:string;gzip:string;summary:{objects:number;sourceSegments:number;triangles:number;vertices:number;neuronNamedObjects:number;bytes:number;gzipBytes:number};parts:Part[]}
export type LayerState=Record<SystemId,number>;
export const DEFAULT_LAYERS:LayerState={muscular:.26,nervous:1,reproductive:1,digestive:.62,surface:.055,excretory:.85,coelomocytes:1,other:.65};
export function partOpacity(p:Part,layers:LayerState){return Math.max(...p.systems.map(s=>layers[s]));}
export function matchesPart(p:Part,query:string){const haystack=[p.name,p.sourceName,p.group,...p.systems.map(s=>SYSTEMS.find(x=>x.id===s)!.name)].join(' ').toLowerCase().replaceAll('_',' ');return query.toLowerCase().replaceAll('_',' ').trim().split(/\s+/).every(term=>haystack.includes(term));}
export function sourceLink(atlas:Atlas,p:Part){return atlas.sourceUrl+'Virtual_Worm_February_2012.js';}
export interface SceneState {layers:LayerState;selected:string|null;isolate:boolean;focus:number;reset:number;view:'oblique'|'side'|'opposite';layout:'assembled'|'systems'|'structures'|'selection';separation:number;compare:string[];cut:number}
