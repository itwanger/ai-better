// @ts-nocheck
// huashu-art-motion MIT; pinned source + adaptation: provenance.json
const window = {}; const U = {};
// Color-only bridge; painterly hand()/board() helpers need the full engine.
const PAINT = {hex: h => {const s=h.replace("#", ""); return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));}};

// 通用工具（最先加载，转场库与引擎共用）
(() => {
// ---------- 工具 ----------
Object.assign(U, {
  TAU: Math.PI * 2,
  clamp: (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
  lerp: (a, b, p) => a + (b - a) * p,
  // smoothstep：x 在 [a,b] 内平滑地从 0 走到 1（开场写出、渐显、段内节奏都用它）
  ss: (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); },
  // 把 p 的 [a,b] 段线性拉成 0..1（转场里分阶段用）
  seg: (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a))),
  // 步进帧率：把连续时间量化成 fps 步——「一顿一顿」是很多风格的味道本身：
  // 橡皮管卡通 12fps（一拍二）、皮影杆操 10fps、哈林跳舞小人 8fps 硬切、手绘线条沸腾 8–12fps、胶片层 24fps。
  stepTime: (t, fps) => Math.floor(t * fps) / fps,
  ease: {
    linear: p => p,
    inOut: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    out: p => 1 - Math.pow(1 - p, 3),
    in: p => p * p * p,
    outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  },
  // 种子随机：mulberry32
  rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
  hash(i, j = 0) { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
  // 点列 → Path2D（折线）
  poly(pts, closed = true) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; },
});

// ---------- 画布尺寸 ----------
// 默认 1920×1080。竖屏片段（clip.html，spec.width/height）和竖屏整片（index.html?w=1080&h=1920，或 eras.js 里写 window.FILM_SIZE = [1080, 1920]）
// 启动时调一次 U.setStage(w, h)。用到屏幕尺寸的库（PAINT / BRUSH / RENDER / POST / KIT / TOON / CAM / UI / CH / DG / CL / MD、transitions.js、engine.js）
// 用 U.onStage 登记，尺寸一改全部跟着改；登记时立刻按当前尺寸回调一次，后加载的库也拿得到。
// 35 种艺术风格场景（scenes/）是按 1920×1080 画的，竖屏只保证解说语法、转场和引擎本身。
const stageHooks = [];
window.STAGE = { W: 1920, H: 1080 };
U.onStage = f => { stageHooks.push(f); f(window.STAGE.W, window.STAGE.H); };
U.setStage = (w, h) => { w = Math.round(+w); h = Math.round(+h); if (!(w > 0 && h > 0)) throw new Error(`U.setStage：尺寸不对 ${w}×${h}`); window.STAGE = { W: w, H: h }; stageHooks.forEach(f => f(w, h)); };

// ---------- 字形检查 ----------
// 字体文件缺某个字时浏览器会静默回退到系统字体：measureText 不报错、宽度也对，换台机器就变样（迁移测试 B、D：全角字母、▶、「戏」「蓝」都踩过）。
// 做法：启动时（engine boot，字体加载完）把 FONT_FACES 里每个字体文件的 cmap 表读出来（WOFF1 用 DecompressionStream 解 zlib），查表判断有没有这个字。
// 不用 measureText 对比回退字体：macOS 上 Chromium 的逐字回退以首选字体为基准挑系统字体，两种写法会落到不同字体上，缺字也测不出来（实测误判）。
// font 可以是 family 名（'LXGWWenKai-500'）或 CSS 字体串（'80px "LXGWWenKai-500"'）。family 不在 FONT_FACES 里 → 当作全缺。
const famOf = font => { const m = /"([^"]+)"/.exec(font) || /'([^']+)'/.exec(font); return m ? m[1] : String(font).replace(/^(italic\s+|bold\s+|\d+\s+)*[\d.]+px\s+/, '').trim(); };
const CMAPS = {};
const inflate = async (buf) => new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
async function readCmap(url) {
  const ab = await (await fetch(url)).arrayBuffer(), dv = new DataView(ab), sig = dv.getUint32(0);
  let tab = null;
  if (sig === 0x774F4646) {                                            // 'wOFF'
    const n = dv.getUint16(12);
    for (let i = 0; i < n; i++) { const o = 44 + i * 20; if (dv.getUint32(o) !== 0x636D6170) continue;   // 'cmap'
      const off = dv.getUint32(o + 4), comp = dv.getUint32(o + 8), orig = dv.getUint32(o + 12), raw = new Uint8Array(ab, off, comp);
      tab = comp < orig ? await inflate(raw) : raw.slice(); }
  } else {                                                             // 裸 TTF/OTF
    const n = dv.getUint16(4);
    for (let i = 0; i < n; i++) { const o = 12 + i * 16; if (dv.getUint32(o) === 0x636D6170) tab = new Uint8Array(ab, dv.getUint32(o + 8), dv.getUint32(o + 12)).slice(); }
  }
  if (!tab) throw new Error('没有 cmap 表');
  const t = new DataView(tab.buffer, tab.byteOffset, tab.byteLength), set = new Set(), nt = t.getUint16(2);
  for (let i = 0; i < nt; i++) {
    const so = t.getUint32(4 + i * 8 + 4), fmt = t.getUint16(so);
    if (fmt === 4) { const segX2 = t.getUint16(so + 6), ends = so + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ros = deltas + segX2;
      for (let k = 0; k < segX2 / 2; k++) { const e = t.getUint16(ends + k * 2), s = t.getUint16(starts + k * 2), d = t.getInt16(deltas + k * 2), ro = t.getUint16(ros + k * 2);
        for (let ch = s; ch <= e && ch !== 0xFFFF; ch++) { let g; if (!ro) g = (ch + d) & 0xFFFF; else { g = t.getUint16(ros + k * 2 + ro + (ch - s) * 2); if (g) g = (g + d) & 0xFFFF; } if (g) set.add(ch); } } }
    else if (fmt === 12 || fmt === 13) { const ng = t.getUint32(so + 12); for (let k = 0; k < ng; k++) { const o = so + 16 + k * 12, s = t.getUint32(o), e = t.getUint32(o + 4), g = t.getUint32(o + 8);
      for (let ch = s; ch <= e; ch++) if (fmt === 13 ? g : g + ch - s) set.add(ch); } }
    else if (fmt === 0) { for (let ch = 0; ch < 256; ch++) if (t.getUint8(so + 6 + ch)) set.add(ch); }
    else if (fmt === 6) { const first = t.getUint16(so + 6), cnt = t.getUint16(so + 8); for (let k = 0; k < cnt; k++) if (t.getUint16(so + 10 + k * 2)) set.add(first + k); }
  }
  return set;
}
// 引擎 boot 里调用一次（字体加载之后）。读失败的字体记 console.error，不阻断启动。
U.loadCmaps = async (faces = window.FONT_FACES || []) => {
  await Promise.all(faces.map(async f => { try { CMAPS[f.family] = await readCmap(f.url); } catch (e) { console.error(`读不了字体 ${f.family} 的 cmap：${e}`); } }));
};
U.missingGlyphs = (font, text) => {
  const fam = famOf(font), cm = CMAPS[fam];
  const chars = [...new Set([...String(text)])].filter(ch => !/\s/.test(ch));
  if (!cm) return chars;
  return chars.filter(ch => !cm.has(ch.codePointAt(0)));
};
// 缺字就 console.error（qa.py / render.py 会把页面 console.error 当失败）。返回 true = 全都有。
U.assertGlyphs = (font, text, where = '') => {
  const fam = famOf(font), miss = U.missingGlyphs(font, text);
  if (miss.length) console.error(!CMAPS[fam] ? `字体「${fam}」没注册或没读到 cmap（lib/fonts.js 的 FONT_FACES）${where ? '（' + where + '）' : ''}`
    : `缺字形：字体「${fam}」里没有「${miss.join('')}」${where ? '（' + where + '）' : ''}——会静默回退系统字体。用 scripts/font_subset.py 补进子集，或改用路径自画。`);
  return miss.length === 0;
};
U.fontFamily = famOf;

})();


