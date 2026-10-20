import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import timing from '../../assets/references/ch1-phrase-timing.json';

// One identity per document; one visual language through the entire explanation.
const P={bg:'#111827',paper:'#FAF7EE',muted:'#A4B2C6',line:'#344358',kw:'#69D6BA',vec:'#87AAFF',A:'#F6B96B',B:'#69D6BA',C:'#C5AEFF',red:'#FF817B'};
const FACE='"PingFang SC", "Microsoft YaHei", sans-serif';
const MONO='"SF Mono", "Menlo", monospace';
const docs=['A','B','C'] as const;
type DocId=typeof docs[number];
const tint=(id:DocId)=>P[id];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const progress=(f:number,start:number,d=22)=>interpolate(f,[start,start+d],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const visibility=(f:number,start:number,end=2100)=>progress(f,start,14)*(1-progress(f,end-14,14));
const Text:React.FC<{x:number;y:number;size?:number;fill?:string;weight?:number;anchor?:'start'|'middle'|'end';mono?:boolean;children:React.ReactNode;opacity?:number}> =({x,y,size=32,fill=P.paper,weight=600,anchor='start',mono=false,children,opacity=1})=><text x={x} y={y} fontSize={size} fill={fill} fontWeight={weight} fontFamily={mono?MONO:FACE} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Rule:React.FC<{x1:number;y1:number;x2:number;y2:number;color?:string;opacity?:number}> =({x1,y1,x2,y2,color=P.line,opacity=1})=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} opacity={opacity}/>;
const DocIcon:React.FC<{x:number;y:number;id:DocId;scale?:number}> =({x,y,id,scale=1})=><g transform={`translate(${x} ${y}) scale(${scale})`}><rect width={50} height={64} rx={7} fill={tint(id)}/><path d="M32 0 L50 18 L32 18 Z" fill={P.bg} opacity={.24}/><text x={25} y={45} textAnchor="middle" fontSize={30} fill={P.bg} fontWeight={850} fontFamily={MONO}>{id}</text></g>;
const Fraction:React.FC<{x:number;y:number;denominator:string;size?:number;fill?:string}> =({x,y,denominator,size=50,fill=P.paper})=>{
 const width=Math.max(size*1.8,denominator.length*size*.56);
 return <g><Text x={x} y={y-20} size={size} fill={fill} anchor="middle" mono>1</Text><line x1={x-width/2} x2={x+width/2} y1={y-6} y2={y-6} stroke={fill} strokeWidth={3}/><Text x={x} y={y+size*.96} size={size} fill={fill} anchor="middle" mono>{denominator}</Text></g>;
};
const Scene:React.FC<{f:number;start:number;end:number;children:React.ReactNode}>=({f,start,end,children})=>{
 const o=(start===0?1:progress(f,start-12,12))*(1-progress(f,end-12,12));return o>0?<g opacity={o} transform={`translate(0 ${mix(16,0,progress(f,start,18))})`}>{children}</g>:null;
};
const RankRow:React.FC<{x:number;y:number;id:DocId;rank:number;opacity?:number;width?:number;focus?:boolean}>=({x,y,id,rank,opacity=1,width=420,focus=false})=><g opacity={opacity} transform={`translate(${x} ${y})`}>
 <rect width={width} height={116} rx={16} fill={focus?tint(id):'#1B2638'} fillOpacity={focus?.11:1} stroke={focus?tint(id):P.line} strokeWidth={focus?2.5:1.5}/>
 <Text x={25} y={73} size={44} mono fill={focus?P.paper:P.muted}>{rank.toString().padStart(2,'0')}</Text>
 <DocIcon x={98} y={25} id={id}/><Text x={171} y={73} size={35}>文档 {id}</Text>
 <circle cx={width-32} cy={58} r={5} fill={tint(id)}/>
 </g>;

