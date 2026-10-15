# the fawn and the butterfly

A 21-second animated short. **Every frame is drawn in JavaScript** on a 2D
canvas — no images, no video, no external assets — in the riso-print flipbook
style of the reference film (cream stock, three or four halftone inks per shot,
every edge off register, one navy seed dot at the centre of the frame, hand
lettering, a drawn torn-paper wipe between shots). **The music is composed and
synthesised in Python**, one section per beat of the story.

**Watch it: `the-fawn-and-the-butterfly.mp4`** (1920x1080, 24 fps, stereo).

## The story

| t | shot | what happens |
|---|---|---|
| 0.0 | the meadow | a mother deer grazes; her fawn nuzzles her flank, then both look up |
| 3.0 | the shadow | a tiger comes out of the treeline, low in the grass |
| 4.9 | the run | the chase; the tiger crosses the lens at 7.4 s and the frame cuts to the fawn, alone and out of breath |
| 9.4 | alone | the call, the tears, the wind; the colour drains out of the meadow |
| 11.4 | the butterfly | a butterfly comes down out of the light and lands on his nose |
| 14.4 | follow | he trots after it across the meadow; far off, a shape that might be her |
| 17.4 | home | they meet, the light goes gold, the butterfly lifts away, sign-off |

## How it is built

```
deer-mother.html      the film: seven shots, a camera per shot, the timeline
assets/core.js        the drawing kit (wobbly strokes, hatching, grain, camera, player)
assets/actors.js      riso plates + halftone screens, and the four actors:
                      deer (mother and fawn share one rig), tiger, butterfly, meadow
assets/letters.js     a small stroke font, so the sign-off is drawn, not typeset
soundtrack.py         the score: 148 scored notes, 11 synthesised voices -> soundtrack.wav
render_all.js         offline renderer: an inline-script HTML to PNG frames (+ the wav)
sheet.html            a model sheet of every actor and pose
```

Details that make the look:

- **One rig, two animals.** The fawn is the mother's shape sheet with the body
  block squashed and the head group enlarged — no second set of artwork.
- **Legs are solved, not keyframed.** `limb()` is two bones and a knee, and
  `hoofAt()` drags the foot back in stance and lifts it in swing, so the walk,
  the trot and the gallop are one idea with three parameters.
- **Halftones are real screens.** A dot screen belongs to the plate, not to the
  drawing, so each density is drawn once as a small repeating tile and filled
  through the shape at the artist's offset. Overlaps multiply, like ink.
- **Boil.** The animals are drawn on twos (`tau = twos(tau)`), the camera runs
  on ones — which is what the reference films do, and why they feel alive.
- **The world is a pure function of world x.** Grass, hedge and haze are
  rebuilt from a hash every frame, so the camera can pan the length of the
  meadow and nothing slides or shimmers.

## Build

```sh
npm install @napi-rs/canvas jsdom            # offline canvas for the renderer
python3 -m venv .venv && .venv/bin/pip install numpy imageio-ffmpeg
.venv/bin/python soundtrack.py soundtrack.wav        # ~12 s -> 21.0 s stereo score
node render_all.js deer-mother.html out              # 506 frames at 1920x1080
ffmpeg -framerate 24 -i out/frames/%04d.png -vf fps=24,format=yuv420p \
       -c:v libx264 -crf 18 -preset slow video.mp4
ffmpeg -i video.mp4 -i soundtrack.wav -map 0:v:0 -map 1:a:0 \
       -c:v copy -c:a aac -b:a 192k -shortest the-fawn-and-the-butterfly.mp4
```

`sheet.html` renders a model sheet of every actor and pose if you want to look
at the drawing on its own.

## The score

Written in `soundtrack.py` as a table of (time, note, length, velocity) per
voice, then rendered with additive pads, a Karplus-Strong harp, a breathy
flute, inharmonic bells, filtered-noise percussion and a small convolution
reverb. A = 440, 96 BPM.

```
 3.00 s  the mode turns minor under a low drone as the tiger appears
 4.90 s  16th-note ostinato at speed, drums, dissonance rising
 7.42 s  a hard low hit where the tiger crosses the lens, then the music drops out
 9.40 s  sparse minor fragments, long silences
11.40 s  bells enter; the key turns back to A major with the butterfly
14.40 s  a walking bass and arpeggios: the theme rebuilt note by note
17.40 s  the full theme, resolved, with a last chime over the reunion
```