const MO: any = window.MO = {};

// 动效时间库 MO：缓动、弹簧、步进、错开、拍号。全部是「时间 → 数值」的纯函数，不读时钟，确定性。
// 来源：YouTube 解说动画语法 8 支示范片（references/09-视频动画语法.md）。约定：p 是 0..1 的进度，t/lt 是秒。
//   选缓动的一句话：讲解（3b1b/白板）用 smooth/sineInOut 两端都停稳；发布会用 appleOut/弹簧；动态文字用 expoOut＋弹簧；
//   拼贴（Vox）相机用 sineInOut 或长尾 longTail，纸片按 12fps 步进；Kurzgesagt 动作用 k75，循环用 easyEase。
(() => {
const { clamp, lerp } = U;


// 画布尺寸 U.setStage / U.onStage 在 util.js（比本文件先加载的 paint/brush/render/post 也要登记）。

// ---------- 时间片 ----------
MO.seg = (t, a, b) => clamp((t - a) / (b - a));                          // [a,b] → 0..1
MO.at = (t, t0, dur) => clamp((t - t0) / dur);                           // [t0, t0+dur] → 0..1
MO.anim = (lt, start, dur, ease = MO.smooth) => ease(clamp((lt - start) / dur));
// 步进时间：把连续时间量化成 fps 步。拼贴纸片/打字/荧光笔「一拍二」= 12fps；故事型角色 24fps；相机仍按 60fps 平滑。
MO.step = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

// ---------- manim 缓动（3b1b/manim rate_functions.py） ----------
// smooth = 6t⁵−15t⁴+10t³：两端速度、加速度都为 0。讲解类片子的默认缓动。
MO.smooth = t => { t = clamp(t); return t * t * t * (10 - 15 * t + 6 * t * t); };
const sig = x => 1 / (1 + Math.exp(-x));
MO.smoothCE = (t, inflection = 10) => { const e = sig(-inflection / 2); return clamp((sig(inflection * (t - 0.5)) - e) / (1 - 2 * e)); };   // ManimCE 版
MO.thereAndBack = t => MO.smooth(t < 0.5 ? 2 * t : 2 * (1 - t));          // Indicate 用：去了又回
MO.rushInto = t => 2 * MO.smooth(t / 2);                                  // 慢起、冲进终点
MO.rushFrom = t => 2 * MO.smooth(t / 2 + 0.5) - 1;                        // 冲出、慢收
MO.doubleSmooth = t => t < 0.5 ? 0.5 * MO.smooth(2 * t) : 0.5 * (1 + MO.smooth(2 * t - 1));
MO.wiggle = (t, wiggles = 2) => MO.thereAndBack(t) * Math.sin(wiggles * Math.PI * t);
// manim LaggedStart(lag_ratio=r)：n 个子动画里第 i 个在总进度 p 下的局部进度。总长 = 1+(n-1)·r 个单位，第 i 个占 [i·r, i·r+1]。
MO.lagged = (i, n, p, r = 0.05) => clamp(p * (1 + (n - 1) * r) - i * r);

// ---------- 常用解析缓动（AE / CSS 名字） ----------
MO.linear = p => p;
MO.sineInOut = p => -(Math.cos(Math.PI * p) - 1) / 2;
MO.cubicIn = p => p * p * p;
MO.cubicOut = p => 1 - Math.pow(1 - p, 3);
MO.cubicInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
MO.quartOut = p => 1 - Math.pow(1 - p, 4);
MO.quintOut = p => 1 - Math.pow(1 - p, 5);
MO.quintInOut = p => p < .5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2;
MO.expoIn = p => p <= 0 ? 0 : Math.pow(2, 10 * p - 10);
MO.expoOut = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);                // 动效设计最常用的「快出慢停」
MO.expoInOut = p => p <= 0 ? 0 : p >= 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
// backOut 过冲：s=1.70158 约 10%；2.2 约 13%；2.6 约 17%；3.5 约 23%
MO.backOut = (p, s = 1.70158) => { const q = p - 1; return 1 + (s + 1) * q * q * q + s * q * q; };
// 弹性落定：overshoot 一次再回（贴纸「啪」地落下）
MO.elasticOut = p => p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1;

// ---------- CSS cubic-bezier(x1,y1,x2,y2)：牛顿法由 x 求参数，再取 y ----------
MO.bezier = (x1, y1, x2, y2) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p; for (let k = 0; k < 8; k++) { const e = X(s) - p, d = dX(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
    s = clamp(s); return Y(s);
  };
};
MO.appleOut = MO.bezier(0.25, 0.1, 0.25, 1);        // CSS `ease`：苹果官网/发布会过渡
MO.emphasized = MO.bezier(0.2, 0, 0, 1);            // Material 3 emphasized：长尾减速
MO.k75 = MO.bezier(0.75, 0, 0.25, 1);               // Kurzgesagt「其他动作用 75% influence」（y1 调研 §6.2）
MO.easyEase = MO.bezier(0.333, 0, 0.667, 1);        // AE Easy Ease：循环动作
MO.longTail = MO.bezier(0.33, 0, 0.2, 1);           // Vox「沿线追过去」「拉出揭示」：起步快、长尾落定（y2 调研）

// ---------- 弹簧 ----------
// SwiftUI 参数化（WWDC23 Animate with springs）：stiffness=(2π/duration)²，damping=4π(1-bounce)/duration → ζ=1-bounce，ω=2π/duration。
// 返回 0→1 的位移（可 >1 = 过冲）。t 单位秒。发布会 UI 用它：.smooth(bounce 0) / .snappy(0.15) / .bouncy(0.3)。
MO.spring = (t, { duration = 0.5, bounce = 0, v0 = 0 } = {}) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI / duration, z = 1 - bounce;
  let x;                                                                 // x = 剩余位移（1→0）
  if (Math.abs(z - 1) < 1e-4) x = Math.exp(-w * t) * (1 + (w - v0) * t);
  else if (z < 1) { const wd = w * Math.sqrt(1 - z * z); x = Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w - v0) / wd) * Math.sin(wd * t)); }
  else { const r = Math.sqrt(z * z - 1), a = -w * (z - r), b = -w * (z + r); const A = (-v0 - b) / (a - b); x = A * Math.exp(a * t) + (1 - A) * Math.exp(b * t); }
  return 1 - x;
};
MO.smoothSpring = t => MO.spring(t, { duration: 0.5, bounce: 0 });
MO.snappy = t => MO.spring(t, { duration: 0.5, bounce: 0.15 });
MO.bouncy = t => MO.spring(t, { duration: 0.5, bounce: 0.3 });
// 频率/衰减参数化的欠阻尼弹簧阶跃响应（动态文字用）：freq Hz、decay 1/s。
//   freq 3 / decay 6 第一次过冲 ≈37%（砸进来的大字）；2.5 / 9 ≈16%（常规弹入）；2.2 / 10 ≈8%（主词落定）
MO.springHz = (t, freq = 2.5, decay = 9) => t <= 0 ? 0 : 1 - Math.exp(-decay * t) * Math.cos(2 * Math.PI * freq * t);
// 到位后的余振（Dan Ebberts 惯性回弹）：amp·sin(2πft)/e^(decay·t)。换姿势的身体挤压、屏幕震动都用它。
MO.settle = (t, amp, freq = 3, decay = 5) => t <= 0 ? 0 : amp * Math.sin(2 * Math.PI * freq * t) / Math.exp(decay * t);

