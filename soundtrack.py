#!/usr/bin/env python3
"""
soundtrack.py -- the score for "the fawn and the butterfly".

Original music, composed here in Python and rendered to a stereo WAV. Nothing
is sampled: every sound is synthesised from scratch (additive voices, a
Karplus-Strong harp, filtered noise, a small convolution reverb), and every
event is placed on a timeline that matches the film's shot list:

    0.00 - 3.00   the meadow      A major, 96 BPM, harp and flute, a warm pad
    3.00 - 4.90   the shadow      the mode turns minor, a low drone, a pulse
    4.90 - 7.40   the run         ostinato at speed, drums, dissonance rising
    7.40 - 9.40   the split       the music is cut off, then a bare low line
    9.40 - 11.40  alone          sparse, minor, long silences, one lonely voice
    11.40 - 14.40 the butterfly   bells arrive, the light returns, rising figure
    14.40 - 17.40 follow          a walking pulse, the melody in A major again
    17.40 - 21.00 home            the full theme, a resolution, a last chime

Run:  python3 soundtrack.py [out.wav]
"""

import math
import struct
import sys
import wave

import numpy as np

SR = 44100
DUR = 21.0
rng = np.random.default_rng(20261015)

# ---------------------------------------------------------------- note names
NOTES = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
         'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def freq(name):
    """'A4' -> 440.0. Middle C is C4."""
    pitch, octave = name[:-1], int(name[-1])
    midi = NOTES[pitch] + (octave + 1) * 12
    return 440.0 * 2 ** ((midi - 69) / 12)


def n(name, semis=0):
    return freq(name) * 2 ** (semis / 12)


