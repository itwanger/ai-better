"""Initialize one video under script/, snapshot defaults and copy the shared Remotion template."""
import argparse,json,os,re,shutil
from pathlib import Path
from project_paths import SHARED,WORKSPACE,read_json,write_json,link_public

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--project',required=True);ap.add_argument('--source',required=True,type=Path);ap.add_argument('--title');ap.add_argument('--no-effects',action='store_true',help='skip the default cue sounds');args=ap.parse_args()
    project=Path(args.project).expanduser().resolve();source=args.source.expanduser().resolve();slug=project.name
    if project.exists():raise ValueError(f'Will not overwrite existing project: {project}')
    try:
        parts=project.relative_to(WORKSPACE).parts
    except ValueError:
        raise ValueError(f'Project must be under {WORKSPACE}')
    minute=parts[0]=='one-minute'
    if minute:
        layout=parts[1:]
        if layout and layout[0]=='_archive':layout=layout[1:]
        if len(layout)!=3 or layout[0] in ('shared', '_archive'):
            raise ValueError('Minute projects use one-minute/<topic>/<tool>/<variant>')
        if not all(re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',part) for part in layout):
            raise ValueError('Use lowercase topic/tool/variant slugs')
        slug='one-minute-'+'-'.join(layout)
    elif len(parts)!=1 or slug.startswith('one-minute-'):
        raise ValueError('Long videos use script/<slug>; minute videos use one-minute/<topic>/<tool>/<variant>')
    if not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',slug) or slug=='shared':raise ValueError('Use a lowercase topic slug')
    if not source.is_file():raise ValueError(f'Article not found: {source}')
    cfg={k:v for k,v in read_json(SHARED/'config/video.config.json').items() if not k.startswith('_')}
    title=args.title or slug;composition=''.join(x.title() for x in slug.split('-'))
    project.mkdir(parents=True)
    for d in ['assets/images','audio/raw','audio/processed','build','preview','output']:(project/d).mkdir(parents=True)
    shutil.copy2(source,project/'article.md');shutil.copy2(SHARED/'assets/ergo-avatar.jpg',project/'assets/images/ergo-avatar.jpg')
    meta={'schemaVersion':1,'slug':slug,'title':title,'compositionId':composition,'outputName':slug+'.mp4','sourceArticle':os.path.relpath(source,project),'config':cfg,'audioUnitMode':'meaning-groups','progress':{}}
    if not args.no_effects:
        # Cue sounds are on by default: preview and export both read the mix; events are added per chapter.
        meta['deliveryAudio']='build/voiceover-with-effects.wav'
        write_json(project/'assets/references/sound-plan.json',{'events':[]})
    write_json(project/'project.json',meta)
    write_json(project/'beats.json',{'chapters':[],'beats':[]})
    (project/'script.md').write_text(f'# {title}\n\n待整理并确认口播稿。\n')
    (project/'OUTLINE.md').write_text(f'# {title} · 分镜规划\n\n待确认口播稿后规划，章节和动画数量由内容决定。\n')
    shutil.copytree(SHARED/'remotion/templates',project/'remotion')
    # Resolve shared imports for both direct projects and the one-minute collection.
    for file in (project/'remotion').rglob('*'):
        if file.is_file() and file.suffix in ('.ts', '.tsx', '.json'):
            shared_import=os.path.relpath(SHARED, file.parent).replace(os.sep, '/')
            text=file.read_text(encoding='utf-8')
            file.write_text(re.sub(r'(?:\.\./)+shared/', lambda _: shared_import+'/', text), encoding='utf-8')
    # The public directory exposes project-owned artifacts; no duplicate audio/image copies.
    link_public(project)
    print(json.dumps({'project':str(project),'compositionId':composition,'status':'draft; no TTS requested','effects':not args.no_effects},ensure_ascii=False))
if __name__=='__main__':main()
