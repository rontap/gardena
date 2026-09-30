# Music

Code: `sim/feature-sound/music/`, one file per song; instruments, rooms, tempo maps and playback in [[systems/sound]].

Music plays while a farm is on screen. It has to be steady enough to leave on for an hour and varied enough not to wear: never intense. Every rule on this page comes from the developer listening, and the developer judges a song by ear; read this page before writing or changing a song.

## Songs

| song | score | built from |
|---|---|---|
| 1 | G minor, quarter = 63, one triangle voice, an eighth-note figure, `ROOM.hall` | 8-bit themes |
| 2 | `track-2.mid`, E♭ major waltz, quarter = 110.21, `ROOM.hall` | an orchestral MIDI file |
| 3 | F major, quarter = 43.2, `ROOM.echo` | Chrono Trigger, Schala's Theme |
| 4 | G major, quarter = 93.63, `ROOM.hall` | Minecraft (C418), The Sims build mode; "busywork". **The reference** |
| 5 | E♭ major, quarter = 163.33 with the drums in half time, filter sweeps, bends | the buildup and wordless "OHH" line of a live DJ cover of "Car Radio", from an audio analysis |
| 6 | C major, quarter = 67.5, `ROOM.echo`, song 4's bar map with a new line | cottagecore, 8/16-bit themes |
| 7 | B minor, quarter = 75.21, `ROOM.hall`, `KIT.deep`; `#music=7b` is a second version | a track the developer supplied, from its analysis in `music-analysis/music-palace/`, repeats cut to about 3 minutes |

Each tempo is the speed the developer heard and approved that song at, played alone. `#music=N` plays one song on repeat. Without it, song 1 plays first, then, `GAP` seconds after a song ends, a random song other than that one; 7b is never drawn. Score details per song are in [[systems/sound]].

## Song 4 is the reference

The developer rates song 4 highest, its layout most of all. A new song starts from this layout.

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

- **Question and answer.** The theme climbs the chord for two bars, then falls by step for two and stops on D over the D chord, a half cadence. The fall is the best part of the song.
- **The answer is the way home.** Each refrain ends on `ANSWER_HOME`, that same fall note for note, over C then G. The phrase that left the theme open closes the refrain.
- **Slow down on the returning phrase only.** `TEMPO` eases from 93.63 to 70.67 across the first bar of `ANSWER_HOME` and is back at 93.63 on the G. Both numbers were set by ear.
- **The busy layer never stops,** except in `home`: there woodblock, piano eighths and pizzicato fall silent, the piano takes the woodblock's ti-ti ta inside the melody, lands on a rolled low G chord, and a quiet arpeggio restarts the motion.
- **Build by density.** The woodblock goes tick, ti-ti ta, straight eighths; each section adds one part.
- **The piano's left hand alternates root and fifth** on the beat, with the chord on beats 2½ and 4½.
- **The refrain repeats once,** identical, ending included.

Song 6 follows the same map in C major: a ti-ti, ti-ti, triplet phrase, the woodblock louder than every other part, `home` over F then C with the quarter easing from 67.5 to 51, recorder theme, ocarina refrain, harp through to `home`, cello holding the root under the refrain and in octaves through the bridge.

## Preferences

- **Range.** Melodies between C4 and E5. No written note above F5: high bells and leads were the first complaint on song 3.
- **Rhythm.** Eighths and quarters mixed (ti-ti ta), as in song 1. Phrases move in connected steps. An occasional triplet breaks the pattern: song 3 has one every six bars.
- **Harmony.** Diatonic. Chromatic notes and borrowed chords sound off-key to the developer (*hamis*), not like colour. A borrowed B♭m in F major reads as heavy nostalgia. Curiosity comes from the melody's shape, not from chords outside the key.
- **Mood.** Cottagecore, daydreaming (*merengés*), curious. Not ominous (song 3 in D minor over a held D was), not melancholic (a long quiet refrain ending on a low G1 made song 4 darker).
- **Held low notes.** A held low drone (*búgás*) is wanted in small amounts: song 3 keeps it in 8 of 36 bars. A drone through the whole song or a pad in every bar reads as noise.
- **The background figure** is what the rest is built around and must be clearly heard: the glockenspiel in song 3, the woodblock in song 4. Both were first mixed too quiet.
- **Balance.** The opening melody a little under the loudest part; quiet parts clearly audible; bass modest; choir very quiet.
- **Space.** The Schala sound is the Super Nintendo echo, a dark delay of one eighth note (`ROOM.echo`), not a long reverb; lighter than first mixed.
- **Arrival.** A return home needs a phrase the listener already knows, a slowdown on that phrase, and a low, held arrival. A fast landing is not felt.
- **Key.** Major keys by preference. Song 1 (G minor) and song 7 (B minor, the developer's choice for that track) are the exceptions.

## Vocabulary

The developer describes music in Hungarian and in Kodály rhythm names.

| word | means |
|---|---|
| ti-ti, ta | two eighths, one quarter |
| "half notes", "half tones" | eighth notes, not semitones |
| búgás | a held low drone |
| hamis | off-key |
| kvint | fifth; the piano's root-and-fifth left hand |
| refrén | refrain |
| merengés | daydreaming |
| triola | triplet |
| felütés | the upbeat, the notes leading into a downbeat; in song 7, into the drop, where it needs exact timing, weight, and an arrival on the downbeat |

## Decisions

- Song 7's refrain: the developer asked three times for the groove to sit between the full groove and the broken one, and for the loop to be present but changed. A request like "a bit more" or "between" is a degree, not on or off. Rejected on the way: a marimba hook with glockenspiel and woodblock bursts (heard as beeping), the groove running on unchanged, electric-piano chord stabs (heard as a kalimba). The fully broken version is kept as `#music=7b`.
- Song 7 plays its bass an octave above the track's B0, which the developer heard as too deep.