# ---------------------------------------------------------------- the timeline
# Each event: (start seconds, note name, duration seconds, velocity 0..1)
# Sections are named so the score can be read against the film's shots.
SCORE = {
    # --- shot 1: the meadow. A: I - V - vi - IV, four bars of 2.5 s
    'harp': [
        (0.05, 'A3', 1.6, .5), (0.05, 'E4', 1.6, .42), (0.05, 'A4', 1.6, .34), (0.35, 'C#5', 1.4, .3),
        (1.30, 'E3', 1.6, .48), (1.30, 'B3', 1.6, .4), (1.30, 'E4', 1.6, .33), (1.60, 'G#4', 1.4, .28),
        (2.55, 'F#3', 1.6, .46), (2.55, 'C#4', 1.6, .4), (2.55, 'F#4', 1.6, .32), (2.85, 'A4', 1.4, .28),
        (3.80, 'D3', 1.6, .46), (3.80, 'A3', 1.6, .4), (3.80, 'D4', 1.6, .32), (4.10, 'F#4', 1.4, .3),
        (5.05, 'A3', 2.2, .44), (5.05, 'E4', 2.2, .36), (5.35, 'B4', 1.8, .28),
    ],
    # --- shot 1 + 2: the flute. A pastoral phrase, then it stops and listens.
    'flute': [
        (0.55, 'E5', .9, .5), (1.45, 'C#5', .6, .46), (2.05, 'B4', 1.3, .46), (3.35, 'A4', 1.6, .48),
        (4.55, 'B4', .55, .5), (5.10, 'C#5', .5, .48), (5.60, 'D5', .9, .5), (6.55, 'C#5', .6, .42),
        (7.30, 'B4', 1.0, .4), (8.35, 'A4', .9, .34), (9.10, 'F#4', .8, .3), (10.10, 'F#4', 1.4, .34),
    ],
    # --- shot 2 to 4: the low drone of the threat, on F#1 / C#2
    'drone': [(2.90, 'F#1', 6.4, .30), (2.90, 'C#2', 6.4, .20), (9.30, 'F#1', 2.1, .14), (11.35, 'A1', 3.2, .12)],
    # --- shot 2: the pulse. Slow, then double time as the tiger shows itself.
    'pulse': [(3.05, 'F#2', .30, .34), (3.55, 'F#2', .30, .3), (4.05, 'F#2', .30, .34), (4.55, 'F#2', .30, .4),
              (4.90, 'F#2', .22, .44), (5.15, 'F#2', .22, .4), (5.40, 'F#2', .22, .44), (5.65, 'F#2', .22, .42),
              (5.90, 'F#2', .22, .46), (6.15, 'F#2', .22, .44), (6.40, 'F#2', .22, .48), (6.65, 'F#2', .22, .46)],
    # --- shot 3: the chase. A 16th ostinato that keeps climbing, then is cut off.
    'run': [(4.95 + k * 0.15625, ['F#2', 'A2', 'C#3', 'F#2', 'B2', 'D3'][k % 6], .14, .3 + .02 * (k % 5)) for k in range(32)] +
           [(9.95 + k * 0.15625, ['A2', 'C#3', 'E3', 'A2', 'D3', 'F#3'][k % 6], .14, .28 + .02 * (k % 4)) for k in range(13)],
    # --- shot 3 to 5: the melody survives, in fragments
    'lead': [(7.45, 'F#5', .35, .5), (7.85, 'E5', .3, .46), (8.20, 'C#5', .55, .44), (9.05, 'A4', .7, .36),
             (10.30, 'F#4', 1.2, .3), (12.10, 'C#5', .5, .42), (12.75, 'E5', .5, .46), (13.35, 'F#5', .9, .48)],
    # --- shot 5: the butterfly. Bells come down out of the light.
    'bell': [(11.45, 'A5', 2.2, .34), (11.95, 'C#6', 2.0, .3), (12.55, 'E6', 2.4, .32), (13.15, 'F#6', 2.4, .3),
             (13.85, 'E6', 2.6, .28), (15.05, 'A5', 2.0, .3), (15.55, 'B5', 2.0, .28), (16.15, 'C#6', 2.0, .3),
             (17.45, 'E6', 3.0, .34), (18.05, 'A6', 3.4, .34), (19.35, 'C#7', 3.0, .26), (20.15, 'A6', 3.2, .3)],
    # --- shot 6, 7: the walking bass and the full theme coming home
    'bass': [(14.45 + k * 1.25, ['A1', 'E2', 'F#1', 'D2', 'A1', 'E2', 'D2', 'A1'][k], 1.1, .44) for k in range(6)],
    # --- shot 6: the harp walks him home, two arpeggios a bar
    'harp2': [(14.45, 'A3', 1.1, .5), (14.75, 'C#4', 1.0, .4), (15.05, 'E4', 1.0, .38), (15.35, 'A4', 1.0, .34),
              (15.70, 'E3', 1.1, .48), (16.00, 'G#3', 1.0, .38), (16.30, 'B3', 1.0, .38), (16.60, 'E4', 1.0, .34),
              (17.00, 'D3', 1.1, .48), (17.30, 'F#3', 1.0, .38), (17.60, 'A3', 1.0, .38), (17.90, 'D4', 1.0, .34)],
    'pad2': [(14.40, 'A2', 3.1, .22), (14.40, 'E3', 3.1, .16), (15.80, 'B2', 2.0, .18), (15.80, 'F#3', 2.0, .13), (17.45, 'A2', 3.5, .24), (17.45, 'C#3', 3.5, .17)],
    'theme': [(17.55, 'A4', 1.2, .42), (17.55, 'C#5', 1.2, .36), (17.55, 'E5', 1.2, .34),
              (18.80, 'B4', .9, .4), (18.80, 'D5', .9, .36), (18.80, 'F#5', .9, .34),
              (19.70, 'C#5', .9, .4), (19.70, 'E5', .9, .38), (19.70, 'A5', .9, .34),
              (20.55, 'A4', 2.4, .34), (20.55, 'E5', 2.4, .3), (20.55, 'A5', 2.4, .26)],
}

# ---------------------------------------------------------------- instruments


def env_ad(n, attack, decay, curve=2.2):
    """Simple attack/decay envelope of n samples."""
    a = max(1, int(attack * SR))
    e = np.zeros(n)
    a = min(a, n)
    e[:a] = np.linspace(0, 1, a) ** .6
    tail = np.linspace(0, 1, max(1, n - a))
    e[a:] = np.exp(-curve * 3.2 * tail)
    return e


def voice_pluck(f, dur, vel):
    """Karplus-Strong: a short noise burst in a delay line with a lowpass.
    That is the whole harp/guitar-family sound, and it costs one line."""
    n = int(dur * SR)
    period = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n + period)
    damp = .5 - min(.28, f / 4000)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = damp * (buf[i % period] + buf[(i + 1) % period])
    e = env_ad(n + period, .002, dur, 1.5)
    return out[:n] * e[:n] * vel


