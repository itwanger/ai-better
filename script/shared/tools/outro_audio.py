"""PowerUpOutro button sounds: derive contact frames and verify the actual mixed PCM."""
import argparse
import array
import hashlib
import json
import math
import wave
from pathlib import Path

from sfx_designs import make_cues


PRESS_DELAY = 3  # LikeFollowTiles: the button depresses three frames after its word cue.
PRESETS = {'like': 'pixel_like', 'follow': 'pixel_follow'}
APPROVED_PEAK = -25.19  # Harness approved signoff; dry narration remains unchanged.


def read(path):
    return json.loads(Path(path).read_text())


def derive_events(project, source, cues, chapters):
    """An explicit power-up declaration owns both press events; no hand-entered frames."""
    project = Path(project)
    chapter_map = {c['id']: c for c in chapters}
    events = []
    seen = set()
    for item in source.get('powerUpOutros', []):
        ch = item['chapter']
        if ch in seen:
            raise ValueError(f'Duplicate power-up outro: {ch}')
        seen.add(ch)
        timing = read(project / item['timing'])
        bounds = chapter_map[ch]
        if timing['chapterStartFrame'] != bounds['startFrame']:
            raise ValueError(f'Stale outro timing: {ch}')
        for action, sound in PRESETS.items():
            frame = timing['events'][action] + PRESS_DELAY
            absolute = bounds['startFrame'] + frame
            matches = [c for c in cues if c['chapter'] == ch and
                       c['startFrame'] <= absolute < c['startFrame'] + c['durationFrames']]
            if len(matches) != 1:
                raise ValueError(f'Outro {ch}/{action} contact outside audio cues')
            cue = matches[0]
            events.append({'id': f'outro-{action}-press', 'chapter': ch,
                           'kind': 'button-press', 'at': {'beatId': cue['id'],
                           'offsetFrames': absolute - cue['startFrame']},
                           'sound': {'name': sound, 'peakDbfs': APPROVED_PEAK}})
    return events


def require_declaration(project, chapter):
    """Catch the known chapter-component integration forgetting the paired audio preset."""
    project = Path(project)
    component = project / f'remotion/src/Chapter{chapter.removeprefix("ch")}.tsx'
    if not component.exists() or '<PowerUpOutro' not in component.read_text():
        return
    path = project / 'assets/references/pixel-actions.json'
    source = read(path) if path.exists() else {}
    if not any(x['chapter'] == chapter for x in source.get('powerUpOutros', [])):
        raise ValueError(f'{chapter}: PowerUpOutro needs powerUpOutros in pixel-actions.json; '
                         'declare chapter and current phrase-timing file, then --update-audio')


def read_pcm(path):
    with wave.open(str(path)) as stream:
        if stream.getnchannels() != 1 or stream.getsampwidth() != 2:
            raise ValueError('Expected mono 16-bit WAV')
        values = array.array('h')
        values.frombytes(stream.readframes(stream.getnframes()))
        return stream.getframerate(), values


def db_rms(values):
    return 20 * math.log10(max(1e-12, math.sqrt(sum(v*v for v in values) / len(values)) / 32767))


def verify(project, chapter):
    project = Path(project)
    require_declaration(project, chapter)
    source = read(project / 'assets/references/pixel-actions.json')
    cues = read(project / 'build/cues.json')
    chapters = read(project / 'build/chapters.json')
    expected = [e for e in derive_events(project, source, cues, chapters) if e['chapter'] == chapter]
    if not expected:
        return None
    record = read(project / 'build/sound-mix.json')
    for key, path in [('sourceSha256', 'build/voiceover.wav'),
                      ('outputSha256', 'build/voiceover-with-effects.wav'),
                      ('planSha256', 'assets/references/sound-plan.json')]:
        if record[key] != hashlib.sha256((project / path).read_bytes()).hexdigest():
            raise ValueError(f'Stale outro mix: {key}')
    rate, voice = read_pcm(project / record['source'])
    mixed_rate, mixed = read_pcm(project / record['output'])
    if rate != mixed_rate or len(voice) != len(mixed):
        raise ValueError('Outro mix changed narration duration or sample rate')
    fps = read(project / 'project.json')['config']['video']['fps']
    cue_map = {c['id']: c for c in cues}
    library = make_cues(rate)
    rows = []
    for event in expected:
        identifier = chapter + ':' + event['id']
        matches = [x for x in record['events'] if x.get('id') == identifier]
        frame = cue_map[event['at']['beatId']]['startFrame'] + event['at']['offsetFrames']
        if len(matches) != 1 or matches[0]['sound'] != event['sound']['name'] or matches[0]['frame'] != frame:
            raise ValueError(f'Missing/wrong button sound or contact frame: {identifier}')
        if matches[0]['peakDbfs'] != event['sound']['peakDbfs']:
            raise ValueError(f'Unverified button sound level: {identifier}')
        offset = round(frame / fps * rate)
        samples = library[event['sound']['name']]
        end = offset + len(samples)
        if end > len(mixed):
            raise ValueError(f'Truncated button sound: {identifier}')
        # Compare the real PCM residual with ALL scheduled effects in this window.
        # This works even if another approved effect overlaps the button sound.
        wanted = [0.0] * len(samples)
        for other in record['events']:
            start = round(other['frame'] / fps * rate)
            stop = start + round(other['durationSec'] * rate)
            if start >= end or stop <= offset:
                continue
            if other['sound'] not in library:
                raise ValueError(f'Unsupported overlapping legacy effect: {other["sound"]}')
            gain = 32767 * 10 ** (other['peakDbfs'] / 20)
            sound = library[other['sound']]
            for index in range(max(offset, start), min(end, start + len(sound))):
                wanted[index-offset] += sound[index-start] * gain
        residual = [mixed[i]-voice[i] for i in range(offset, end)]
        error = max(abs(a-b) for a, b in zip(residual, wanted))
        if error > 1.01:
            raise ValueError(f'Button sound absent or different in mixed WAV: {identifier}, PCM error {error:.2f}')
        own = [v * 32767 * 10 ** (event['sound']['peakDbfs'] / 20) for v in samples]
        relative = db_rms(own) - db_rms(voice[offset:end])
        rows.append({'id': identifier, 'frame': frame, 'sound': event['sound']['name'],
                     'peakDbfs': event['sound']['peakDbfs'], 'maxPcmError': round(error, 3),
                     'effectMinusVoiceRmsDb': round(relative, 2),
                     'maskingRisk': relative < -20})
    result = {'chapter': chapter, 'events': rows, 'note': 'PCM presence and contact checked; listening still required.'}
    destination = project / f'preview/chapter{chapter.removeprefix("ch")}/outro-audio-check.json'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', required=True, type=Path)
    parser.add_argument('--chapter', required=True)
    args = parser.parse_args()
    print(json.dumps(verify(args.project, args.chapter), ensure_ascii=False))
