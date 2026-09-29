# Music

Background while the farm is on screen. Predictable enough to leave on for an hour, varied enough not to wear. Never intense. Preference throughout; every rule below came from the developer listening.

Scores live in `src/game/sim/feature-sound/music/`. Instruments, reverb, tempo map, scheduling: [[systems/sound]].

## Songs

| song | hash | score | inspiration | standing |
|---|---|---|---|---|
| 1 | `#music=1`; plays first without a hash | G minor, 63 bpm, one triangle voice, eighth-note figure, `ROOM.hall` | 8-bit | the first song |
| 2 | `#music=2` | `track-2.mid`, E♭ major waltz, 115 bpm, `ROOM.hall` at 0.6 | orchestral MIDI | kept |
| 3 | `#music=3` | F major, 72 bpm, `ROOM.echo` | Chrono Trigger, Schala's Theme | kept |
| 4 | `#music=4` | G major, 106 bpm, `ROOM.hall` | Minecraft (C418), The Sims build mode; theme "busywork" | **the reference** |
| 5 | `#music=5` | E♭ major, 140 bpm half time, filter sweeps, drums, bends; piano verses, "OHH" refrain, drops | a live DJ cover of "Car Radio": its buildup and wordless "OHH" line, from an audio analysis | in progress; the refrain is settled |
| 6 | `#music=6` | C major, 90 bpm, `ROOM.echo`. Woodblock louder than the other parts. Phrase ends on a triola | cottagecore. Song 4's bar map, new line. 8/16-bit themes. Cello octaves as in song 2 | in progress |
| 7 | `#music=7` | B minor, 95 bpm, `ROOM.hall`, `KIT.deep`. One-bar loop, kick on every beat, B1 bass resting on the kick, the rise is the mix filter opening, then a refrain of its own: an electric-piano theme over the groove halfway between full and broken, the loop's main line quieter under it, a build, and the full groove and loop on the drop. `#music=7b` keeps the version with the groove fully broken | a track the developer supplied, from its analysis in `music-analysis/music-palace/`, repetitions cut to about 3 minutes | new, not heard |

Without a hash, song 1 plays first. Each time a song has played through once, the next is drawn at random from songs 1 to 7, leaving out the song that just ended, and this repeats until the farm is left. With a hash, that one song repeats. `#music=7b` is a version of song 7 and is never drawn.

B minor in song 7 is the developer's choice for this track, against the minor-key preference below. The track's bass is B0; at 30 Hz the developer heard it as too deep, so song 7 plays it an octave higher.

Song 7, as the developer set it: bars 1–44 as analysed are good; the loop a little louder than the rest; the rise good. The track's drop was rejected, and so was a first refrain: a marimba hook made of the loop's notes, with a glockenspiel doubling, grace flicks and woodblock bursts. The developer heard the bells and bursts as beeping, and the groove running on unchanged as wrong. The refrain now breaks the groove, gives a second main instrument (electric piano) a theme of its own, and settles back into the groove with the loop's return as the resolution. The second version was too long, too rigid for a relaxed feel, its held notes cut short, and the loop's return came unannounced. It is now 12 bars: the theme placed off the beat with notes held over the bar line and fading slowly, a second voice added halfway, then a 4-bar build in the manner of song 5's into a drop where the loop returns. The developer heard that version (now `#music=7b`) as a bridge rather than a refrain, and missed the loop before its return. A fourth version kept the full groove and the loop and put the new material in electric-piano chord stabs; the developer rejected the stabs (they read as a kalimba) and the full groove. The developer asked three times for the groove in the refrain to sit between the two, and the loop too: present, changed, not gone and not unchanged. Treat such requests as a degree, not as on or off. The beats and the thumping instrumentation matter most in it.

## Song 4 is the reference

The developer rates song 4 highest, the layout most of all. A new song starts from its layout.

| bars | section | lead | busy layer |
|---|---|---|---|
| 1–4 | intro | none; parts enter one per bar | woodblock tick on each beat, piano eighths |
| 5–12 | theme | piano | tick |
| 13–20 | theme again, last bar a rising run | piano, pizzicato enters | woodblock ti-ti ta |
| 21–28 | refrain, then `home` | flute | woodblock straight eighths; silent in `home` |
| 29–36 | bridge, Em and Cmaj7 | piano over held fifths | tick, piano eighths quieter |
| 37–44 | refrain again, then `home` | flute | as the first refrain |
| 45–48 | outro, back to the intro | piano | tick |

What makes it work:

