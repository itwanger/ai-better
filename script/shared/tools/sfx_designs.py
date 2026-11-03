"""Original, deterministic UI cues. Peak-normalized floats, generated at mix rate."""
import math
import random

DURATIONS = {
    'soft_click': 0.085,
    'soft_pop': 0.13,
    'data_pluck': 0.20,
    'soft_whoosh': 0.32,
    'focus_air': 0.18,
    'success_pair': 0.46,
}


def make_cues(rate):
    library = {}
    for name, duration in DURATIONS.items():
        # Each sound owns its seed: adding a design cannot change existing cues.
        rng = random.Random('ergo-sfx-v1:' + name)
        size = round(rate * duration)
        slow = fast = 0.0
        samples = []
        for i in range(size):
            t = i / rate
            u = i / (size - 1)
            noise = rng.uniform(-1, 1)
            slow += 0.025 * (noise - slow)
            fast += 0.19 * (noise - fast)
            band = fast - slow
            # Short attack plus a smooth end, to avoid accidental digital clicks.
            attack = min(1.0, t / 0.004)
            tail = min(1.0, (duration - 1 / rate - t) / 0.025)
            edge = math.sin(math.pi * max(0, attack) / 2) ** 2
            edge *= math.sin(math.pi * max(0, tail) / 2) ** 2
            if name == 'soft_click':
                # A dry, wooden tap: mostly noise, with a low damped resonance.
                value = (band * 1.8 + 0.18 * math.sin(2 * math.pi * 420 * t))
                value *= math.exp(-t * 65) * edge
            elif name == 'soft_pop':
                # Rounded bubble, continuously dropping from 630 to about 210 Hz.
                phase = 210 * t + 420 * 0.022 * (1 - math.exp(-t / 0.022))
                value = math.sin(2 * math.pi * phase) * math.exp(-t * 30) * edge
            elif name == 'data_pluck':
                # Warm pluck with unequal harmonic decays, less pure than a beep.
                value = sum(a * math.sin(2 * math.pi * hz * t) * math.exp(-decay * t)
                            for hz, a, decay in [(660, 1, 22), (1320, .25, 38), (1980, .08, 52)])
                value *= edge
            elif name == 'soft_whoosh':
                # Broad, non-tonal sweep with an asymmetric rise and soft release.
                envelope = math.sin(math.pi * u) ** 2
                value = (band * (0.35 + 0.65 * u) + slow * .6) * envelope
            elif name == 'focus_air':
                # Compact lens movement, all filtered air with no electronic note.
                value = (fast * .45 + slow) * math.sin(math.pi * u) ** 3
            else:
                # Two quiet ascending plucks (C5 -> G5), not a loud fanfare.
                value = 0.0
                for start, hz in [(0.0, 523.25), (0.14, 783.99)]:
                    local = t - start
                    if local >= 0:
                        note_attack = min(1.0, local / .008) ** 2
                        value += note_attack * math.exp(-local * 16) * (
                            math.sin(2 * math.pi * hz * local)
                            + .16 * math.sin(2 * math.pi * hz * 2 * local))
                value *= edge
            samples.append(value)
        peak = max(abs(x) for x in samples)
        library[name] = [x / peak for x in samples]
    return library