def voice_pad(f, dur, vel, bright=.35):
    """Additive pad: a few detuned partials with a slow attack, then a long tail."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for k, amp in ((1, 1.0), (2, .34 * bright), (3, .18 * bright), (4, .1 * bright), (5, .05 * bright)):
        det = 1 + (k - 1) * .0016
        sig += amp * np.sin(2 * np.pi * f * det * t + k)
    sig += .12 * np.sin(2 * np.pi * f * .5 * t)                     # an octave below
    e = env_ad(n, min(.5, dur * .3), dur, .8)
    return sig / 3.2 * e * vel


def voice_flute(f, dur, vel, vib=4.6):
    """A breathy flute: a sine plus a little second harmonic, vibrato, noise."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    v = 1 + .006 * np.sin(2 * np.pi * vib * t + .6) * np.clip(t * 3, 0, 1)
    sig = np.sin(2 * np.pi * f * t * v) + .22 * np.sin(4 * np.pi * f * t * v)
    breath = rng.normal(0, 1, n)
    b = np.convolve(breath, np.ones(24) / 24, mode='same')
    sig += b * .05
    e = env_ad(n, min(.09, dur * .2), dur, 1.1)
    return sig * e * vel * .5


def voice_bell(f, dur, vel):
    """A glockenspiel / music-box: two inharmonic partials and a fast decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = (np.sin(2 * np.pi * f * t) * np.exp(-3.1 * t) +
           .42 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-5.2 * t) +
           .18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-8.0 * t))
    a = min(n, int(.004 * SR))
    sig[:a] *= np.linspace(0, 1, a)
    return sig * vel * .34


def voice_pizz(f, dur, vel):
    """Pizzicato strings: a filtered saw with a very short envelope."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for k in range(1, 9):
        sig += (1 / k) * np.sin(2 * np.pi * f * k * t)
    lp = np.convolve(sig, np.ones(9) / 9, mode='same')
    e = np.exp(-26 * t)
    a = min(n, int(.003 * SR))
    e[:a] *= np.linspace(0, 1, a)
    return lp * e * vel * .3


def voice_kick(dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-26 * t) + 42
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return sig * np.exp(-13 * t) * vel * .9


def voice_tom(f, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 1.6 * t)
    return sig * np.exp(-9 * t) * vel * .5


def voice_shaker(dur, vel):
    n = int(dur * SR)
    x = rng.normal(0, 1, n)
    x = np.convolve(x, np.array([1, -1]), mode='same')
    e = np.exp(-42 * np.arange(n) / SR)
    return x * e * vel * .18


