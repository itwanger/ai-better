import array
import hashlib
import json
import math
from pathlib import Path
import sys
import tempfile
import unittest
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from outro_audio import derive_events, require_declaration, verify
from pixel_events import compile_events
from sfx_designs import make_cues


class OutroAudioTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.p = Path(self.tmp.name)
        for name in ('build', 'assets/references', 'remotion/src'):
            (self.p / name).mkdir(parents=True)
        self.cues = [{'id': 1, 'chapter': 'ch6', 'startFrame': 0, 'durationFrames': 150}]
        self.chapters = [{'id': 'ch6', 'startFrame': 0, 'endFrame': 150}]
        self.source = {'events': [], 'powerUpOutros': [
            {'chapter': 'ch6', 'timing': 'assets/references/ch6-phrase-timing.json'}]}
        self.save('assets/references/pixel-actions.json', self.source)
        self.save('assets/references/ch6-phrase-timing.json',
                  {'chapterStartFrame': 0, 'events': {'like': 60, 'follow': 70}})
        self.save('build/cues.json', self.cues)
        self.save('build/chapters.json', self.chapters)
        self.save('project.json', {'config': {'video': {'fps': 30}}})
        (self.p / 'remotion/src/Chapter6.tsx').write_text('<PowerUpOutro />')
        self.rate = 8000
        self.voice = [round(2400 * math.sin(i * .13)) for i in range(40000)]

    def save(self, name, data):
        (self.p / name).write_text(json.dumps(data))

    def digest(self, name):
        return hashlib.sha256((self.p / name).read_bytes()).hexdigest()

    def wav(self, name, data):
        with wave.open(str(self.p / name), 'wb') as stream:
            stream.setnchannels(1)
            stream.setsampwidth(2)
            stream.setframerate(self.rate)
            stream.writeframes(array.array('h', data).tobytes())

    def fixture_mix(self):
        compile_events(self.p)
        library = make_cues(self.rate)
        mixed = list(map(float, self.voice))
        rows = []
        plan = json.loads((self.p / 'assets/references/sound-plan.json').read_text())
        for item in plan['events']:
            frame = item['offsetFrames']
            samples = library[item['sound']]
            start = round(frame / 30 * self.rate)
            gain = 32767 * 10 ** (item['peakDbfs'] / 20)
            for i, sample in enumerate(samples):
                mixed[start+i] += sample * gain
            rows.append({**item, 'frame': frame, 'durationSec': len(samples)/self.rate})
        self.wav('build/voiceover.wav', self.voice)
        self.wav('build/voiceover-with-effects.wav', list(map(round, mixed)))
        record = {'source': 'build/voiceover.wav', 'output': 'build/voiceover-with-effects.wav',
                  'sourceSha256': self.digest('build/voiceover.wav'),
                  'outputSha256': self.digest('build/voiceover-with-effects.wav'),
                  'planSha256': self.digest('assets/references/sound-plan.json'), 'events': rows}
        self.save('build/sound-mix.json', record)
        return record

    def test_generated_contact_frames_and_pcm(self):
        record = self.fixture_mix()
        self.assertEqual([(63, 'pixel_like'), (73, 'pixel_follow')],
                         [(x['frame'], x['sound']) for x in record['events']])
        self.assertEqual(2, len(verify(self.p, 'ch6')['events']))
        plan = (self.p / 'assets/references/sound-plan.json').read_bytes()
        compile_events(self.p)
        self.assertEqual(plan, (self.p / 'assets/references/sound-plan.json').read_bytes())

    def test_component_cannot_silently_omit_preset(self):
        self.save('assets/references/pixel-actions.json', {'events': []})
        with self.assertRaisesRegex(ValueError, 'needs powerUpOutros'):
            require_declaration(self.p, 'ch6')

    def test_stale_manual_soft_click_is_rejected(self):
        self.source['events'] = [{'id': 'old-like', 'chapter': 'ch6', 'kind': 'cue',
                                 'at': {'beatId': 1, 'offsetFrames': 60},
                                 'sound': {'name': 'soft_click', 'peakDbfs': -29}}]
        self.save('assets/references/pixel-actions.json', self.source)
        with self.assertRaisesRegex(ValueError, 'Remove manual'):
            compile_events(self.p)

    def test_fake_success_record_cannot_hide_missing_pcm(self):
        record = self.fixture_mix()
        self.wav('build/voiceover-with-effects.wav', self.voice)
        record['outputSha256'] = self.digest('build/voiceover-with-effects.wav')
        self.save('build/sound-mix.json', record)
        with self.assertRaisesRegex(ValueError, 'absent or different'):
            verify(self.p, 'ch6')

    def test_wrong_contact_or_quiet_substitution_fails(self):
        for field, value in [('frame', 60), ('sound', 'soft_click'), ('peakDbfs', -40)]:
            record = self.fixture_mix()
            record['events'][0][field] = value
            self.save('build/sound-mix.json', record)
            with self.assertRaises(ValueError):
                verify(self.p, 'ch6')

    def test_timing_change_requires_remix(self):
        self.fixture_mix()
        self.save('assets/references/ch6-phrase-timing.json',
                  {'chapterStartFrame': 0, 'events': {'like': 65, 'follow': 75}})
        with self.assertRaisesRegex(ValueError, 'contact frame'):
            verify(self.p, 'ch6')


if __name__ == '__main__':
    unittest.main()
