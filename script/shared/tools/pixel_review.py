"""Geometry review + composition contact sheet. Geometry is measured, aesthetics remain review warnings."""
import argparse, html, json, math
from pathlib import Path


def inside(a, b, tolerance=2):
    return (a['x'] >= b['x']-tolerance and a['y'] >= b['y']-tolerance and
            a['x']+a['width'] <= b['x']+b['width']+tolerance and
            a['y']+a['height'] <= b['y']+b['height']+tolerance)


def intersects(a, b):
    return (min(a['x']+a['width'], b['x']+b['width'])-max(a['x'], b['x']) > 2 and
            min(a['y']+a['height'], b['y']+b['height'])-max(a['y'], b['y']) > 2)


def inspect(sample):
    nodes=sample.get('nodes',[]); findings=[]
    canvas={'x':0,'y':0,'width':sample['width'],'height':sample['height']}
    def add(code, node, message, level='error'):
        findings.append({'code':code,'node':node['id'],'level':level,'message':message})
    for node in nodes:
        box=node['box']
        if not all(math.isfinite(box[k]) for k in ('x','y','width','height')):
            add('invalid-geometry',node,'非有限的画面坐标');continue
        if node.get('required'):
            if not inside(box,canvas) or any(not inside(box,c) for c in node.get('clips',[])):
                add('clipped-subject',node,'完整控件/主体被画布或父容器裁切')
            if not node.get('allowOverlay'):
                for other in nodes:
                    if other['role'] in ('hud','subtitle') and intersects(box,other['box']):
                        add('chrome-collision',node,f"与 {other['id']} 相撞")
        if node['role']=='frame' and node.get('nestedFrame'):
            add('nested-frame',node,'轻量 Mac 窗口套了第二层框')
        if node['role']=='label' and node.get('text'):
            if any(node['text']==n.get('text') for n in nodes if n['role'] in ('hud','subtitle')):
                add('duplicate-text',node,'与标题或字幕重复，核对是否值得强调','warning')
    subjects=[n['box'] for n in nodes if n['role'] in ('subject','control')]
    if not subjects:
        findings.append({'code':'no-subject-coverage','node':'scene','level':'error',
                         'message':'没有标记主体，不能声称通过；给真实对象加 pixelMark/PixelSubject'})
    # Only scenes explicitly choosing occupancy review are checked. Portrait art is not stretched.
    if subjects and sample.get('fillArea'):
        width=max(b['x']+b['width'] for b in subjects)-min(b['x'] for b in subjects)
        height=max(b['y']+b['height'] for b in subjects)-min(b['y'] for b in subjects)
        area=sample['fillArea']
        if width/area['width']<.72 or height/area['height']<.60:
            findings.append({'code':'unused-stage','node':'scene','level':'warning',
              'message':'当前主体占幅偏小；检查是否为后续内容提前留位，或原图比例所需'})
    return findings


def samples_for(chapter):
    frames={}
    for scene in chapter['scenes']:
        start,end=scene['from'],scene['to']
        if not isinstance(start,int) or not isinstance(end,int) or end<=start:
            raise ValueError('Scene needs integer from < to (end exclusive)')
        wanted={start,min(end-1,start+12),end-1,*scene.get('samples',[])}
        for t in scene.get('transitions',[]):
            at,d=t['at'],t.get('duration',18)
            if d<=0:raise ValueError('Transition duration must be positive')
            wanted.update([at-1,at,at+d//2,at+d])
        for frame in sorted(wanted):
            if start<=frame<end:
                frames[(scene['id'],frame)]={'scene':scene['id'],'frame':frame,
                    **({'fillArea':scene['fillArea']} if 'fillArea' in scene else {})}
    return list(frames.values())


def report(samples, out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    rows=[{**s,'findings':inspect(s)} for s in samples]
    result={'schemaVersion':1,'samples':rows,
      'errors':sum(f['level']=='error' for r in rows for f in r['findings']),
      'warnings':sum(f['level']=='warning' for r in rows for f in r['findings'])}
    (out/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    esc=html.escape;cards=[]
    for row in rows:
        reasons=''.join(f"<li class='{f['level']}'>{esc(f['code'])} · {esc(f['node'])}：{esc(f['message'])}</li>" for f in row['findings'])
        image=f"<img src='{esc(row['image'],quote=True)}' loading='lazy'>" if row.get('image') else ''
        clip=f"<video controls preload='metadata' src='{esc(row['clip'],quote=True)}'></video>" if row.get('clip') else ''
        rects=''.join(f"<rect x='{n['box']['x']}' y='{n['box']['y']}' width='{n['box']['width']}' height='{n['box']['height']}'><title>{esc(n['id'])}</title></rect>" for n in row.get('nodes',[]) if n.get('required'))
        cards.append(f"<article><h2>{esc(row.get('scene',''))} · F{row['frame']}</h2><p>{esc(row.get('origin','live DOM'))}</p><div class='screen'>{image}<svg class='bounds' viewBox='0 0 {row['width']} {row['height']}'>{rects}</svg></div>{clip}<ul>{reasons or '<li>已声明的检查项通过</li>'}</ul></article>")
    page="""<!doctype html><html lang='zh'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>像素视频 · 画面审片</title><style>
body{margin:24px;background:#fff2d4;color:#25263b;font:16px -apple-system,sans-serif}h1{font-size:24px}h2{font-size:17px}p{line-height:1.6}.grid{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start}article{width:640px;max-width:100%;background:#fff9e6;padding:0;box-sizing:border-box}article p{font-size:12px}.screen{position:relative}img,video{display:block;width:100%;height:auto}video{margin-top:8px}.bounds{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none}.bounds rect{fill:none;stroke:#e97142;stroke-width:4}.show .bounds{display:block}li{margin:8px 0}.error{color:#a32222}.warning{color:#775600}
@media(max-width:440px){body{margin:0}body>h1,body>p,body>label{margin-left:12px;margin-right:12px}article{width:100%}article h2,article p,article ul{margin-left:12px;margin-right:12px}}
</style><h1>画面与动作审片</h1><p>逐项看清主体、读数与动作。边界检查仅覆盖标记对象；留白、文字重复与像素风一致性仍需人工判断。旧片标注与实时 DOM 测量在卡片中分别注明。</p>
<label><input type='checkbox' onchange="document.body.classList.toggle('show',this.checked)">显示必要主体边界</label>"""
    (out/'index.html').write_text(page+f"<p>硬错误 {result['errors']} · 待审提示 {result['warnings']}</p><div class='grid'>"+''.join(cards)+'</div></html>')
    return result


if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--input',type=Path,required=True);ap.add_argument('--out',type=Path,required=True)
    a=ap.parse_args();r=report(json.loads(a.input.read_text()),a.out)
    print(json.dumps({'errors':r['errors'],'warnings':r['warnings'],'review':str(a.out/'index.html')},ensure_ascii=False))
    raise SystemExit(1 if r['errors'] else 0)