def voice_hit(dur, vel):
    """The impact when the tiger crosses the lens: a low thud plus a noise slap."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (70 * np.exp(-16 * t) + 30) * t) * np.exp(-7 * t)
    slap = rng.normal(0, 1, n) * np.exp(-24 * t)
    return (body * .8 + slap * .35) * vel


VOICES = {
    'kick': lambda e: voice_kick(e[1], e[2]),
    'tom': lambda e: voice_tom(88, e[1], e[2]),
    'shaker': lambda e: voice_shaker(e[1], e[2]),
    'hit': lambda e: voice_hit(e[1], e[2]),
    'harp': lambda e: voice_pluck(e[0], e[1], e[2]),
    'bell': lambda e: voice_bell(e[0], e[1], e[2]),
    'pluck_soft': lambda e: voice_pluck(e[0], e[1], e[2]) * .7,
    'flute': lambda e: voice_flute(e[0], e[1], e[2]),
    'pad': lambda e: voice_pad(e[0], e[1], e[2]),
    'harp2': lambda e: voice_pluck(e[0], e[1], e[2]),
    'drone': lambda e: voice_pad(e[0], e[1], e[2], bright=.2),
    'pulse': lambda e: voice_pizz(e[0], e[1], e[2]) * .8,
    'run': lambda e: voice_pizz(e[0], e[1], e[2]),
    'lead': lambda e: voice_flute(e[0], e[1], e[2], vib=5.4),
    'bass': lambda e: voice_pizz(e[0], e[1], e[2]) * 1.15,
    'theme': lambda e: voice_pad(e[0], e[1], e[2], bright=.5) * 1.1,
    'pad2': lambda e: voice_pad(e[0], e[1], e[2], bright=.3) * .9,
}

# ---------------------------------------------------------------- the rendering


def render_event(start, f, dur, vel, voice, buf):
    sig = VOICES[voice]((f, dur, vel))
    i0 = int(start * SR)
    i1 = min(len(buf), i0 + len(sig))
    if i1 > i0:
        buf[i0:i1] += sig[:i1 - i0]


def lowpass(x, cut):
    """One-pole low pass, applied twice for a 12 dB slope. Kills the fizz."""
    a = math.exp(-2 * math.pi * cut / SR)
    y = x.copy()
    for _ in range(2):
        z = 0.0
        out = np.empty_like(y)
        for i in range(len(y)):
            z = (1 - a) * y[i] + a * z
            out[i] = z
        y = out
    return y


def highpass(x, cut):
    return x - lowpass(x, cut)


def reverb(x, mix=.26, decay=.85, seed=7):
    """A small convolution reverb with a synthetic impulse: exponentially
    decaying noise with a soft top end. Cheap, and it glues the voices."""
    r = np.random.default_rng(seed)
    n = int(decay * SR)
    ir = r.normal(0, 1, n) * np.exp(-3.1 * np.arange(n) / n * 4)
    win = np.hanning(48)
    ir = np.convolve(ir, win / win.sum(), mode='same')
    ir[:40] *= np.linspace(0, 1, 40)
    ir = np.convolve(ir, np.hanning(9) / 9, mode='same')        # a little darker
    wet = np.convolve(x, ir, mode='full')[:len(x)]
    wet /= (np.max(np.abs(wet)) + 1e-9)
    return (1 - mix) * x + mix * wet * np.max(np.abs(x))


def compose():
    dry = np.zeros(int(DUR * SR) + SR)
    l, r = dry.copy(), dry.copy()

    # --- the score, voice by voice -------------------------------------
    for voice, events in SCORE.items():
        for start, name, dur, vel in events:
            render_event(start, freq(name), dur, vel, voice, dry)

    # --- percussion, written straight onto the timeline -----------------
    for t in (0.55, 1.75, 3.05, 4.25, 6.05, 7.05, 8.05, 11.6, 13.2, 14.6):
        render_event(t, 0, .35, .30, 'kick', dry)
    for k in range(32):                                    # the chase: a driving 16th
        t = 4.95 + k * 0.15625
        if k % 4 == 0:
            render_event(t, 0, .3, .5, 'tom', dry)
        render_event(t, 0, .09, .2 + .1 * (k % 2), 'shaker', dry)
    for k in range(6):
        render_event(14.45 + k * 1.25, 0, .18, .22, 'shaker', dry)
    render_event(7.42, 0, 1.3, .8, 'hit', dry)             # the tiger crosses the lens
    render_event(9.42, 0, 1.0, .5, 'hit', dry)             # and the frame goes quiet

    # --- placement: the harp is wide, the bass sits in the middle -------
    mid = dry
    # a slightly different delay per side is the whole stereo image
    dl = int(.006 * SR)
    wide = np.zeros_like(mid)
    wide[dl:] = mid[:-dl]
    l = mid * .72 + wide * .34
    r = mid * .72 + np.roll(wide, 22) * .34

    # --- master ---------------------------------------------------------
    l = reverb(l, .27)
    r = reverb(r, .27, seed=11)
    # tone: a deep clean-up of the sub, and a shelf off the very top
    l = highpass(lowpass(l, 5200), 34)
    r = highpass(lowpass(r, 5200), 34)
    peak = max(np.max(np.abs(l)), np.max(np.abs(r))) + 1e-9
    g = .92 / peak
    l = np.tanh(l * g * 1.06) * .96
    r = np.tanh(r * g * 1.06) * .96
    n = int(DUR * SR)
    fade_in = int(.5 * SR)
    l[:fade_in] *= np.linspace(0, 1, fade_in) ** .7
    r[:fade_in] *= np.linspace(0, 1, fade_in) ** .7
    fade_out = int(1.1 * SR)
    l[-fade_out:] *= np.linspace(1, 0, fade_out) ** 1.4
    r[-fade_out:] *= np.linspace(1, 0, fade_out) ** 1.4
    return l[:n], r[:n]


def write_wav(path, l, r):
    data = np.empty(len(l) * 2, dtype=np.int16)
    data[0::2] = np.clip(l, -1, 1) * 32767
    data[1::2] = np.clip(r, -1, 1) * 32767
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


SECTION_TEXT = """
  t      dur   section          key / material      film
  0.00   3.00  the meadow       A major, harp+flute  mother and fawn grazing
  3.00   4.40  the shadow       F# minor, drone      the tiger, the alarm, the run
  7.40   2.00  the split        A minor, bare        they are scattered
  9.40   2.00  alone            F# minor, sparse     the call, the tears
  11.40  3.00  the butterfly    A major, bells       it comes down out of the light
  14.40  3.00  follow           walking bass, harp   he follows it home
  17.40  3.60  home             full theme, resolve  the reunion
"""


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
    l, r = compose()
    write_wav(out, l, r)
    peak = float(max(np.max(np.abs(l)), np.max(np.abs(r))))
    print(__doc__.strip().split('\n')[0])
    print(SECTION_TEXT)
    print(f'  wrote {out}: {DUR:.1f} s, {SR} Hz stereo, peak {peak:.3f}, '
          f'{len(SCORE)} voices, {sum(len(v) for v in SCORE.values())} scored notes')


if __name__ == '__main__':
    main()