// ---------- 镜头动作时长（什么时候用哪一种，见 references/镜头语言.md） ----------
// 两类：过渡（缓推 push、找下一件 glide、拉远 pull，0.6–1.5s 缓入缓出）是默认；重音（快推 punch、快移 pan、砸入 slam）留给揭晓、数字、反转。
// 过渡的数取自参考片实测：Vox 推进 1.0–1.5s、找卡 0.5–0.9s、拉出约 1s；3b1b 推镜约 1s。
// 重音的数：一支「每镜匀速推近 7.5%」被判像 PPT 的片子，改成停住→0.28s 快推→停住后被认可；但 2026-10-12 诺奖短片每 2 秒一次快推，被判「太多、太快、不 smooth」。
// 时长常量集中在这里，CAM.track / MD / 各片段都读它；要改节奏改这里，别在片段里另写一套。
MO.PULSE = { punch: 0.28, pan: 0.30, slam: 0.17, k: 0.25, kMin: 0.18, kMax: 0.32, push: 0.9, glide: 0.7, pull: 1.1 };
// 砸入曲线：k = 0..1（砸入进度）→ 缩放。1.55 → 0.94（前 60%，3 帧砸下）→ 1.0（后 40%，2 帧回弹）。k≤0 返回 1.55（还没落下）。
MO.slamK = (k, from = 1.55, under = 0.94) => k <= 0 ? from : k < 0.6 ? from - (from - under) * (k / 0.6) : k < 1 ? under + (1 - under) * ((k - 0.6) / 0.4) : 1;
// 某个元素在 at 这一帧砸进来：返回它此刻的缩放（at 之前 = 0，元素还不该画）。o: {dur=0.17, from=1.55, under=0.94}
MO.slam = (t, at, o = {}) => t < at ? 0 : MO.slamK((t - at) / (o.dur || MO.PULSE.slam), o.from, o.under);
// 动作进度：at 起 dur 秒内按 ease 从 0 走到 1，之后停在 1（默认快推的时长和曲线；缓推写 MO.pulse(t, at, MO.PULSE.push, MO.sineInOut)）
MO.pulse = (t, at, dur = MO.PULSE.punch, ease = MO.cubicInOut) => ease(clamp((t - at) / dur));

// ---------- 持续微动 ----------
// 只给环境层（星闪、粒子、远景云）和艺术风格画面用。解说片的主体、标签、卡片落定后停住，不加浮动、呼吸。
// 漂浮：两频正弦叠加。周期避开 5s 左右（HIG：~0.2Hz 的持续摆动让人不适）
MO.float = (t, amp = 6, period = 4, ph = 0) => amp * (0.75 * Math.sin(2 * Math.PI * t / period + ph) + 0.25 * Math.sin(2 * Math.PI * t / (period * 0.53) + ph * 1.7));

// ---------- 反查与拍号 ----------
// 缓动的反函数（二分）：「线头/计数在什么时刻到达 y」。例：折线按 smooth 画，求画到某个 x 的时刻（t3 镜 2 的事件标注）。
MO.invert = (ease, y, iters = 30) => { let a = 0, b = 1; for (let i = 0; i < iters; i++) { const m = (a + b) / 2; if (ease(m) < y) a = m; else b = m; } return (a + b) / 2; };
// 拍 → 秒
MO.beat = (n, bpm = 120) => n * 60 / bpm;
// 揭开那一帧落在拍上：段起点 = 小节线 − 揭开点 × 转场时长（y5：zoom 揭开点 .55、色带 .6、push 到 90% 位移在 .58）
MO.onBeat = (barTime, revealP, trDur) => barTime - revealP * trDur;
})();


const CAM: any = window.CAM = {};

// 世界相机 CAM：解说片不是「一段段画＋转场」，而是「一张连续的世界画布＋一台相机」。
// 铁律：相机只由全片时间（或本段时间）算出来，场景每帧按相机矢量重画——缩放转场永远清楚，不会把 1920 的位图放大 20 倍糊掉；
//       引擎在转场窗口里会把上一段继续按 t 画进 A 缓冲，所以「上一镜的相机继续推」天然成立（live 推进）。
// cam = { x, y, z, r }：世界点 (x,y) 落在画面中心，缩放 z（>1 推近），绕中心旋转 r（弧度）。缺省 x=960,y=540,z=1,r=0。
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const { clamp, lerp } = U;

const n = cam => ({ x: cam.x ?? W / 2, y: cam.y ?? H / 2, z: cam.z ?? 1, r: cam.r || 0 });

