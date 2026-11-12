"""Resolve speech-relative action events once for animation, hearts and SFX. No TTS/render."""
import argparse, hashlib, json
from pathlib import Path


def resolve(source,cues,chapters):
    cue_map={c['id']:c for c in cues}; chapter_map={c['id']:c for c in chapters};result={};seen=set()
    for event in source['events']:
        chapter=event['chapter'];key=(chapter,event['id'])
        if key in seen:raise ValueError(f'Duplicate event {key}')
        seen.add(key);anchor=event['at'];cue=cue_map[anchor['beatId']]
        if cue['chapter']!=chapter:raise ValueError(f'Wrong chapter for {key}')
        offset=anchor.get('offsetFrames',0)
        if not isinstance(offset,int):raise ValueError('offsetFrames must be integer')
        absolute=cue['startFrame']+offset;bounds=chapter_map[chapter]
        if not bounds['startFrame']<=absolute<bounds['endFrame']:raise ValueError(f'Event out of chapter: {key}')
        delta=event.get('heartDelta',0)
        if event['kind']=='fall' and delta!=-1:raise ValueError('fall must lose one heart')
        if event['kind']=='heart-collect' and delta!=1:raise ValueError('heart-collect must restore one heart')
        if event['kind']=='fall' and not event.get('sound'):
            raise ValueError(f'{key} needs contact sound')
        if event.get('sound') and not -60<=event['sound']['peakDbfs']<=-6:
            raise ValueError('SFX peakDbfs outside -60..-6')
        result.setdefault(chapter,[]).append({k:v for k,v in event.items() if k not in ('at','chapter')}|
           {'frame':absolute-bounds['startFrame'],'absoluteFrame':absolute,'beatId':anchor['beatId'],'offsetFrames':offset})
    return {ch:sorted(events,key=lambda e:e['frame']) for ch,events in result.items()}


def compile_events(project):
    project=Path(project);source=project/'assets/references/pixel-actions.json'
    if not source.exists():return None
    load=lambda p:json.loads((project/p).read_text())
    data=resolve(json.loads(source.read_text()),load('build/cues.json'),load('build/chapters.json'))
    output={'schemaVersion':1,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'chapters':data}
    # Confirm every effect exists before touching a plan.
    from sfx_designs import make_cues
    sounds=set(make_cues(8000))|{'error','tick','page'}
    for events in data.values():
        for event in events:
            if event.get('sound') and event['sound']['name'] not in sounds:raise ValueError('Unknown SFX '+event['sound']['name'])
    plan_path=project/'assets/references/sound-plan.json'
    plan=json.loads(plan_path.read_text()) if plan_path.exists() else {'events':[]}
    retained=[e for e in plan['events'] if e.get('origin')!='pixel-actions']
    generated=[{'id':ch+':'+e['id'],'origin':'pixel-actions','beatId':e['beatId'],
      'offsetFrames':e['offsetFrames'],'sound':e['sound']['name'],'peakDbfs':e['sound']['peakDbfs']}
      for ch,events in data.items() for e in events if e.get('sound')]
    if any((a['beatId'],a.get('offsetFrames',0),a['sound'])==(b['beatId'],b['offsetFrames'],b['sound']) for a in retained for b in generated):
        raise ValueError('SFX duplicates a legacy event; remove its old timestamp when migrating this scene')
    plan['events']=retained+generated
    (project/'build/pixel-events.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
    return output


if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--project',required=True,type=Path);a=ap.parse_args()
    r=compile_events(a.project);print('No pixel-actions.json' if r is None else f"Resolved {sum(map(len,r['chapters'].values()))} actions")
