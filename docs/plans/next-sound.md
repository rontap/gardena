# Music: handoff

Feature, in progress. Engine and contract: [[systems/sound]]. Musical direction, the developer's preferences, and their music vocabulary: [[art/music]]. Read both before touching a song.

Scores live in `src/game/sim/feature-sound/music/`. `tone` is imported only from `sim/feature-sound/sound.utils.ts`. A URL hash, `#music=1` to `#music=7` or `#music=7b`, through `BY_HASH` in `music/index.ts`, repeats that one song. With no hash, `farmMusic` plays song 1, then a random song other than the one that just ended, and so on — [[art/music]].

## Songs

| song | file | standing |
|---|---|---|
| 1 | `song-1.ts`, `playSong`, one triangle `PolySynth` | plays first without a hash; now through the hall and the mix trim |
| 2 | `song-2.ts` + `track-2.mid`, `playMidi` | kept |
| 3 | `song-3.ts`, F major, 72 bpm, `ROOM.echo` | kept. Glockenspiel eighths in every bar; closing return ends on `HOME` over C then F |
| 4 | `song-4.ts`, G major, 106 bpm | **the reference.** The developer's favourite; its layout is the model for new songs — [[art/music]] |
| 5 | `song-5.ts`, E♭ major, 140 bpm half time, 80 bars | in progress; see below |
| 5b | `song-5b.ts` | the earlier 67-bar draft of song 5. Not in `music/index.ts`. Ask before deleting |
| 6 | `song-6.ts`, C major, 90 bpm | written in another session; not reviewed here — [[art/music]] |
| 7 | `song-7.ts`, B minor, 95 bpm, 67 bars, `KIT.deep` | bars 1–44 approved; the refrain (bars 44–55) is the fifth attempt: the groove and loop halfway between full and broken, the electric piano as a single line, not yet heard. `#music=7b` plays the third attempt, the groove fully broken, heard as a bridge | From `music-analysis/music-palace/` (`report.md`, `draft-score.ts.txt`); the track's 104 bars cut to 71 by playing the 14-bar phrase three times instead of four and the drop's 8-bar cycle three times instead of four |

## Song 5

Built on the buildup of a live DJ cover of "Car Radio", recreated from an audio analysis (tempo, drum grids, the "OHH" line, the drop). The analysis is in `music-analysis/track-5/`: `report.md`, its images, the scripts and their data. The decoded track and the demucs stems are in the same folder and ignored by git.

| bars | section |
|---|---|
| 1–8 | intro: pad, dotted-quarter pluck, two mix-filter sweeps |
| 9–16 | verse 1: piano `THEME`, left hand root and fifth, woodblock `TICK` |
| 17–24 | verse 2: analysed drums, `THEME_RISE`, woodblock `BUSY`; bars 23–24 a `DRUM.riser` and a kick-and-snare fill |
| 25–34 | `refrain`: `OHH` on `voices` (triangle `voiceOoh` + sawtooth `synthVoice`), `THIRD` harmony, held E♭; bar 34 builds, mix filter closes and snaps open |
| 35–50 | `drop`: bass on the kick, clap, woodblock `RUN`, `THEME` in piano octaves; 8-bit lead from bar 43 |
| 51–58 | breakdown: `THEME` on piano, mix muffled to 3 kHz |
| 59–68 | `refrain` again with `thump` (low E♭ on every kick, clap on beat 3) |
| 69–76 | shorter `drop`, 8-bit lead throughout |
| 77–80 | outro: `HOME` onto low E♭, mix filter closes onto the intro |

Settled by the developer: the refrain (three stanzas, the third cut at its first rise), the drop, the voice layering, the storm into the refrain.

Not yet heard: `THEME`, `THEME_RISE` and `HOME` were replaced in the last change. The first theme copied song 4's rhythm and contour; the developer rejected that. The new one uses the groove's long-long-short (3-3-2): a falling sigh, C–B♭–G, answered by a climbing run of eighths.

## Working with the developer

- They listen; you write. Do not render audio, measure levels, or open a preview to "check" a song. Report what changed, in bars and instruments, and wait.
- Feedback comes by bar number. Every score song logs `[music] bar N` to the console at the heard time; bars count from 1, the same numbering to use in replies.
- They describe music in Hungarian and Kodály terms. "Half notes" means eighth notes, not semitones; that misreading produced the worst version of song 3. When a term is unclear, ask.
- Originality is checked. Do not reuse a melody, rhythm and contour from another song.
- Diatonic harmony, melodies at or below F5, a return home on the phrase the listener already knows. The rest: [[art/music]].

## Engine limits found

- **Audio thread load.** On Tone's default context, song 5 underran from bar 14 to the end, song 4 at bars 20, 29 and 37, song 2 in two places, measured in live playback with Chrome's `playbackStats` and the `webaudio.audionode` trace. `standardized-audio-context` connects every source node to the destination through a gain-0 `GainNode`, so every running `ConstantSourceNode` (Tone's `Signal`, about ten per voice) is processed every block: in the drop, 1,799 gains and 918 constant sources per block against 119 oscillators. Music now runs on a browser `AudioContext` — [[systems/sound]]. The developer confirmed the crackling gone in the game.
- **Scheduling.** `lookAhead` is 0.1, Tone's default. A `PolySynth` takes a voice when its note is scheduled, so `lookAhead: 1` held more voices at once and song 2 dropped 45 notes on **Max polyphony exceeded**; `lookAhead: 2` earlier caused lag and dropped notes for the same reason. A main-thread stall longer than 0.1 s starts notes late.
- **Measuring.** Tone's offline render builds every voice and oscillator of the rendered window before rendering and does not dispose voices, so offline render time is not the live cost. The processor ran 15% slower after five minutes of load, so repeated live runs near the limit disagree.
- **Filters per voice.** A filter whose frequency is driven per sample on every voice (a `MonoSynth` filter envelope inside a 16-voice `PolySynth`) overloaded the audio thread. One fixed filter per instrument is cheap. `MonoSynth` is fine as a single solo voice.
- **Reverb length** costs audio-thread time; the hall is 2.2 s.
- **Voice synthesis.** A filter alone reads as a synth; two harmonic recipes crossfaded read as a clarinet; a fat sawtooth reads as a machine. The accepted voice is a fat triangle (`voiceOoh`) with a fat sawtooth under it (`synthVoice`) at 0.45 of the velocity. A recorded voice is the next step if more is wanted; the developer has not asked for it.
- **`sing`.** Each `part` is one solo voice; a part must not overlap itself. A glide needs the previous note still sounding.
- **MIDI.** The reader skips pitch bend and plays channel 10 as pitched notes.
- **Mix level.** Every song goes through `bus()`: the low-pass filter on the whole mix. It has no gain stage. Peak levels and clipping are not measured.

## Open

- Sound effects: job hits, job finishes, and chest open and close are in `vfx/index.ts`, on their own context in `vfx/sfx.ts` — [[systems/sound]]. Not yet heard by the developer. Every lookup in `machines/index.ts` and `noticeOnce` return `undefined`.
- The bar log is always on.
- `song-5b.ts`: keep or delete.
- `docs-next/systems/sound.md` and `docs/art/music.md` are not committed.
- Checks for a change here: `npx tsc --noEmit -p tsconfig.app.json` filtered to `feature-sound` (the repo has unrelated errors elsewhere), `node scripts/no-defensive.mjs`, `npx oxlint src/game/sim/feature-sound`.
- Version numbers and release notes are the orchestrator's.