- **Question and answer.** The theme climbs the chord for two bars, then falls by step for two (`THEME` bars 3–4, C–B–A, G–E–G, A–F♯–E–D) and stops on D over the D chord, a half cadence. The fall is the best part of the song.
- **The answer is the way home.** Each refrain ends on `ANSWER_HOME`, that same fall note for note, over C then G instead of Cadd9 then D. The phrase that left the theme open closes the refrain.
- **Slowdown on the returning phrase only.** `TEMPO` eases from 106 to 80 across the first bar of `ANSWER_HOME` and is back at 106 on the G. 106 and 80 were set by ear.
- **The busy layer never stops,** except in `home`: woodblock, piano eighths and pizzicato fall silent, the piano takes the woodblock's ti-ti ta inside the melody, lands on a rolled low G chord, and a quiet arpeggio restarts the motion.
- **Build by density.** The woodblock goes tick, ti-ti ta, straight eighths; each section adds one part.
- **Piano left hand alternates root and fifth** on the beat, chord on beats 2½ and 4½.
- **The refrain repeats once,** identical, ending included.

## Song 6

C major, diatonic: C D E F G A B. Quarter = 90. The score's bar is four quarters. The phrase is ti-ti, ti-ti, then a triola of three notes across the last two quarters. The second note of each pair is higher. The triola is the lower note, the higher note, the higher note again. First bar: E4 G4, E4 G4, E4 G4 G4.

Same bar map as song 4. The line is not song 4's and not song 3's. `ROOM.echo`.

The woodblock is louder than the recorder, the ocarina, the music box, the harp, and the cello. It goes tick, then ti-ti ta, then straight eighths, and it is silent in `home`.

Bars 3–4 of the theme fall by step over F and stop on G over G. Each refrain plays those two bars again, over F then C, and that is `home`. The quarter eases from 90 to 68 across the first of those bars and is 90 again on the C. The second pass of the theme replaces the last bar with a rising run. The refrain is played twice, the second time the same as the first, including `home`.

Bars 1–4 have no lead. The music box enters on bar 2. The theme and the bridge are recorder. Where a bridge note skips, an eighth steps between them. The refrain is ocarina. Harp from the theme through the refrain, and the rolled C in `home`. The cello holds the root under the refrain, outside `home`, and holds that root in octaves through the bridge. No cello in the intro or the outro.

## Preferences

**Range.** Melodies between C4 and E5. A written note above F5 hurts to listen to; high bells and leads were the first complaint on song 3.

**Rhythm.** Eighths and quarters mixed (ti-ti ta), like song 1. Phrases move in connected steps, not separate notes. An occasional triplet breaks the pattern: song 3 has four, one every six bars.

**Harmony.** Diatonic. Chromatic notes and borrowed chords read as off-key (the developer's word is *hamis*), not as colour: one pass of song 3 with F♯, A♭, G♯, C♯ and Lydian B natural was rated much worse. B♭m in F major reads as heavy nostalgia; used once per phrase it tipped song 3 into "good old days". Curiosity comes from the melody's shape, not from chords outside the key.

**Mood.** Cottagecore, daydreaming (*merengés*), curious. Not ominous: song 3 in D minor over a held D was. Not melancholic: a long quiet refrain ending with a low G1 made song 4 read darker.

**Held low notes.** A continuous low drone (*búgás*, the cello octaves and string pad of song 2) is wanted in small amounts: song 3 keeps 8 of 36 bars. Whole-song drones and whole-bar pads read as noise.

**The background figure is the part the rest is built around** and must be clearly heard: the glockenspiel in song 3, the woodblock in song 4. Both were first mixed too quietly.

**Balance.** The opening melody a little under the loudest; quiet parts clearly audible; bass modest; choir very quiet.

**Space.** The Schala sound is the Super Nintendo echo, a dark feedback delay of one eighth note (`ROOM.echo`), not a long reverb. Wanted, but lighter than first mixed.

**Cadence.** A return home needs the phrase the listener already knows, a slowdown on that phrase, and a low, held arrival. A fast landing is not felt. The same device closes song 3: its theme's falling answer over C, doubled by the vibraphone, then down a step to F over a rolled harp chord.

## Inspirations

- Chrono Trigger, Schala's Theme: the glockenspiel figure, the echo, harp arpeggios. Song 3.
- The Secret of Monkey Island and 8/16-bit themes generally: a melody you can hum, a figure that repeats.
- Minecraft, C418: sparse piano, held fifths. The song 4 bridge.
- The Sims, build mode: busy, bouncy, woodblock and pizzicato. Song 4.
- Cottagecore: soft, rural, handmade.

## Vocabulary

The developer describes music in Hungarian and in Kodály rhythm names.

| word | means |
|---|---|
| ti-ti, ta | two eighths, one quarter |
| "half notes", "half tones" | eighth notes; not semitones |
| búgás | a held low drone |
| hamis | off-key |
| kvint | fifth; the piano's root-fifth left hand |
| refrén | refrain |
| merengés | daydreaming |
| triola | triplet |
| felütés | the upbeat (anacrusis): the notes leading into a downbeat. In song 7, the notes leading into the drop; it needs exact timing, emphasis and an arrival on the downbeat |