// 把相机变换作用到 c 上（不 save/restore，调用方负责）
CAM.apply = (c, cam) => { const k = n(cam); c.translate(W / 2, H / 2); if (k.r) c.rotate(k.r); c.scale(k.z, k.z); c.translate(-k.x, -k.y); };
// 在相机下画 fn(c)，自动 save/restore
CAM.with = (c, cam, fn) => { c.save(); CAM.apply(c, cam); fn(c); c.restore(); };
// 世界 → 屏幕 / 屏幕 → 世界
CAM.toScreen = (cam, x, y) => { const k = n(cam); let dx = (x - k.x) * k.z, dy = (y - k.y) * k.z; if (k.r) { const cs = Math.cos(k.r), sn = Math.sin(k.r); [dx, dy] = [dx * cs - dy * sn, dx * sn + dy * cs]; } return [W / 2 + dx, H / 2 + dy]; };
CAM.toWorld = (cam, sx, sy) => { const k = n(cam); let dx = sx - W / 2, dy = sy - H / 2; if (k.r) { const cs = Math.cos(-k.r), sn = Math.sin(-k.r); [dx, dy] = [dx * cs - dy * sn, dx * sn + dy * cs]; } return [k.x + dx / k.z, k.y + dy / k.z]; };

// ---------- 缩放 ----------
// 对数插值：z0→z1 每帧放大同样的倍数，观众感到「匀速穿越尺度」；线性插值会前慢后猛。所有推拉缩放都用它。
CAM.zlerp = (z0, z1, e) => z0 * Math.pow(z1 / z0, e);
// 「从一个半径 r 的圆形开口穿进去，开口要在转场结束前盖满屏」需要的最小放大倍数 = 开口中心到最远屏幕角的距离 / r。
// 开口在画面中心时 ≈ 1101/r（卡片里写的「放大倍数 ≥ 1100/半径」）。小了，最后一帧开口没盖满会跳。
CAM.coverZoom = (r, cx = W / 2, cy = H / 2) => Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) / r;
// 让世界点 (wx,wy) 在缩放 z 下出现在屏幕 (sx,sy)：返回相机。推近某物时让它平滑移到画面中心就靠它。
CAM.anchor = (wx, wy, z, sx, sy) => ({ x: wx - (sx - W / 2) / z, y: wy - (sy - H / 2) / z, z });
// 推进某个世界点：从 base 相机出发，缩放按对数插值到 Z（进度 e）；该点在屏幕上从原位置移向画面中心（进度 k，默认 = e；k=0 = 绕它原地推）。
// 用于「钻进镜头」（y1）、「推满照片再硬切」（y2）、「推进最新数据点」（t3，k=0）。
CAM.pushTo = (base, wx, wy, Z, e, k = e, to = [W / 2, H / 2]) => {
  const s0 = CAM.toScreen(base, wx, wy), z = CAM.zlerp(n(base).z, Z, e);
  return CAM.anchor(wx, wy, z, lerp(s0[0], to[0], k), lerp(s0[1], to[1], k));
};

// ---------- 关键帧 ----------
// keys = [{t, x, y, z, r, ease}]；ease 作用在「从上一键到这一键」，默认 cubicInOut；z 用对数插值。
// 沿路径平移（Vox 桌面、白板上的平移/甩镜）就是一串关键帧：平滑移动用 sineInOut，远跳用 cubicInOut＋运动模糊，沿线追用 MO.longTail。
CAM.at = (keys, t) => {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) { const e = (b.ease || MO.cubicInOut)(MO.seg(t, a.t, b.t));
      return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: CAM.zlerp(a.z, b.z, e), r: lerp(a.r || 0, b.r || 0, e), v: e }; }
  }
  return { ...keys[keys.length - 1] };
};

// ---------- 镜头动作表（解说片用它；什么时候用哪一种见 references/镜头语言.md） ----------
// 默认是过渡类动作：缓推 push、找下一件 glide、拉远 pull（0.6–1.5s，sineInOut / 长尾）；重音类：快推 punch、快移 pan、砸入 slam，
// 留给揭晓、数字、反转。时长在 MO.PULSE。一支片子里推近要有来有回：推进去之后用 pull、glide 或硬切换开，别一镜接一镜只往里推。
// CAM.track(base, events, t) → cam：base 是起始相机 {x, y, z}；events 是按时间排的镜头动作，相机只由 t 算出来（确定性，可跳帧）。
// 每个动作从「上一个动作结束时的相机」出发，到 at + dur 落定；两个动作挨太近（上一个没走完下一个就开始）时，下一个从上一个此刻的位置接着走。
//   {at, kind: 'push', k?, x?, y?, dur?}    缓推（不写 kind 就是它）：z 乘以 (1+k)（k 默认 0.2），0.9s sineInOut；给 x, y 就同时把这个世界点移到画面中心。
//   {at, kind: 'pull', k?, x?, y?, z?, dur?} 拉远：z 乘以 (1+k)（k 默认 -1/6，正好抵消一次默认缓推；回全貌最稳是写 z: base.z），1.1s 长尾。推进去之后回到全貌、段落收束用它。
//   {at, kind: 'glide', x, y, dur?}         找下一件：缩放不变，画面中心平滑移到世界点 (x, y)，0.7s sineInOut。同一面墙上从一件移到下一件。
//   {at, kind: 'to', x?, y?, z?, dur?, ease?} 推到指定相机（推近截图上的一块：z 用 MD.zoomFor 算）；默认 0.9s sineInOut，写 dur: MO.PULSE.punch 就是重音。
//   {at, kind: 'punch', k?, x?, y?, dur?}   快推（重音）：0.28s cubicInOut，k 默认 0.25（0.18–0.32）。k 可以写负数（快拉）。
//   {at, kind: 'pan', x, y, dur?}            快移（重音）：同倍率 0.30s。视线突然转移、喜剧节奏用。
//   {at, kind: 'slam', dur?, from?}          整帧砸入：z 额外乘 MO.slamK（1.55→0.94→1.0，0.17s）。大字、数字、盖章落下那一帧用。
//   {at, kind: 'shake', amp?, dur?}          震镜：dur（默认 4 帧 ≈ 0.13s）内上下抖 amp 像素（默认 14），和砸入、盖章同帧用，一支片子别超过两次。
//   {at, kind: 'cut', x?, y?, z?}            硬切到这台相机（不过渡）。换景别不一定要运镜，跳近一档就是硬切。
// 返回的 cam 带 moving: true/false（这一刻是否在运动），给运动模糊、标签显隐用。
CAM.track = (base, events, t) => {
  let cam = { x: base.x ?? W / 2, y: base.y ?? H / 2, z: base.z ?? 1 }, zMul = 1, dy = 0, moving = false;
  const evs = [...events].sort((a, b) => a.at - b.at);
  for (const e of evs) {
    if (t < e.at) break;
    const P = MO.PULSE, kind = e.kind || 'push';
    if (kind === 'cut') { cam = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: e.z ?? cam.z }; continue; }
    if (kind === 'slam') { const d = e.dur || P.slam, k = (t - e.at) / d; if (k < 1) { zMul *= MO.slamK(k, e.from); moving = true; } continue; }
    if (kind === 'shake') { const d = e.dur || 4 / 30, k = (t - e.at) / d; if (k < 1) { dy += (e.amp ?? 14) * Math.sin(k * Math.PI * 4) * (1 - k) / cam.z; moving = true; } continue; }
    const D = { pan: P.pan, punch: P.punch, glide: P.glide, pull: P.pull, push: P.push, to: P.push }[kind] ?? P.push;
    const E = kind === 'punch' || kind === 'pan' || (e.dur && e.dur <= 0.35) ? MO.cubicInOut : kind === 'pull' ? MO.longTail : MO.sineInOut;   // 写了重音时长的 to 也用快推的曲线
    const d = e.dur || D, p = (e.ease || E)(clamp((t - e.at) / d));
    let to;
    if (kind === 'pan' || kind === 'glide') to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: cam.z };
    else if (kind === 'to') to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: e.z ?? cam.z };
    else if (kind === 'pull') to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: e.z ?? cam.z * (1 + (e.k ?? -1 / 6)) };   // 默认 ×5/6，正好抵消一次默认缓推（×1.2）
    else to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: cam.z * (1 + (e.k ?? (kind === 'push' ? 0.2 : P.k))) };
    if (p < 1) moving = true;
    cam = { x: lerp(cam.x, to.x, p), y: lerp(cam.y, to.y, p), z: CAM.zlerp(cam.z, to.z, p) };
  }
  return { x: cam.x, y: cam.y + dy, z: cam.z * zMul, moving };
};