const Hook:React.FC<{f:number}>=({f})=>{
 const split=progress(f,75,28);const question=progress(f,132,20);
 return <>
 <Text x={96} y={167} size={66} weight={800}>两路检索，<tspan fill={P.kw}>一份排名？</tspan></Text>
 <Text x={98} y={224} size={27} fill={P.muted}>同一个问题，得到两份不同的答案顺序</Text>
 <g transform={`translate(${mix(500,96,split)} 356)`}>
  <rect width={330} height={304} rx={22} fill="#1B2638" stroke={P.line} strokeWidth={2}/>
  <g stroke={P.paper} strokeWidth={4} fill="none"><rect x={36} y={38} width={54} height={64} rx={6}/><path d="M49 59h28M49 73h28M49 87h17"/></g>
  <Text x={36} y={154} size={41}>知识库</Text><Text x={36} y={217} size={25} fill={P.muted}>问题 → 检索</Text>
  <path d="M36 254H290" stroke={P.kw} strokeWidth={3}/>
 </g>
 <g opacity={split}>
  <path d="M452 500C510 500 485 340 550 340M452 500C510 500 485 652 550 652" fill="none" stroke={P.line} strokeWidth={3}/>
  {['关键词检索','向量检索'].map((label,i)=><g key={label} transform={`translate(575 ${310+i*310})`}>
   <Text x={0} y={-28} size={28} fill={i?P.vec:P.kw}>{label}</Text>
   {(i?['B','C']:['A','B','C']).map((id,j)=><g key={id} transform={`translate(${j*101} 0)`}><DocIcon x={0} y={0} id={id as DocId} scale={1.1}/><Text x={27} y={112} anchor="middle" size={27} fill={P.muted}>#{j+1}</Text></g>)}
  </g>)}
  <path d="M940 345 C1060 345 1040 492 1150 492M840 655 C1060 655 1040 492 1150 492" fill="none" stroke={P.line} strokeWidth={3}/>
 </g>
 <g opacity={question}>
  <rect x={1200} y={323} width={615} height={375} rx={28} fill={P.kw} fillOpacity={.06} stroke={P.kw} strokeWidth={2} strokeDasharray="10 10"/>
  <Text x={1507} y={477} anchor="middle" size={110} fill={P.kw} weight={800}>合并</Text>
  <Text x={1507} y={568} anchor="middle" size={34} fill={P.muted}>谁应该排在前面？</Text>
 </g>
 </>;
};

const Scores:React.FC<{f:number}>=({f})=>{
 const vec=progress(f,269,28),kw=progress(f,336,30),dominance=progress(f,401,28);
 return <>
 <Text x={96} y={167} size={66} weight={800}>原始分数，<tspan fill={P.red}>不能直接相加</tspan></Text>
 <Text x={98} y={226} size={27} fill={P.muted}>两把尺子，刻度不同</Text>
 <Text x={145} y={350} size={36} fill={P.vec}>向量检索</Text>
 <Text x={145} y={406} size={25} fill={P.muted}>通常 0–1</Text>
 <rect x={510} y={325} width={1070} height={73} rx={10} fill="#1D2B43"/>
 <rect x={510} y={325} width={Math.max(1,1070*.82*vec)} height={73} rx={10} fill={P.vec}/>
 <Text x={1650} y={378} size={45} fill={P.vec} mono opacity={vec}>0.82</Text>
 <g opacity={kw}>
  <Text x={145} y={547} size={36} fill={P.kw}>关键词检索</Text>
  <Text x={145} y={603} size={25} fill={P.muted}>没有固定上限</Text>
  <rect x={510} y={522} width={1070} height={73} rx={10} fill="#1D2B43"/>
  <rect x={510} y={522} width={Math.max(1,1070*kw)} height={73} rx={10} fill={P.kw}/>
  <Text x={1650} y={575} size={45} fill={P.kw} mono>27.0</Text>
 </g>
 <Text x={510} y={660} size={23} fill={P.muted}>示意分数 · 两条刻度各自归一展示</Text>
 <g opacity={dominance}>
  <Text x={145} y={805} size={30} fill={P.paper}>直接相加</Text>
  <rect x={510} y={736} width={1070} height={84} rx={10} fill={P.kw}/>
  <rect x={1548} y={736} width={32} height={84} rx={5} fill={P.vec}/>
  <Text x={1045} y={792} size={34} fill={P.bg} anchor="middle" weight={800}>关键词分数主导总分</Text>
 </g>
 </>;
};

const Definition:React.FC<{f:number}>=({f})=>{
 const full=progress(f,485,30),zh=progress(f,575,18);
 return <>
 <Text x={96} y={167} size={34} fill={P.kw}>换一个共同标准</Text>
 <Text x={92} y={497} size={330} weight={850} mono>RRF<tspan fill={P.kw}>.</tspan></Text>
 <g opacity={full}><Text x={110} y={597} size={48} fill={P.muted} weight={400}>Reciprocal Rank Fusion</Text></g>
 <g opacity={zh}>
 <Rule x1={112} y1={667} x2={1810} y2={667}/>
 <Text x={110} y={770} size={68} weight={750}>倒数排名融合</Text>
 <Text x={1810} y={765} size={33} anchor="end" fill={P.kw}>把名次变成贡献</Text>
 </g>
 <g transform={`translate(${mix(1570,1410,full)} 310)`} opacity={full}>
 {[1,2,3].map((rank,i)=><g key={rank} transform={`translate(0 ${i*85})`}><Text x={0} y={0} size={53} mono fill={[P.A,P.B,P.C][i]}>#{rank}</Text><path d="M100 -18h150" stroke={P.line} strokeWidth={4}/></g>)}
 </g>
 </>;
};

const FormulaScene:React.FC<{f:number}>=({f})=>{
 const rank=progress(f,697,22),formula=progress(f,790,26),k=progress(f,845,18),miss=progress(f,901,18);
 return <>
 <Text x={96} y={167} size={66} weight={800}>只看名次，<tspan fill={P.kw}>不比原始分数</tspan></Text>
 <Text x={98} y={226} size={27} fill={P.muted}>每一路，各算一份贡献</Text>
 <g transform={`translate(110 340)`}>
 <Text x={0} y={0} size={27} fill={P.muted}>排名</Text>
 {[1,2,3].map((n,i)=><g key={n} transform={`translate(0 ${i*130+42})`} opacity={mix(.3,1,rank)}>
 <rect width={420} height={108} rx={15} fill={i===0?'#28383F':'#1B2638'} stroke={i===0?P.kw:P.line} strokeWidth={2}/>
 <Text x={32} y={73} size={46} mono fill={i===0?P.kw:P.muted}>#{n}</Text><DocIcon x={140} y={22} id={docs[i]} scale={.95}/><Text x={222} y={70} size={30}>文档 {docs[i]}</Text>
 </g>)}
 </g>
 <g opacity={rank}><path d="M600 464H730" stroke={P.kw} strokeWidth={4}/><path d="M708 445l22 19-22 19" stroke={P.kw} strokeWidth={4} fill="none"/><Text x={660} y={535} size={27} anchor="middle" fill={P.muted}>从 1 开始</Text></g>
 <g opacity={formula}>
 <Text x={883} y={327} size={28} fill={P.kw}>单路贡献</Text>
 <Fraction x={1080} y={497} denominator={k>.5?'60 + rank':'k + rank'} size={78}/>
 <Text x={1450} y={496} size={64} fill={P.kw} mono>≈</Text>
 <Text x={1660} y={496} size={65} mono anchor="middle" fill={P.kw}>0.0164</Text>
 <Text x={1658} y={563} size={25} fill={P.muted} anchor="middle">rank = 1 时，约值</Text>
 </g>
 <g opacity={k}>
 <rect x={871} y={653} width={375} height={87} rx={13} fill={P.kw} fillOpacity={.1}/>
 <Text x={1058} y={710} size={33} anchor="middle" fill={P.kw}>常数 k 通常取 60</Text>
 </g>
 <g opacity={miss}><Text x={1460} y={710} size={36} fill={P.muted}>未命中</Text><Text x={1750} y={710} anchor="middle" size={60} fill={P.paper} mono>0</Text></g>
 </>;
};

// Contributions travel along a visible curve from each ranking into the score row.
const Contribution:React.FC<{f:number;at:number;from:[number,number];to:[number,number];color:string;label:string}>=({f,at,from,to,color,label})=>{
 const t=progress(f,at,33);if(t<=0||t>=1)return null;
 const cx=(from[0]+to[0])/2,cy=Math.min(from[1],to[1])-80;
 const x=(1-t)**2*from[0]+2*(1-t)*t*cx+t*t*to[0];const y=(1-t)**2*from[1]+2*(1-t)*t*cy+t*t*to[1];
 return <g><path d={`M${from[0]},${from[1]} Q${cx},${cy} ${to[0]},${to[1]}`} fill="none" stroke={color} strokeWidth={3} opacity={.4}/><rect x={x-63} y={y-26} width={126} height={52} rx={26} fill={color}/><Text x={x} y={y+10} size={27} anchor="middle" fill={P.bg} mono>{label}</Text></g>;
};

const Fusion:React.FC<{f:number}>=({f})=>{
 const final=progress(f,1672,66);const focus:DocId|undefined=f>=1672?undefined:f>=1589?'C':f>=1414?'B':f>=1243?'A':undefined;
 const scoreAt={A:1320,B:1493,C:1589};const score={A:1/61,B:1/62+1/61,C:1/63+1/62};
 const baseY=344;const gap=153;
 const target=(id:DocId)=>baseY+(id==='B'?0:id==='C'?1:2)*gap;
 const yFor=(id:DocId)=>mix(baseY+docs.indexOf(id)*gap,target(id),progress(f,1686,38));
 const aLeave=progress(f,1672,12),aReturn=progress(f,1724,14);const aFlight=aLeave*(1-aReturn);
 const kw=progress(f,1023,26),vec=progress(f,1128,26),missing=progress(f,1208,20);
 return <>
 <Text x={96} y={163} size={61} weight={800}>{f>=1672?'共同认可的文档，升到前面':'同一篇文档，把两路贡献加起来'}</Text>
 <Text x={98} y={218} size={25} fill={P.muted}>示例排名 · k = 60 · 缺失项贡献为 0</Text>
 <Text x={110} y={299} size={31} fill={P.kw}>关键词检索</Text><Text x={595} y={299} size={31} fill={P.vec}>向量检索</Text>
 <Text x={1200} y={299} size={31} fill={P.paper}>{f>=1672?'融合排名':'RRF 总分'}</Text>
 <Rule x1={110} y1={319} x2={520} y2={319}/><Rule x1={595} y1={319} x2={1005} y2={319}/><Rule x1={1200} y1={319} x2={1810} y2={319}/>
 {docs.map((id,i)=><RankRow key={'k'+id} x={110} y={baseY+i*gap} id={id} rank={i+1} width={410} focus={focus===id} opacity={kw*(focus&&focus!==id?.35:1)}/>)}
 {(['B','C'] as DocId[]).map((id,i)=><RankRow key={'v'+id} x={595} y={baseY+i*gap} id={id} rank={i+1} width={410} focus={focus===id} opacity={vec*(focus&&focus!==id?.35:1)}/>)}
 <g opacity={missing} transform={`translate(595 ${baseY+2*gap})`}><rect width={410} height={116} rx={16} fill="none" stroke={P.line} strokeWidth={2} strokeDasharray="6 8"/><DocIcon x={29} y={25} id="A"/><Text x={108} y={72} size={30} fill={P.muted}>未命中</Text><Text x={367} y={73} size={37} mono anchor="end" fill={P.muted}>0</Text></g>
 <path d="M1050 550H1134M1117 532l18 18-18 18" fill="none" stroke={P.muted} strokeWidth={3}/>
 {docs.map(id=>{
 const p=progress(f,scoreAt[id]+36,16),y=yFor(id),dim=(focus&&focus!==id?.4:1)*(id==='A'?1-aFlight:1);
 const formula=id==='A'?'1/61 + 0':id==='B'?'1/62 + 1/61':'1/63 + 1/62';
 const place=id==='B'?1:id==='C'?2:3;
 return <g key={id} opacity={dim} transform={`translate(1200 ${y})`}>
 <rect width={610} height={116} rx={16} fill="#1B2638" stroke={focus===id?tint(id):P.line} strokeWidth={focus===id?2.5:1.5}/>
 <rect x={0} y={104} width={Math.max(0,610*(score[id]/(2/61))*p)} height={12} rx={5} fill={tint(id)}/>
 <g opacity={progress(f,1672,12)}><Text x={28} y={71} size={37} mono fill={tint(id)}>#{place}</Text></g>
 <DocIcon x={f>=1672?112:28} y={21} id={id}/>
 <g opacity={f<1672?1:0}><Text x={103} y={47} size={25} fill={P.muted}>{p>0?formula:'等待融合'}</Text></g>
 <Text x={f>=1672?190:103} y={f>=1672?73:87} size={f>=1672?31:29}>文档 {id}</Text>
 <Text x={581} y={74} size={44} anchor="end" mono fill={p>0?tint(id):P.line}>{p>0?score[id].toFixed(4):'—'}</Text>
 </g>;
 })}
 <g opacity={aFlight} transform={`translate(1842 ${mix(baseY+24,target('A')+24,progress(f,1684,40))})`}><DocIcon x={0} y={0} id="A"/><Text x={25} y={96} size={22} anchor="middle" fill={P.A}>#3</Text></g>
 <Contribution f={f} at={1320} from={[490,baseY+58]} to={[1220,baseY+58]} color={P.kw} label="1/61"/>
 <Contribution f={f} at={1493} from={[490,baseY+gap+58]} to={[1220,baseY+gap+58]} color={P.kw} label="1/62"/>
 <Contribution f={f} at={1502} from={[975,baseY+58]} to={[1220,baseY+gap+58]} color={P.vec} label="1/61"/>
 <Contribution f={f} at={1589} from={[490,baseY+2*gap+58]} to={[1220,baseY+2*gap+58]} color={P.kw} label="1/63"/>
 <Contribution f={f} at={1598} from={[975,baseY+gap+58]} to={[1220,baseY+2*gap+58]} color={P.vec} label="1/62"/>
 <g opacity={f<1672?progress(f,1243,18):0}>
 <Text x={110} y={875} size={30} fill={focus?tint(focus):P.muted}>{focus==='A'?'A：单路第一，只拿到一份贡献':focus==='B'?'B：第二名 + 第一名，两份贡献汇合':'C：第三名 + 第二名，同样获得两路支持'}</Text>
 </g>
 <g opacity={progress(f,1672,16)}><Text x={110} y={875} size={32} fill={P.kw}>两路支持的 B、C 上升</Text><Text x={1810} y={875} anchor="end" size={32} fill={P.A}>单路第一 A → 第三名</Text></g>
 </>;
};

const Ending:React.FC<{f:number}>=({f})=>{
 const rough=progress(f,1924,22);
 return <>
 <Text x={96} y={168} size={62} weight={800}>RRF 的边界</Text>
 <g transform="translate(112 310)">
 <Text x={0} y={126} size={105} weight={800} fill={P.kw}>融合名次</Text>
 <Text x={0} y={218} size={44} fill={P.muted}>不阅读正文内容</Text>
 <Rule x1={0} y1={289} x2={1700} y2={289}/>
 <g opacity={rough}><Text x={0} y={430} size={84} weight={800}>多路检索的<tspan fill={P.kw}>快速粗排</tspan></Text></g>
 </g>
 <g transform="translate(1370 280)">
 {(['B','C','A'] as DocId[]).map((id,i)=><g key={id} transform={`translate(${i*110} ${i*45})`}><DocIcon x={0} y={0} id={id} scale={1.65}/><Text x={42} y={152} size={27} anchor="middle" mono fill={tint(id)}>#{i+1}</Text></g>)}
 </g>
 </>;
};

const Chapter1:React.FC=()=>{
 const f=useCurrentFrame();const subtitle=timing.subtitles.find(s=>f>=s.startFrame&&f<s.endFrame)?.text??'';
 const stages=['问题','分数困境','RRF','共同尺度','融合演示','适用边界'];
 const index=f<192?0:f<477?1:f<620?2:f<970?3:f<1847?4:5;
 return <AbsoluteFill style={{background:P.bg,fontFamily:FACE}}>
 <Audio src={staticFile('audio/voiceover.wav')} acceptableTimeShiftInSeconds={.3} pauseWhenBuffering/>
 <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
 <defs><pattern id="dot-grid" width={36} height={36} patternUnits="userSpaceOnUse"><circle cx={1} cy={1} r={1} fill="#71839E" opacity={.14}/></pattern></defs>
 <rect width={1920} height={920} fill="url(#dot-grid)"/>
 <Text x={96} y={58} size={25} fill={P.muted} weight={700}>一分钟科普 <tspan fill={P.kw}>/</tspan> RRF</Text>
 <Text x={1815} y={58} size={23} anchor="end" fill={P.muted} mono>{String(index+1).padStart(2,'0')} / 06</Text>
 <Scene f={f} start={0} end={192}><Hook f={f}/></Scene>
 <Scene f={f} start={192} end={477}><Scores f={f}/></Scene>
 <Scene f={f} start={477} end={620}><Definition f={f}/></Scene>
 <Scene f={f} start={620} end={970}><FormulaScene f={f}/></Scene>
 <Scene f={f} start={970} end={1847}><Fusion f={f}/></Scene>
 <Scene f={f} start={1847} end={2100}><Ending f={f}/></Scene>
 <Rule x1={96} y1={930} x2={1824} y2={930}/>
 <rect x={96} y={930} width={1728*clamp(f/1983)} height={3} fill={P.kw}/>
 <Text x={96} y={1040} size={21} fill={P.muted}>{stages[index]}</Text>
 <Text x={1824} y={1040} size={20} anchor="end" mono fill={P.muted}>RANK → SCORE → FUSION</Text>
 </svg>
 <div style={{position:'absolute',left:180,right:180,top:958,height:60,display:'flex',alignItems:'center',justifyContent:'center',color:P.paper,fontSize:38,fontWeight:550,lineHeight:1.45,textAlign:'center',letterSpacing:1}}>{subtitle}</div>
 </AbsoluteFill>;
};
export {Chapter1};
