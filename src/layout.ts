export interface LayoutItem {id:string; min:number[]; max:number[]}
/** Equal world units across cells. Translation only: never normalize individual objects. */
export function alignStructures(items:LayoutItem[], aspect=1, gap=.02){
  const cards=items.map(p=>({id:p.id,width:Math.max(gap,p.max[0]-p.min[0])+gap*2,height:Math.max(gap,p.max[1]-p.min[1])+gap*2,center:p.min.map((v,i)=>(v+p.max[i])/2)}));
  cards.sort((a,b)=>b.height-a.height||a.id.localeCompare(b.id));
  const area=cards.reduce((sum,c)=>sum+c.width*c.height,0);
  const target=Math.max(gap,...cards.map(c=>c.width),Math.sqrt(area*Math.max(.4,aspect)));
  const result=new Map<string,{offset:number[];min:number[];max:number[]}>();
  let x=0,y=0,rowHeight=0,width=0;
  for(const c of cards){
    if(x>0&&x+c.width>target){x=0;y+=rowHeight;rowHeight=0;}
    const cx=x+c.width/2,cy=-y-c.height/2;
    result.set(c.id,{offset:[cx-c.center[0],cy-c.center[1],-c.center[2]],min:[x,-y-c.height],max:[x+c.width,-y]});
    x+=c.width;width=Math.max(width,x);rowHeight=Math.max(rowHeight,c.height);
  }
  const height=y+rowHeight;
  for(const item of result.values()){
    item.offset[0]-=width/2;item.offset[1]+=height/2;
    item.min[0]-=width/2;item.max[0]-=width/2;item.min[1]+=height/2;item.max[1]+=height/2;
  }
  return result;
}

/** Display translation: assembled → opened systems → individually aligned pieces. */
export function explosionOffset(amount:number, destination:number[], systemIndex:number, systemCount:number, center:number[], span:number):number[]{
  const t=Math.min(1,Math.max(0,amount));
  if(t===0)return [0,0,0];
  if(t===1)return [...destination];
  const angle=systemIndex/systemCount*Math.PI*2;
  // Open across the long body axis; keep longitudinal positions aligned.
  const opened=[0,Math.sin(angle)*span*.17,Math.cos(angle)*span*.13];
  if(t<=.45)return opened.map(v=>v*t/.45);
  const blend=(t-.45)/.55;
  return opened.map((v,i)=>v+(destination[i]-v)*blend);
}