// ---------- 视差 ----------
// d=1 是主体平面，d<1 远、d>1 近。远层位移按 d 线性、缩放按 z^d：深推时远景几乎不动，这就是景深感（Kurzgesagt 5 层视差）。
CAM.layer = (c, cam, d, fn) => { const k = n(cam); c.save(); CAM.apply(c, { x: lerp(W / 2, k.x, d), y: lerp(H / 2, k.y, d), z: Math.pow(k.z, d) }); fn(c); c.restore(); };

// ---------- 运动 ----------
// 相机在屏幕上的瞬时速度（像素/帧，60fps）：camFn(t) → cam。给 motionBlur 用。
CAM.velocity = (camFn, t, dt = 1 / 60) => { const a = camFn(t), b = camFn(t - dt); const z = n(a).z; return [(n(a).x - n(b).x) * z, (n(a).y - n(b).y) * z]; };
// 动态模糊：沿速度方向把整帧叠 n 次（快摇/甩镜用；速度 <1.5px 自动退化成一次绘制）。模糊长度应短于相机位移（PremiumBeat）。
CAM.motionBlur = (c, src, vx, vy, k = 7) => {
  const sp = Math.hypot(vx, vy); if (sp < 1.5) { c.drawImage(src, 0, 0); return; }
  c.save(); for (let i = 0; i < k; i++) { const q = i / (k - 1) - 0.5; c.globalAlpha = i === 0 ? 1 : 1 / (i + 1); c.drawImage(src, -vx * q, -vy * q); } c.restore();
};
// 手持感微漂：两路不同周期的正弦（连续时间，不闪），返回 [dx, dy] 像素。只给艺术风格画面和纯氛围镜头；解说镜头停住时就停住，不加微漂
CAM.drift = (t, amp = 6, seed = 0) => [amp * Math.sin(t * 0.9 + seed) + amp * 0.4 * Math.sin(t * 2.3 + seed * 2), amp * 0.7 * Math.sin(t * 1.1 + seed * 3)];
})();


const DG: any = window.DG = {};

// 图解与形变 DG：点列、逐笔描出（draw-on）、揭开遮罩、手绘抖动线、manim 式 Transform / Write、白板笔画时间线＋跟随的笔、
// 神经网络（神经元/连线/信号闪过）、Indicate / Circumscribe / 大括号、3b1b 色板。
// 约定：点列 pts = [[x,y],...]；cum = DG.cum(pts) 是累计弧长；「画到 d」都按弧长算。确定性：随机全走种子。
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const { clamp, lerp, rng } = U;


