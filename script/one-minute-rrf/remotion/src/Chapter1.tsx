import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, delayRender, continueRender, cancelRender} from 'remotion';
import timing from '../../assets/references/ch1-phrase-timing.json';
import {MO, DG, CAM} from './huashu/runtime';
import {C as ERGO} from '../../../shared/remotion/components';

// The scene is new; geometry, write-on and camera algorithms come from huashu.
// 二哥共享色板；文档身份固定，绿色留给正确/通过状态。
const C = {bg:ERGO.bg,card:ERGO.card,ink:ERGO.ink,muted:ERGO.gray,dim:ERGO.faint,A:ERGO.rust,B:ERGO.blue,C:ERGO.ink,bad:ERGO.rust};
type Id = 'A'|'B'|'C';
const ids:Id[]=['A','B','C'];
const F='"RrfSans"';
const M='"CMU-rm"';
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const q=(f:number,a:number,b:number)=>MO.smooth(MO.seg(f,a,b));
const alpha=(c:CanvasRenderingContext2D,a:number,draw:()=>void)=>{c.save();c.globalAlpha*=a;draw();c.restore();};
const text=(c:CanvasRenderingContext2D,s:string,x:number,y:number,size=42,col=C.ink,align:CanvasTextAlign='center',math=false)=>{
 c.font=`${size}px ${math?M:F}`;c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);
};
function path(c:CanvasRenderingContext2D,points:number[][],p=1,col=C.dim,lw=3){
 c.save();c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';
 const lengths=DG.cum(points);DG.drawPartial(c,points,lengths,lengths.at(-1)*p);c.restore();
}
function doc(c:CanvasRenderingContext2D,id:Id,x:number,y:number,s=1,a=1){
 alpha(c,a,()=>{c.save();c.translate(x,y);c.scale(s,s);
 const pts=[[-40,-53],[17,-53],[40,-30],[40,53],[-40,53],[-40,-53]];
 path(c,pts,1,C[id],3);path(c,[[17,-53],[17,-30],[40,-30]],1,C[id],2);
 text(c,id,0,9,52,C[id], 'center',true);c.restore();});
}
function frac(c:CanvasRenderingContext2D,den:string,x:number,y:number,size=76,col=C.ink,p=1){
 if(p<=0)return;alpha(c,Math.min(1,p*3),()=>{
 DG.math(c,[{s:'1'}],x,y-size*.35,size,{p, col});
 const w=Math.max(size*1.6,den.length*size*.48);
 path(c,[[x-w/2,y],[x+w/2,y]],MO.smooth(Math.min(1,p*2)),col,3);
 DG.math(c,[{s:den}],x,y+size*.92,size,{p,col});
 });
}
function drawOpening(c:CanvasRenderingContext2D,f:number){
 const split=q(f,0,85), arrange=q(f,88,132), leave=q(f,185,210);
 alpha(c,1-leave,()=>{
 ids.forEach((id,i)=>{
 const x=lerp(960+(i-1)*300,540,split),y=lerp(470,330+i*175,split);
 doc(c,id,x,y,lerp(2.7,1.1,split));
 alpha(c,split,()=>text(c,String(i+1),x-105,y,50,C.muted,'center',true));
 const vy=id==='A'?680:id==='B'?330:505;
 doc(c,id,lerp(960+(i-1)*300,1380,split),lerp(470,vy,split),1.1,split*(id==='A'?.22:1));
 if(id==='A')alpha(c,arrange,()=>text(c,'未命中',1540,vy,30,C.muted));
 if(id!=='A')alpha(c,arrange,()=>text(c,String(i),1275,vy,50,C.muted,'center',true));
 });
 alpha(c,q(f,12,50),()=>text(c,'关键词检索',540,170,46));
 alpha(c,q(f,50,88),()=>text(c,'向量检索',1380,170,46));
 path(c,[[820,460],[1100,460]],q(f,130,155),C.dim,3);
 alpha(c,arrange,()=>text(c,'?',960,425,100,C.ink,'center',true));
 });
}
function drawRaw(c:CanvasRenderingContext2D,f:number){
 const enter=q(f,192,216), exit=q(f,466,492);
 alpha(c,enter*(1-exit),()=>{
 const growth=q(f,216,265),vec=q(f,270,318),kw=q(f,340,390),sum=q(f,410,445);
 const x=410,y1=390,y2=660;
 text(c,'向量检索',225,y1,40,C.muted);text(c,'关键词检索',225,y2,40,C.muted);
 path(c,[[x,y1+55],[1510,y1+55]],growth,C.dim,2);
 path(c,[[x,y2+55],[1510,y2+55]],growth,C.dim,2);
 for(let i=0;i<6;i++){
 const xx=x+i*210;
 path(c,[[xx,y1+48],[xx,y1+64]],growth,C.dim,2);
 path(c,[[xx,y2+48],[xx,y2+64]],growth,C.dim,2);
 }
 text(c,'0',x,y1+100,32,C.muted,'center',true);text(c,Number(lerp(1,18,sum).toFixed(sum>0&&sum<1?1:0)).toString(),1460,y1+100,32,C.muted,'center',true);
 text(c,'0',x,y2+100,32,C.muted,'center',true);text(c,'无上限 →',1490,y2+100,32,C.muted);
 // One hypothetical document B has two scores. Widths use a shared raw scale.
 const vw=1050*.92*vec/lerp(1,18,sum),kwW=1050*16/18*kw;
 DG.shape(c,DG.rectPts(x+vw/2,y1,vw,60),{fill:C.B});
 DG.shape(c,DG.rectPts(x+kwW/2,y2,kwW,60),{fill:C.B});
 alpha(c,vec,()=>{text(c,'B',x-55,y1,50,C.B,'center',true);text(c,'0.92',x+vw+85,y1,48,C.B,'center',true);});
 alpha(c,kw,()=>{text(c,'B',x-55,y2,50,C.B,'center',true);text(c,'16',x+kwW+70,y2,48,C.B,'center',true);});
 alpha(c,sum,()=>{
 path(c,[[400,505],[1460,505]],1,C.bad,2);
 });
 text(c,'示意分数',960,74,25,C.muted);
 });
}
function drawRule(c:CanvasRenderingContext2D,f:number){
 const enter=q(f,477,495),end=q(f,955,982);
 alpha(c,enter*(1-end),()=>{
 const move=q(f,616,662);
 text(c,'RRF',lerp(960,375,move),lerp(370,190,move),lerp(148,76,move),C.ink,'center',true);
 alpha(c,q(f,492,530)*(1-move),()=>text(c,'Reciprocal Rank Fusion',960,520,53,C.muted,'center',true));
 alpha(c,q(f,570,614)*(1-move),()=>DG.write(c,'倒数排名融合',960,630,65,q(f,570,614),{col:C.ink}));
 alpha(c,move,()=>{
 text(c,'原始分数',1070,190,38,C.muted);path(c,[[950,188],[1190,188]],q(f,640,674),C.bad,4);
 text(c,'名次',1440,190,45,C.B);
 });
 if(f>=620){
 const morph=q(f,746,817),den=q(f,815,865),missing=q(f,905,945);

 const pts=DG.morph(DG.circlePts(300,530,60,80),DG.rectPts(1400,530,280,62,80),morph);
 alpha(c,morph*.22,()=>{DG.shape(c,DG.circlePts(300,530,60,80),{stroke:C.B,lw:2});text(c,'1',300,530,74,C.B,'center',true);});
 DG.shape(c,pts,{fill:DG.rgba(C.B,lerp(.07,.85,morph)),stroke:C.B,lw:3});
 alpha(c,1-q(f,750,795),()=>text(c,'1',300,530,74,C.B,'center',true));
 text(c, 'rank',300,680,48,C.muted,'center',true);
 path(c,[[410,530],[595,530]],q(f,723,770),C.dim,3);
 alpha(c,q(f,755,790),()=>frac(c,den>.01?'60 + 1':'k + rank',850,360,68,C.ink,q(f,755,797)));
 alpha(c,den,()=>text(c,'0.0164',1690,530,55,C.B,'center',true));
 alpha(c,q(f,865,897),()=>text(c,'k = 60',960,730,43,C.muted,'center',true));
 alpha(c,missing,()=>{
 doc(c,'A',370,820,.5,.4);text(c,'没有命中',530,820,35,C.muted);
 path(c,[[650,820],[760,820]],1,C.dim,2);text(c,'0',830,820,53,C.muted,'center',true);
 });
 }
 });
}
const rowY=(id:Id)=>340+ids.indexOf(id)*170;
const srcY=(id:Id,lane:number)=>lane===0?rowY(id):id==='B'?340:id==='C'?510:680;
const contrib=(id:Id,lane:number)=>lane===0?1/(61+ids.indexOf(id)):id==='A'?0:1/(id==='B'?61:62);
const starts={A:1285,B:1493,C:1600};
const ends={A:1385,B:1565,C:1660};
function drawFusion(c:CanvasRenderingContext2D,f:number){
 const enter=q(f,970,991),reorder=q(f,1700,1770),out=q(f,1845,1880);
 alpha(c,enter,()=>{
 const cam=CAM.track({x:960,y:540,z:1},[
 {at:41.5,kind:'to',x:960,y:505,z:1.025,dur:.65},
 {at:55.73,kind:'pull',x:960,y:540,z:1,dur:.9},
 ],f/30);
 c.save();CAM.apply(c,cam);
 alpha(c,1-q(f,1672,1696),()=>{
 text(c,'关键词检索',350,160,42);text(c,'向量检索',850,160,42);text(c,'融合分',1435,160,42);
 text(c,'示例排名',960,65,27,C.muted);
 });
 const sourceAlpha=1-q(f,1672,1696);
 const position=(id:Id)=>{
  if(id==='A'){
   const left=q(f,1700,1730),down=q(f,1730,1770),back=q(f,1770,1810);
   return {dx:lerp(-860*left,-440,back),dy:340*down};
  }
  const r=q(f,1715,1770);return {dx:-440*r,dy:-170*r};
 };
 const routeY=(id:Id)=>id==='A'?220:id==='B'?425:595;
 ids.forEach((id,i)=>{
 const showK=q(f,1024+i*26,1045+i*26),showV=q(f,1128+(i===1?0:28),1150+(i===1?0:28));
 for(let lane=0;lane<2;lane++){
 if(lane===1&&id==='A'){
 alpha(c,q(f,1208,1234)*sourceAlpha,()=>{
 path(c,[[807,627],[893,627],[893,733],[807,733],[807,627]],1,C.dim,2);
 text(c,'未命中',850,680,29,C.muted);text(c,'0',1020,680,40,C.muted,'center',true);
 });continue;
 }
 const p=q(f,starts[id]+lane*18,ends[id]+lane*8),sx=lane===0?350:850,sy=srcY(id,lane);
 const w=contrib(id,lane)*13500,previous=lane===1?contrib(id,0)*13500:0;
 const tx=1200+previous+w/2,ty=rowY(id);
 const sourcePts=DG.rectPts(sx,sy,80,106,80),targetPts=DG.rectPts(tx,ty,w,62,80);
 const appear=lane===0?showK:showV;
 alpha(c,appear*sourceAlpha,()=>{
 doc(c,id,sx,sy,.9,lerp(1,.25,p));
 text(c,String(lane===0?i+1:id==='B'?1:2),sx-110,sy,52,C.muted,'center',true);
 });
 if(p>0){
 // Draw both original location and transformed contribution; identity stays fixed.
 const {dx:shiftX,dy:shiftY}=position(id);
 c.save();c.translate(shiftX,shiftY);
 let pts;
 if(lane===0){
  const lift=DG.rectPts(520,routeY(id),80,40,80),across=DG.rectPts(1080,routeY(id),140,40,80);
  pts=p<.25?DG.morph(sourcePts,lift,MO.smooth(p/.25)):p<.65?DG.morph(lift,across,MO.smooth((p-.25)/.4)):DG.morph(across,targetPts,MO.smooth((p-.65)/.35));
 }else{
  const side=DG.rectPts(1040,sy,80,50,80);
  pts=p<.4?DG.morph(sourcePts,side,MO.smooth(p/.4)):DG.morph(side,targetPts,MO.smooth((p-.4)/.6));
 }
 alpha(c,appear,()=>DG.shape(c,pts,{fill:lane===0?C[id]:`${C[id]}77`,stroke:C[id],lw:2.5}));
 c.restore();
 }
 }
 // Label is attached to the fused document, not to the previous row number.
 const done=q(f,ends[id]-8,ends[id]+15),total=contrib(id,0)+contrib(id,1),width=total*13500;
 const pos=position(id),yy=rowY(id)+pos.dy;
 alpha(c,done,()=>{
 text(c,id,1120+pos.dx,yy,54,C[id],'center',true);
 text(c,total.toFixed(4),1200+width+100+pos.dx,yy,47,C[id],'center',true);
 alpha(c,q(f,id==='A'?1810:1780,id==='A'?1830:1800),()=>text(c,id==='B'?'1':id==='C'?'2':'3',535,yy,53,C.muted,'center',true));
 });
 });
 // Route motion explains which contribution is being added; never arbitrary drift.
 if(f>=1243&&f<1672){
 const id:Id=f<1414?'A':f<1589?'B':'C';
 const t=q(f,starts[id]-8,ends[id]+20),trace=DG.flash(t,.22);
 for(let lane=0;lane<2;lane++){
 if(id==='A'&&lane===1)continue;
 const y=srcY(id,lane),sx=lane===0?400:900,ey=rowY(id),ex=1200;
 const pts=lane===0?[[sx,y],[520,routeY(id)],[1080,routeY(id)],[ex,ey]]:[[sx,y],[1040,y],[1100,ey],[ex,ey]];
 alpha(c,.35,()=>path(c,pts,1,C[id],2));
 const cum=DG.cum(pts),len=cum.at(-1);
 if(trace[1]>trace[0]){const segment=Array.from({length:32},(_,i)=>DG.pointAt(pts,cum,len*lerp(trace[0],trace[1],i/31)));path(c,segment,1,C[id],6);}
 }
 const count=q(f,id==='A'?1320:id==='B'?1493:1589,id==='A'?1345:id==='B'?1520:1615);
 alpha(c,count,()=>{
 doc(c,id,260,825,.48);
 const expression=id==='A'?'1 / 61 + 0  ≈  0.0164':id==='B'?'1 / 62 + 1 / 61  ≈  0.0325':'1 / 63 + 1 / 62  ≈  0.0320';
 DG.math(c,[{s:expression,col:C[id]}],1050,845,52,{p:count});
 });
 if(id==='A')alpha(c,q(f,1355,1390),()=>text(c,'单路命中',960,245,35,C.muted));
 }
 alpha(c,q(f,1805,1835)*(1-out),()=>{
 DG.brace(c,1435,305,550,{p:q(f,1805,1835),col:DG.rgba(C.muted,1-out),lw:2,depth:16});
 text(c,'2 路命中',1615,428,40,C.muted);
 text(c,'1 路命中',1615,680,40,C.A);
 });
 alpha(c,out,()=>{
 alpha(c,q(f,1924,1956),()=>text(c,'粗排',960,230,37,C.B));
 });
 c.restore();
 });
}
function draw(c:CanvasRenderingContext2D,f:number){
 c.clearRect(0,0,1920,1080);c.fillStyle=C.bg;c.fillRect(0,0,1920,1080);
 c.save();c.beginPath();c.rect(0,0,1920,900);c.clip();
 if(f<216)drawOpening(c,f);
 if(f>=192&&f<492)drawRaw(c,f);
 if(f>=477&&f<982)drawRule(c,f);
 if(f>=970)drawFusion(c,f);
 c.restore();
}
export const Chapter1:React.FC=()=>{
 const f=useCurrentFrame(),canvas=useRef<HTMLCanvasElement>(null);
 const [handle]=useState(()=>delayRender('Load pinned huashu fonts'));
 const [loaded,setLoaded]=useState(false);const released=useRef(false);
 useEffect(()=>{
 let live=true;
 Promise.all([['CMU-rm','cmunrm.woff'],['CMU-it','cmunti.woff'],['RrfSans','NotoSansSC-500.woff']].map(async([family,file])=>{
 const face=new FontFace(family,`url(${staticFile('huashu-fonts/'+file)})`);await face.load();document.fonts.add(face);
 })).then(()=>{if(live){DG.FONT.zh='RrfSans';setLoaded(true);}}).catch(cancelRender);
 return()=>{live=false;};
 },[handle]);
 useLayoutEffect(()=>{if(loaded&&canvas.current){const c=canvas.current.getContext('2d');if(c){draw(c,f);if(!released.current){released.current=true;continueRender(handle);}}}},[f,loaded,handle]);
 const subtitle=timing.subtitles.find(s=>f>=s.startFrame&&f<s.endFrame)?.text??'';
 return <AbsoluteFill style={{backgroundColor:C.bg,color:C.ink}}>
 <Audio src={staticFile('audio/voiceover.wav')}/>
 <canvas ref={canvas} width={1920} height={1080} style={{width:'100%',height:'100%'}}/>
 <div style={{position:'absolute',left:100,right:100,top:948,height:80,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F,fontSize:38,fontWeight:500,lineHeight:1.45,textAlign:'center'}}>
  <div style={{background:C.ink,color:C.card,padding:'14px 30px',borderRadius:18,whiteSpace:'nowrap'}}>{subtitle}</div>
 </div>
 </AbsoluteFill>;
};
