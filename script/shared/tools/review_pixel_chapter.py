"""Render transition boundaries + contact frames and build a composition review. Uses chapter-local frames."""
import argparse,json,subprocess,sys
from pathlib import Path
from pixel_review import report,samples_for


def review(project,chapter,composition=None):
    project=Path(project).resolve();path=project/'assets/references/pixel-review.json'
    if not path.exists():
        print('Pixel review: legacy project has no manifest; geometry coverage NOT assessed.');return None
    manifest=json.loads(path.read_text())
    if chapter not in manifest.get('chapters',{}):raise ValueError('Add this chapter to assets/references/pixel-review.json; see Skill CODE_CONTRACT.md')
    spec=manifest['chapters'][chapter];samples=samples_for(spec)
    if not samples:raise ValueError('No scenes to review')
    events_path=project/'build/pixel-events.json'
    if events_path.exists():
        for e in json.loads(events_path.read_text())['chapters'].get(chapter,[]):
            for frame in [e['frame']-1,e['frame'],e['frame']+1]:
                scene=next((s for s in spec['scenes'] if s['from']<=frame<s['to']),None)
                if scene:samples.append({'scene':scene['id'],'frame':frame})
    samples=list({(s['scene'],s['frame']):s for s in samples}.values())
    out=project/'preview'/f'{chapter}-pixel-review';out.mkdir(parents=True,exist_ok=True)
    commands=[f's{i}:{s["frame"]}' for i,s in enumerate(samples)]
    subprocess.run(['node',str(Path(__file__).with_name('render_frames.mjs')),'--project',str(project),
      '--composition',composition or spec.get('composition',f'Chapter{chapter[2:]}Preview'),
      '--out-dir',str(out),'--pixel-review',*commands],check=True)
    rows=[]
    for i,s in enumerate(samples):
        base=f's{i}-{s["frame"]}'
        rows.append({**json.loads((out/(base+'.geometry.json')).read_text()),**s,'image':base+'.png','origin':'live DOM'})
    for scene in spec['scenes']:
        if not scene.get('transitions') and not scene.get('clip'):
            continue
        clip=scene.get('clip')
        if clip is None:
            t=scene['transitions'][0]
            begin=max(scene['from'],t['at']-15)
            clip={'from':begin,'to':min(scene['to']-1,begin+179)}
        if not scene['from']<=clip['from']<=clip['to']<scene['to']:
            raise ValueError('Clip must be inside its scene')
        # Stable index makes reruns replace their own clip rather than grow the directory.
        name=f"motion-{spec['scenes'].index(scene)}.mp4"
        subprocess.run(['node',str(Path(__file__).with_name('render_review_clip.mjs')),
          '--project',str(project),'--composition',composition or spec.get('composition',f'Chapter{chapter[2:]}Preview'),
          '--from',str(clip['from']),'--to',str(clip['to']),'--out',str(out/name)],check=True)
        first=next(r for r in rows if r['scene']==scene['id']);first['clip']=name
    result=report(rows,out)
    print(json.dumps({'review':str(out/'index.html'),'errors':result['errors'],'warnings':result['warnings']},ensure_ascii=False))
    if result['errors']:raise ValueError(f"{result['errors']} pixel review errors; see {out/'index.html'}")
    return result


if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--project',required=True,type=Path);ap.add_argument('--chapter',required=True);ap.add_argument('--composition')
    args=ap.parse_args();review(args.project,args.chapter,args.composition)