// ---------- 点列 ----------
DG.cum = pts => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; };
DG.len = pts => { const L = DG.cum(pts); return L[L.length - 1]; };
// 折线上弧长 d 处的点
DG.pointAt = (pts, cum, d) => {
  if (d <= 0) return pts[0]; const n = pts.length; if (d >= cum[n - 1]) return pts[n - 1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
  const q = (d - cum[lo]) / (cum[hi] - cum[lo] || 1); return [lerp(pts[lo][0], pts[hi][0], q), lerp(pts[lo][1], pts[hi][1], q)];
};
// 逐笔描出：画折线的前 d 长度（用当前 strokeStyle/lineWidth），返回笔尖位置。白板、红笔圈、红线连接都用它。
DG.drawPartial = (c, pts, cum, d) => {
  const n = pts.length; if (d <= 0 || n < 2) return pts[0];
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  let i = 1; for (; i < n && cum[i] <= d; i++) c.lineTo(pts[i][0], pts[i][1]);
  let tip = pts[n - 1];
  if (i < n) { tip = DG.pointAt(pts, cum, d); c.lineTo(tip[0], tip[1]); }
  c.stroke(); return tip;
};
// 变换点列：平移 (dx,dy)、缩放 s
DG.xform = (pts, dx, dy, s = 1) => pts.map(([x, y]) => [dx + x * s, dy + y * s]);
// 椭圆弧点列（a0→a1）
DG.arcPts = (cx, cy, rx, ry, a0, a1, n = 24) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
// 手画的圈：从 a0 起转 turns 圈（>1 首尾略交叉，像真的用笔圈）
DG.ellipsePts = (cx, cy, rx, ry, a0 = -Math.PI / 2, turns = 1.08, n = 64) => DG.arcPts(cx, cy, rx, ry, a0, a0 + turns * Math.PI * 2, n);
// 手绘抖动：Catmull-Rom 加密后按种子加低频抖动（静态，不沸腾——白板上的线画完就不动）
DG.hand = (pts, { per = 8, amp = 1.6, seed = 1, freq = 0.035 } = {}) => {
  const d = KIT.densify(pts, per), r = rng(seed), ph = r() * 100;
  return KIT.resample(d, 3).map(([x, y], i) => [x + PAINT.noise(i * freq + ph, 3.1) * amp * 2, y + PAINT.noise(i * freq + ph, 7.7) * amp * 2]);
};
// 揭开遮罩：沿折线前 d 长度，每段做成同向绕行的方条（方头延长 w/2），合成一条 Path2D 用来 clip。
// VideoScribe 的「Reveal」画法：之字形笔触从上往下揭开一张画；也用于逐字书写。同向绕行保证 nonzero 下重叠处不抵消。
DG.revealMask = (pts, cum, d, w) => {
  const p = new Path2D(), h = w / 2;
  for (let i = 1; i < pts.length && cum[i - 1] < d; i++) {
    const a = pts[i - 1], b0 = pts[i], L = cum[i] - cum[i - 1]; if (L <= 0) continue;
    const q = Math.min(1, (d - cum[i - 1]) / L), b = [a[0] + (b0[0] - a[0]) * q, a[1] + (b0[1] - a[1]) * q];
    const ux = (b0[0] - a[0]) / L, uy = (b0[1] - a[1]) / L, nx = -uy * h, ny = ux * h;
    const A = [a[0] - ux * h, a[1] - uy * h], B = [b[0] + ux * h, b[1] + uy * h];
    p.moveTo(A[0] + nx, A[1] + ny); p.lineTo(B[0] + nx, B[1] + ny); p.lineTo(B[0] - nx, B[1] - ny); p.lineTo(A[0] - nx, A[1] - ny); p.closePath();
  }
  return p;
};
// 之字形揭开路径：在框 (x,y,w,h) 里从上往下 rows 行来回
DG.zigzag = (x, y, w, h, rows) => { const o = []; for (let r = 0; r <= rows; r++) { const yy = y + h * r / rows; o.push(r % 2 ? [x + w, yy] : [x, yy]); } return o; };

// ---------- manim Transform：两边点数相同、起点对齐（都从左上方向起、顺时针）才能逐点插值 ----------
DG.rectPts = (cx, cy, w, h, n = 64) => {
  const per = 2 * (w + h), out = [];
  for (let i = 0; i < n; i++) {
    let d = i / n * per; let x, y;
    if (d < w) { x = cx - w / 2 + d; y = cy - h / 2; }
    else if ((d -= w) < h) { x = cx + w / 2; y = cy - h / 2 + d; }
    else if ((d -= h) < w) { x = cx + w / 2 - d; y = cy + h / 2; }
    else { d -= w; x = cx - w / 2; y = cy + h / 2 - d; }
    out.push([x, y]);
  }
  return out;
};
DG.circlePts = (cx, cy, r, n = 64) => { const out = []; for (let i = 0; i < n; i++) { const a = -3 * Math.PI / 4 + i / n * 2 * Math.PI; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; };
DG.morph = (A, B, p) => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
DG.shape = (c, pts, { fill, stroke, lw = 2 } = {}) => {
  c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && lw > 0) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
};

// ---------- 颜色（接受 '#hex' 或 [r,g,b]） ----------
DG.arr = h => Array.isArray(h) ? h : PAINT.hex(h);
DG.mixA = (h1, h2, t) => { const a = DG.arr(h1), b = DG.arr(h2); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
DG.rgba = (h, a = 1) => { const v = DG.arr(h); return `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a})`; };
DG.mix = (h1, h2, t) => DG.rgba(DG.mixA(h1, h2, t));
// 3b1b 色板。Grant 的 custom_config 在 ffmpeg 导出时 saturation=1.5，照 manim 原色值直接用会发灰，所以 DG.MANIM 是饱和后的。
DG.MANIM_RAW = { BLUE_C: '#58C4DD', BLUE_D: '#29ABCA', BLUE_E: '#1C758A', TEAL_C: '#5CD0B3', GREEN_C: '#83C167', YELLOW: '#FFFF00', GOLD_C: '#F0AC5F',
  RED_C: '#FC6255', MAROON_C: '#C55F73', PURPLE_C: '#9A72AC', GREY_A: '#DDDDDD', GREY_B: '#BBBBBB', GREY_C: '#888888', GREY_D: '#444444', GREY_E: '#222222', WHITE: '#FFFFFF', BLACK: '#000000' };
DG.saturate = (hex, s = 1.5) => {                         // CSS/SVG saturate 矩阵
  const [r, g, b] = PAINT.hex(hex);
  const R = (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b;
  const G = (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b;
  const B = (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b;
  const f = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return '#' + f(R) + f(G) + f(B);
};
DG.MANIM = {}; for (const k in DG.MANIM_RAW) DG.MANIM[k] = DG.saturate(DG.MANIM_RAW[k]);
DG.U = H / 8;                                             // manim：画面高 8 个单位 → 1 单位 = 135px（1080p）

// ---------- Write 与公式（CMU = LaTeX Computer Modern；中文用思源宋） ----------
DG.FONT = { rm: 'CMU-rm', it: 'CMU-it', zh: 'NotoSerifSC' };
const famOf = tk => tk.zh ? DG.FONT.zh : tk.it ? DG.FONT.it : DG.FONT.rm;
// tokens: [{s, it, zh, col, sub, sup, size, gap}]；返回每个 token 的 {x,w,sz}（相对起点）
DG.layout = (c, tokens, size) => {
  let x = 0; return tokens.map(tk => {
    const sz = (tk.size || 1) * size; c.font = `${sz}px "${famOf(tk)}"`;
    const w = c.measureText(tk.s).width; let sw = 0;
    if (tk.sub || tk.sup) { c.font = `${sz * 0.62}px "${DG.FONT.rm}"`; sw = c.measureText(tk.sub || tk.sup).width + sz * 0.04; }
    const r = { x, w: w + sw, sz }; x += w + sw + (tk.gap != null ? tk.gap : sz * 0.06); return r;
  });
};
// manim Write：每个 token 先沿轮廓描边（lineDash 推进），后半程填色、描边淡掉；token 间 lag = min(4/(n+1), 0.2)（3b1b creation.py）。
// 尊重外层 globalAlpha（FadeOut 时整条公式一起淡）。返回每个 token 的屏幕 {x,w}。
DG.math = (c, tokens, x, y, size, { p = 1, align = 'center', col = '#fff', lag } = {}) => {
  const L = DG.layout(c, tokens, size), total = L.length ? L[L.length - 1].x + L[L.length - 1].w : 0;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const n = tokens.length, r = lag != null ? lag : Math.min(4 / (n + 1), 0.2);
  const A0 = c.globalAlpha;
  c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  tokens.forEach((tk, i) => {
    const q = MO.lagged(i, n, clamp(p), r); if (q <= 0) return;
    const sz = L[i].sz, fx = x0 + L[i].x, colr = tk.col || col;
    const draw = (txt, xx, yy, f, mode) => { c.font = f; mode === 's' ? c.strokeText(txt, xx, yy) : c.fillText(txt, xx, yy); };
    const main = `${sz}px "${famOf(tk)}"`, small = `${sz * 0.62}px "${DG.FONT.rm}"`;
    c.font = main; const mw = c.measureText(tk.s).width;
    const parts = [[tk.s, fx, y, main]]; if (tk.sub) parts.push([tk.sub, fx + mw + sz * 0.02, y + sz * 0.22, small]); if (tk.sup) parts.push([tk.sup, fx + mw + sz * 0.02, y - sz * 0.42, small]);
    const qs = MO.doubleSmooth(q);
    if (qs < 1) { c.strokeStyle = colr; c.lineWidth = Math.max(1.2, sz * 0.025); c.setLineDash([sz * 5 * clamp(qs * 2), 1e5]); c.globalAlpha = A0 * (1 - clamp((qs - 0.6) / 0.4)); parts.forEach(pt => draw(pt[0], pt[1], pt[2], pt[3], 's')); c.setLineDash([]); }
    const fa = clamp((qs - 0.4) / 0.6); if (fa > 0) { c.globalAlpha = A0 * fa; c.fillStyle = colr; parts.forEach(pt => draw(pt[0], pt[1], pt[2], pt[3], 'f')); }
    c.globalAlpha = A0;
  });
  c.restore();
  return L.map(l => ({ x: x0 + l.x, w: l.w }));
};
// 纯文本的 Write（中文标题也走这个：非 ASCII 字自动用 DG.FONT.zh）
DG.write = (c, text, x, y, size, p, opt = {}) => DG.math(c, [...text].map(ch => ({ s: ch, zh: /[^\x00-\x7f]/.test(ch) || opt.zh, gap: 0 })), x, y, size, { ...opt, p });

// ---------- 神经网络 ----------
// 神经元：描边白 2px，填充不透明度 = 激活值（3b1b nn/part1.py 原做法）
DG.neuron = (c, x, y, r, a, { stroke = '#fff', fill = '#fff', lw = 2, sa = 1 } = {}) => {
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  if (a > 0) { c.globalAlpha = clamp(a); c.fillStyle = fill; c.fill(); }
  c.globalAlpha = sa; c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); c.restore();
};
// 圆周到圆周的连线端点
DG.edgeEnds = (ax, ay, ar, bx, by, br) => { const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1; return [ax + dx / d * ar, ay + dy / d * ar, bx - dx / d * br, by - dy / d * br]; };
// 连线：正权重蓝、负权重红；线宽 = minW + maxW·|w|³（nn/part2.py：3·(|w|/max)³）；p = 画到哪（ShowCreation）
DG.edge = (c, e, w, p = 1, { maxW = 3.2, minW = 0.6, pos = DG.MANIM.BLUE_C, neg = DG.MANIM.RED_C, alpha = 0.85, from = 0 } = {}) => {
  if (p <= from) return;
  const [x1, y1, x2, y2] = e;
  c.save(); c.strokeStyle = w >= 0 ? pos : neg; c.globalAlpha = alpha; c.lineWidth = minW + maxW * Math.pow(Math.min(1, Math.abs(w)), 3);
  c.beginPath(); c.moveTo(lerp(x1, x2, from), lerp(y1, y2, from)); c.lineTo(lerp(x1, x2, p), lerp(y1, y2, p)); c.stroke(); c.restore();
};
// ShowPassingFlash（time_width=2.0）：信号沿线闪过，返回可见段 [lo, hi]（0..1）
DG.flash = (alpha, tw = 2) => { const up = lerp(0, 1 + tw, alpha); return [clamp(up - tw), clamp(up)]; };

// ---------- 提示 ----------
DG.indicate = p => ({ s: 1 + 0.2 * MO.thereAndBack(clamp(p)), k: MO.thereAndBack(clamp(p)) });   // 放大 1.2、染黄（k）、回来
// Circumscribe：矩形框沿周长画出再收走（time_width 0.3 的近似）
DG.circumscribe = (c, x, y, w, h, p, { col = DG.MANIM.YELLOW, lw = 4, tw = 0.3 } = {}) => {
  if (p <= 0 || p >= 1) return; const pts = DG.rectPts(x + w / 2, y + h / 2, w, h, 160);
  const hi = clamp(lerp(0, 1 + tw, p)), lo = clamp(hi - tw - (1 - p) * 0.7);
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  const i0 = Math.floor(lo * 160), i1 = Math.floor(hi * 160); for (let i = i0; i <= Math.min(160, i1); i++) { const q = pts[i % 160]; i === i0 ? c.moveTo(q[0], q[1]) : c.lineTo(q[0], q[1]); } c.stroke(); c.restore();
};
// 大括号（竖直，开口朝右），从中间向两端长出
DG.brace = (c, x, y0, y1, { col = '#fff', lw = 3, depth = 22, p = 1 } = {}) => {
  if (p <= 0) return; const ym = (y0 + y1) / 2;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.globalAlpha = clamp(p * 1.5);
  const k = MO.smooth(p), a0 = lerp(ym, y0, k), a1 = lerp(ym, y1, k);
  c.beginPath(); c.moveTo(x, a0); c.quadraticCurveTo(x - depth * 0.5, a0, x - depth * 0.5, a0 + Math.min(40, (ym - a0) * 0.3));
  c.lineTo(x - depth * 0.5, ym - Math.min(40, (ym - a0) * 0.3)); c.quadraticCurveTo(x - depth * 0.5, ym, x - depth, ym);
  c.quadraticCurveTo(x - depth * 0.5, ym, x - depth * 0.5, ym + Math.min(40, (a1 - ym) * 0.3));
  c.lineTo(x - depth * 0.5, a1 - Math.min(40, (a1 - ym) * 0.3)); c.quadraticCurveTo(x - depth * 0.5, a1, x, a1); c.stroke(); c.restore();
};

// ---------- 白板：笔画时间线 ＋ 一支跟着画的笔 ----------
// 按顺序往板上加笔画，每笔时长 = 长度 / 笔速，自动排成时间线；画的时候笔尖永远在最新那一笔的前沿，两笔之间沿弧线滑过去，笔从不离开画面。
//   const B = DG.board({ ink, lw, speed, font });  B.at(0.12); B.line(pts); B.text('猫？', x, y, 150, {rate: 7.5}); B.pop('×1000万张', x, y, 74); ...
//   每帧：const { tip, col } = B.draw(g, ft)（在世界坐标里画，调用方先套相机）；const [sx, sy] = B.penAt(ft, cam, tip)；DG.pen(c, sx, sy, col || B.penColor(ft))。
// 自定义笔画 B.push({ kind:'custom', t0, t1, col, draw(g, q, ft) → 笔尖|null, start() → 世界点, end() → 世界点, handed:true })。
// 速度口径（RSA 实测）：正文写字 ≈16 字/秒、标题 ≈7.5 字/秒；强调色关键词不带手、整词弹出（后期合成）。
DG.board = ({ ink = '#0A0503', lw = 6.5, speed = 2600, font = '"LXGWWenKai-500"' } = {}) => {
  const B = { S: [], cur: 0, ink, lw, speed, font };
  B.at = t => { B.cur = t; return B; };
  B.push = s => { B.S.push(s); return s; };
  B.line = (raw, { w = lw, col = ink, speed: sp = speed, seed = B.S.length + 1, amp = 1.4, smooth = true, min = 0.04, gap = 0.02 } = {}) => {
    const pts = smooth ? DG.hand(raw, { amp, seed, per: 8 }) : raw, cum = DG.cum(pts), len = cum[cum.length - 1];
    const d = Math.max(min, len / sp); B.S.push({ kind: 'line', pts, cum, len, w, col, t0: B.cur, t1: B.cur + d }); B.cur += d + gap;
  };
  // 一笔直线（不抖、固定时长，比如网络连线），不推进太多时间
  B.segment = (a, b, { w = 3, col = ink, dur = 0.06, gap = 0.012 } = {}) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); B.S.push({ kind: 'line', pts: [a, b], cum: [0, L], len: L, w, col, t0: B.cur, t1: B.cur + dur }); B.cur += gap;
  };
  // 手写字：rate 字/秒
  B.text = (str, x, y, size, { col = ink, rate = 16, align = 'left', dur } = {}) => {
    const d = dur || [...str].length / rate; B.S.push({ kind: 'text', str, x, y, size, col, align, t0: B.cur, t1: B.cur + d }); B.cur += d + 0.03;
  };
  // 强调词：不带手、0.3s 放大回落整词弹出
  B.pop = (str, x, y, size, { col = ink, align = 'center', dur = 0.3 } = {}) => { B.S.push({ kind: 'pop', str, x, y, size, col, align, t0: B.cur, t1: B.cur + dur }); B.cur += 0.12; };
  // 铺色（淡入，不推进时间）
  B.fill = (path, col, dur = 0.18) => { B.S.push({ kind: 'fill', path, col, t0: B.cur, t1: B.cur + dur }); };

  const drawOne = (g, s, ft) => {
    if (ft < s.t0) return null;
    const q = clamp((ft - s.t0) / (s.t1 - s.t0));
    if (s.kind === 'custom') return s.draw(g, q, ft);
    if (s.kind === 'fill') { g.save(); g.globalAlpha = q; g.fillStyle = s.col; g.fill(s.path); g.restore(); return null; }
    if (s.kind === 'line') { g.strokeStyle = s.col; g.lineWidth = s.w; return DG.drawPartial(g, s.pts, s.cum, s.len * MO.sineInOut(q)); }
    if (s.kind === 'pop') {
      g.save(); g.font = `${s.size}px ${B.font}`; g.fillStyle = s.col; g.textBaseline = 'alphabetic'; g.textAlign = s.align;
      const e = MO.backOut(q, 2.2); g.globalAlpha = clamp(q * 4); g.translate(s.x, s.y - s.size * 0.35); g.scale(e, e); g.fillText(s.str, 0, s.size * 0.35); g.restore(); return null;
    }
    if (s.kind === 'text') {
      // 逐字写：笔尖在字框里 3 行之字形来回，遮罩跟着笔尖揭开这个字（Reveal 画法用在单字上）
      g.save(); g.font = `${s.size}px ${B.font}`; g.fillStyle = s.col; g.textBaseline = 'alphabetic';
      const chars = [...s.str], ws = chars.map(ch => g.measureText(ch).width), w = ws.reduce((a, b) => a + b, 0), x0 = s.align === 'center' ? s.x - w / 2 : s.x;
      const n = chars.length, k = Math.min(n, q * n), done = Math.floor(k);
      let x = x0, tip = null;
      chars.forEach((ch, i) => {
        if (i < done) g.fillText(ch, x, s.y);
        else if (i === done && k < n) {
          const zz = DG.zigzag(x - 2, s.y - s.size * 0.95, ws[i] + 4, s.size * 1.15, 3), cum = DG.cum(zz), d = cum[cum.length - 1] * (k - done);
          g.save(); g.clip(DG.revealMask(zz, cum, d, s.size * 0.62)); g.fillText(ch, x, s.y); g.restore(); tip = DG.pointAt(zz, cum, d);
        }
        x += ws[i];
      });
      g.restore(); return tip || [x0 + w, s.y - s.size * 0.35];
    }
    return null;
  };
  // 画全部笔画（世界坐标）。返回正在画的那一笔的笔尖与墨色（没有在画的 → tip=null）
  B.draw = (g, ft) => {
    g.lineJoin = 'round'; g.lineCap = 'round';
    let tip = null, col = null;
    for (const s of B.S) { const p = drawOne(g, s, ft); if (p && ft < s.t1) { tip = p; col = s.col; } }
    return { tip, col };
  };
  const handed = () => B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill' && (s.kind !== 'custom' || s.handed !== false));
  const tw = s => s.size * [...s.str].length * 0.9;
  const endPt = s => s.kind === 'custom' ? s.end() : s.kind === 'line' ? s.pts[s.pts.length - 1] : [s.align === 'center' ? s.x + tw(s) / 2 : s.x + tw(s), s.y - s.size * 0.3];
  const startPt = s => s.kind === 'custom' ? s.start() : s.kind === 'line' ? s.pts[0] : [s.align === 'center' ? s.x - tw(s) / 2 : s.x, s.y - s.size * 0.3];
  // 笔在屏幕上的位置：在画 → 笔尖；两笔之间 → 从上一笔终点沿弧线滑到下一笔起点；开场 → 从右下入画
  B.penAt = (ft, cam, tip) => {
    if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
    let prev = null, next = null;
    for (const s of handed()) { if (s.t1 <= ft) prev = s; else if (s.t0 > ft && !next) next = s; }
    if (prev && next) {
      const q = MO.sineInOut((ft - prev.t1) / (next.t0 - prev.t1)), a = CAM.toScreen(cam, ...endPt(prev)), b = CAM.toScreen(cam, ...startPt(next));
      return [lerp(a[0], b[0], q), lerp(a[1], b[1], q) - Math.sin(q * Math.PI) * Math.min(80, 20 + Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.15)];
    }
    if (next) { const b = CAM.toScreen(cam, ...startPt(next)), q = MO.cubicOut(clamp(ft / next.t0)); return [lerp(W * 0.62, b[0], q), lerp(H * 0.7, b[1], q)]; }
    return CAM.toScreen(cam, ...endPt(prev));
  };
  // 空档里笔的颜色 = 下一笔的墨色（没有下一笔就用上一笔）
  B.penColor = ft => { const hs = handed(), nx = hs.find(s => s.t0 > ft), pv = [...hs].reverse().find(s => s.t1 <= ft); return (nx || pv || { col: ink }).col; };
  return B;
};
// 一支马克笔（屏幕空间，笔尖在 (x,y)，笔身朝右上）。笔尾帽 = 墨色；有高光和投影，浮在板上。用笔引导视线。
DG.pen = (c, x, y, col, tilt = 0) => {
  c.save(); c.translate(x, y); c.rotate(-0.72 + tilt);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.roundRect(30, 14, 250, 34, 16); c.fill();
  c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -8); c.lineTo(26, 8); c.closePath(); c.fill();
  c.fillStyle = '#e8e8e4'; c.beginPath(); c.roundRect(24, -12, 26, 24, 4); c.fill();
  c.fillStyle = '#26262a'; c.beginPath(); c.roundRect(48, -17, 190, 34, 12); c.fill();
  c.fillStyle = col; c.beginPath(); c.roundRect(212, -18, 46, 36, 10); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.roundRect(60, -12, 140, 7, 4); c.fill();
  c.restore();
};
})();


export {U, MO, CAM, DG};
