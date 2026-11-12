"""Resolve the fixed pixel-series signoff before considering TTS, including --force."""
from project_paths import read_json,sha256
import shutil

QUESTION='这个知识点你学会了吗？'
BYE='想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！'
def norm(text):return ''.join(text.split())

def resolve(project, beats, selected):
    bank=project/'assets/voice/harness-outro'
    if not (bank.is_dir() or (project/'remotion/src/PixelWorld.tsx').is_file()):return {}
    # Limit to full signoff at the tail of the script and respect --only.
    wanted={}
    if norm(beats[-1]['text'])==norm(QUESTION+BYE):
        wanted[beats[-1]['id']]='whole'
    elif len(beats)>1 and [norm(x['text']) for x in beats[-2:]]==[norm(QUESTION),norm(BYE)]:
        wanted={beats[-2]['id']:'48',beats[-1]['id']:'49'}
    elif norm(beats[-1]['text'])==norm(BYE):
        wanted={beats[-1]['id']:'49'}
    elif norm(''.join(b['text'] for b in beats)).endswith(norm(QUESTION+BYE)):
        # Do not accidentally synthesize a fixed signoff embedded in other prose.
        tail_chars=0
        for b in reversed(beats):
            if selected is None or b['id'] in selected:
                raise ValueError('请把定稿片尾单独列为一段，或只在问号处分为两段；不合成固定片尾。')
            tail_chars+=len(norm(b['text']))
            if tail_chars>=len(norm(QUESTION+BYE)):break
    wanted={i:k for i,k in wanted.items() if selected is None or i in selected}
    if not wanted:return {}
    if not (bank/'manifest.json').is_file():raise ValueError('固定片尾必须复用定稿干声；先从像素风 Skill 安装 assets/voice/harness-outro。')
    meta=read_json(bank/'manifest.json');result={}
    for uid,k in wanted.items():
        m=meta['whole'] if k=='whole' else meta['units'][k]
        if norm(m['text'])!=norm(next(b['text'] for b in beats if b['id']==uid)):raise ValueError('固定片尾母带文本不匹配')
        files={typ:bank/f'{k}-{typ}.mp3' for typ in ('raw','processed')}
        if any(not path.is_file() or sha256(path)!=m[typ+'Sha256'] for typ,path in files.items()):
            raise ValueError('固定片尾母带缺失或哈希不符，请恢复母带；不调用 TTS。')
        result[uid]=(m,files)
    return result

def apply(entry,beat,tts,fingerprint,root,records,dry):
    m,files=entry
    # Never silently label a different voice or SSML as matching this original.
    from project_paths import request_hash
    if request_hash(m['text'],tts)!=m['requestHash'] or tts['atempo']!=m['atempo'] or beat.get('ttsSsml') or norm(beat.get('ttsText') or beat['text'])!=norm(m['text']):
        raise ValueError('固定片尾不重合成：请使用定稿音色、语速和文案，移除本句读音覆盖。')
    if dry:return
    for typ,src in files.items():
        dest=root/f"audio/{typ}/beat_{beat['id']:02d}.mp3"
        if dest.is_file() and sha256(dest)==m[typ+'Sha256']:continue
        dest.parent.mkdir(parents=True,exist_ok=True);tmp=dest.with_suffix('.reuse.tmp');shutil.copyfile(src,tmp);tmp.replace(dest)
    records['units'][str(beat['id'])]={**{k:v for k,v in m.items() if k!='text'},'requestHash':fingerprint}
    records['speakerId']=tts['speakerId']
