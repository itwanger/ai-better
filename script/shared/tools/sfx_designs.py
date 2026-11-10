"""Original, deterministic UI cues. Peak-normalized floats, generated at mix rate."""
import math
import random

DURATIONS = {
    'soft_click': 0.085,
    'soft_pop': 0.13,
    'data_pluck': 0.20,
    'soft_whoosh': 0.32,
    'pixel_wipe': 0.21,
    'pixel_jump': 0.17,
    'pixel_splash': 0.29,
    'focus_air': 0.18,
    'success_pair': 0.46,
    'pixel_like': 0.13,
    'pixel_follow': 0.24,
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
            elif name in ('pixel_wipe', 'pixel_jump'):
                # Original short brush across tiles; a separate upward tone marks takeoff.
                up = name == 'pixel_jump'
                phase = 2 * math.pi * ((330 if up else 925)*t + (2400 if up else -1360)*t*t)
                tone = math.sin(phase) + .16 * math.sin(phase*3)
                value = (tone if up else .60*tone+1.05*band) * edge * math.exp(-u*2.8)
            elif name == 'pixel_splash':
                # Surface impact, short wash, then two quieter bubbles.
                phase = 185*t + 480*.031*(1-math.exp(-t/.031))
                value = (.8*math.sin(2*math.pi*phase)*math.exp(-t*30)
                         + 2.8*band*math.exp(-t*17)) * edge
                for start, hz in ((.084, 370), (.156, 530)):
                    local = t-start
                    if local >= 0:
                        value += .32*math.sin(2*math.pi*(hz*local+720*local**2))*math.exp(-local*38)*edge
            elif name == 'focus_air':
                # Compact lens movement, all filtered air with no electronic note.
                value = (fast * .45 + slow) * math.sin(math.pi * u) ** 3
            elif name in ('pixel_like', 'pixel_follow'):
                # Short band-limited pulse tones: a bright tap and a pitched two-note reply.
                second = name == 'pixel_follow' and t >= .090
                local = t - .090 if second else t
                hz = 1046.5 if name == 'pixel_like' else (988 if second else 659.25)
                phase = 2 * math.pi * hz * local
                oscillator = math.sin(phase) + .25 * math.sin(3 * phase) + .10 * math.sin(5 * phase)
                gate = min(1., local / .004) * math.exp(-local * 25)
                if name == 'pixel_follow' and not second:
                    gate *= min(1., (.090 - t) / .008)
                value = oscillator * gate * edge
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
