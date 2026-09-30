# Sound

Code: `sim/feature-sound/`, the one-shot list on `World` in `world.ts`, pushes from `queue.ts`, `building.ts` and `feature-field/field.helpers.ts`, the rail buttons in `ui/hud.tsx`; see [[code-map]].

## Job

Sound plays beside the picture effects, not inside them. `tone` is imported only from `sim/feature-sound/sound.utils.ts`. `vfx.ts` holds picture-effect definitions and `vfxReduced`. `layers/vfx.ts` draws those effects and drains `bursts`. The sound read runs each frame beside `vfx.tick`.

Four triggers play at the same time. One does not wait on another, mute another, or hold another until it ends. None is ordered ahead of another.

## Used by

- [[code-map]] — the read beside `vfx.tick`. Picture effects stay in `vfx.ts` and `layers/vfx.ts`.
- [[systems/commands]] — a gardener doing a job, and the one-shot in `finishWork`.
- [[features/plants]], [[features/trees]], [[features/weeds]], [[features/water]] — digging, mining, chopping, watering, fertilizing and harvesting hits and finishes, and a burrow dug out; the tools on [[items/other/shovel]], [[items/other/pickaxe]], [[items/other/axe]], [[items/other/bucket]], [[items/other/fertilizer]], [[items/other/compost]].
- [[features/machines]] — putting an item into a machine, a building `working`, and a batch put out; each machine's item page links here.
- [[features/inventory]] — putting an item down on a plot; opening and closing a chest, freezer, produce silo, postbox, Seed silo, Additive store, Seeding silo or Additive silo ([[items/buildings/chest]], [[items/buildings/freezer]], [[items/buildings/field-silos]], [[items/buildings/postbox]], [[items/buildings/seed-silo]], [[items/buildings/additive-store]]).
- [[shell]] — a new Command Center row, and a rail button pressed. With **Pause when this tab is not in front** on, leaving the window suspends both contexts; pause does not.
- [[menu]] — the **Music** and **Effects** volume sliders.
- [[systems/tick]] — the end-of-day summary row is the end-of-day sound. The day change itself does not play.

## Contract

### Start

`Tone.start()` runs from the click that enters play: **New Game**, **Load Save**, **Upload Save…**, and the click that joins a farm. It does not run from `WorldView.mount`. Pause does not suspend that context; leaving the window with `pauseWhenHidden` on does (Interrupt, below).

Lookups return the function for that tune, or no function. `farmMusic` plays `music/song-N.ts` for the URL hash `#music=N`, N from 1 to 7, and `startSong7b` from `music/song-7.ts` for `#music=7b`; that song repeats until stopped, with no gap. For any other hash, or none, it plays song 1; `GAP` seconds after a song ends it plays a random song from `song-1` to `song-7` other than the one that just ended (`another` in `music/index.ts`), and so on until stopped. The gap is `wait` in `sound.utils.ts`, a timeout on the music context's clock, so it stops counting while that context is suspended. The lookups:

| cue | lookup | file | filled |
|---|---|---|---|
| a job's hits | `actHit(act)` | `vfx/index.ts` | for the acts in the Gardener table below |
| a job finished | `actOnce(act)` | `vfx/index.ts` | `shovel`, `mine`, `chop`, `water`, `harvest`, `drop` |
| a burrow dug out | `burrowOnce()` | `vfx/index.ts` | `chime`: G5, B5, D6 rising, starting 0.12 s in, over the shovel's finish |
| chest-type building opened, closed | `openOnce`, `closeOnce` | `vfx/index.ts` | one sound each for all eight buildings |
| machine working | `machineLoop(machine)` | `machines/index.ts` | no function for any machine |
| batch put out | `machineOnce(machine)` | `machines/index.ts` | no function for any machine |
| new Command Center row | `noticeOnce(cue)` | `vfx/index.ts` | no function |
| rail button pressed | `clickOnce()` | `vfx/index.ts` | `click`: 30 ms of band-passed noise at 3.2 kHz over a short triangle tone |

A cue with no function stays silent. A loop function is `(count) => stop`. A one-shot function is `(done) => stop`. `done` runs when that one-shot has ended. Leaving the farm calls `stop` on the music, on each loop, and on each one-shot that is still sounding.

### Music

One plays while a farm is on screen (`World` bound in `world-view.ts`; the map effect mounts that view for the current `World`). A new farm stops the previous one and starts from the beginning. A new song is a file in `music/` and one entry in `music/index.ts`. A song is `(done) => stop`, as a one-shot is: `done` runs when its score has played through once, on a timer set at the transport's end time (`endAt` in `sound.utils.ts`), and the notes keep repeating until `stop`, which also cancels that timer. `farmMusic` stops the song in `done` and waits `GAP` seconds before the next. A song pinned by hash passes a `done` that does nothing. Song 2 is `music/track-2.mid`, played at quarter = 110.21.

`playNotes` sets the transport's `bpm` before it makes any `Part`, because a `Part` turns its seconds into ticks at the transport's tempo at that moment; a part made before would play at (song tempo ÷ the earlier tempo) of its speed. Note lengths, bends and sweep lengths are seconds from the song's own `Tempo` and are not converted.

Song 3 is a score in `music/song-3.ts`: F major, quarter = 43.2, 36 bars, 200 seconds per loop, no note above F5. A glockenspiel figure plays from the first bar to the last; it is the part the rest is built around. The closing return ends on `HOME`: the theme's falling answer over C, with the vibraphone doubling the ocarina and `TEMPO` slowing from 43.2 to 33.6 across that bar, then down a step to F over a rolled harp chord. Song 4 is a score in `music/song-4.ts`: G major, quarter = 93.63, 48 bars, about 124 seconds per loop, in `ROOM.hall`. A woodblock on two pitches and a piano figure in eighths play in every bar except the last three of each refrain. There `home` has the piano and flute play `ANSWER_HOME`, the theme's falling answer note for note, over C while `TEMPO` slows from 93.63 to 70.67 across that bar. Musical direction and the developer's preferences: [[art/music]]. It lands on a low G and a slowly rolled G chord held for two bars, then a quiet arpeggio before the woodblock comes back. The piano also plays the melody except in the refrains (flute), and its left hand alternates root and fifth. Scores write melodies with `line` from `music/score.ts`: one string per 4/4 bar of `pitch beats`, `r` for a rest, and fractions such as `1/3` for triplets. `sing` writes a melody that bends: after its length a note may carry `g<ms>` (glide from the note before), `s<cents>:<ms>` (start that far off the pitch and reach it in that time), and `f<cents>:<ms>` (leave the pitch that long before the end and finish that far off). Every `sing` note carries a `Bend` and plays on the instrument's solo voice, one `Synth` or `FMSynth` from the same patch: `portamento` makes the glide, ramps on `detune` make the scoop and the fall. `sing` takes a `part` number: each part is its own solo voice of the instrument, so a second bending line, such as a harmony, does not take the first one's voice. A `sing` part must not overlap itself. `line` notes stay on the `PolySynth`. The MIDI reader skips pitch-bend messages. `playScore` takes a `Tempo` (a `bpm` and `slow` spans, each a ritardando that eases the tempo evenly down to its own `bpm` and returns to full speed on its last beat; beats convert to seconds through it, so every part slows together), beats, note names, velocities, `GM` program numbers, and a room from `ROOM`, and plays them through the same voices as `playMidi`. The room is the chain the reverb sends pass through: `ROOM.hall` is the reverb alone and is what `playMidi` uses; `ROOM.echo` puts a low-pass filter and a stereo feedback delay of one eighth note at the song's tempo before a shorter reverb, the Super Nintendo echo, and is what song 3 uses.

Song 5 is a score in `music/song-5.ts`: E♭ major, quarter = 163.33 with the drums in half time, 80 bars, about 118 seconds per loop, in `ROOM.hall`. It is built on the buildup of a live DJ cover, recreated from an audio analysis. Sections: an intro of pad and dotted-quarter pluck under two filter sweeps; two verses of a piano `THEME` (a rising question, a falling answer) over a root-and-fifth left hand and the woodblock, the second with the analysed drums and, across its last two bars, a noise riser and a fill of kick on every beat and a snare roll; the `refrain`, landing with an open hat and a low E♭ (the "OHH" line, `OHH`, and its harmony, `THIRD`, over a held E♭), whose third stanza stops on its first rise while the kick drops out, hats and a snare roll build and the mix filter closes, then snaps open; a `drop` of bass on the kick, clap, woodblock eighths and the theme in piano octaves, doubled by the 8-bit lead; a muffled piano breakdown; the refrain again, with `thump`, a low E♭ on every kick and a clap on every beat 3; a shorter drop; an outro where the theme's answer lands on E♭ and the filter closes onto the intro.

`playScore` takes a `Score`: `tempo`, `beats`, `notes`, `room`, and `sweeps`. A `Sweep` sets the low-pass filter on the whole mix, reverb included, to `from` Hz at a beat and ramps it to `to` Hz over `len` beats; the sweeps loop with the notes. Every song has that filter, open at 20 kHz unless a sweep moves it. `playMidi` passes no sweeps. `grid` in `music/score.ts` writes a drum part: one string per 4/4 bar of 16 sixteenths, `X` a hit, `x` a softer hit, `.` nothing, on a pitch from `DRUM`. `GM.drums` (128, not a program) is the kit: one `MembraneSynth` kick and `NoiseSynth` snare, clap, hat and open hat behind one volume, struck by General MIDI drum key. A `Score` names the kit's settings in `kit`, from `KIT`. `KIT.standard`, for songs 3 to 6 and `playMidi`: kick on `A1`, `pitchDecay` 0.05 s, `octaves` 5, decay 0.4 s, held 0.1 s; snare band-pass 1.8 kHz; clap band-pass 1.2 kHz; hats high-passed at 7 kHz, closed decay 0.04 s, open 0.3 s. `KIT.deep`, for song 7: kick on `E1`, `pitchDecay` 0.15 s, `octaves` 4, decay and hold 0.45 s; clap band-pass 1 kHz, decay 0.15 s; hats high-passed at 1.5 kHz, closed decay 0.07 s. `DRUM.riser` (C1, below the General MIDI drum keys) is a noise swell through a band-pass filter rising from 400 Hz to 7 kHz, both lasting the note's length. `GM.synthBass` is a darkened square wave. `GM.voiceOoh` and `GM.synthVoice` are both `vowel`: a `MonoSynth` with five copies of a wave spread over some cents, whose beating reads as several voices, through a low-pass filter that opens on each note. `voiceOoh` is five triangles over 15 cents opening from 1.2 kHz (clear); `synthVoice` is five sawtooths over 30 cents opening from 700 Hz (buzzier), 4 dB quieter. Both have a faint vibrato and a light chorus. Song 5 sings each line on both at once, the sawtooths at 0.45 of the velocity. Song 5's line is one stanza played twice, the second with a quieter harmony a third below on its own solo voice, then a third time cut off at its first rise. Every step bends: 180 ms glides between long notes, 120 ms around the short F.

Song 7 is a score in `music/song-7.ts`: B minor, quarter = 75.21 (the track is 92), 67 bars, about 214 seconds per loop, in `ROOM.hall`, on `KIT.deep`. It is built from the analysis in `music-analysis/music-palace/` of a 104-bar track, with repeated phrases left out. The kick is on every beat; the clap is on beats 2 and 4 from bar 12. A one-bar loop of eighths, B3 F♯4 A3 D5 A3 C♯5 F♯3 B4 doubled an octave apart, plays on `GM.warmPad` in every bar. The bass rests on every kick, `..XX.XXX` per half bar. Before the drop it plays a 14-bar phrase on B1 with turns to D2 and G2 on `GM.sawBass`, silent in bars 25–28; the track has it an octave lower, which the developer heard as too deep. The rise is the mix low-pass alone: 205 Hz to 1.76 kHz over bars 1–27, then to 10 kHz by bar 40. Hats from bar 28, a riser from bar 42 beat 2 over 9 beats. In bar 43 the kick stops for two beats, the `GM.synthBass` bass enters, and a `GM.sawLead` swell in the bass's rhythm plays bar 43 only. Bars 44–51 are the refrain, not from the track (`refrain`), with the groove halfway between the full groove and the broken one (`half`): kick on beats 1 to 3 and a softer one on the "and" of 4 (`HALF_KICK`), soft clap on 2 and 4, the groove's closed hats softer, open hats on the "and" of 1 and 3, the bass pumping in the first half of each bar and holding in the second (`halfPump`), and the loop's main line alone at velocity 0.3, over B B B B G G A A. `THEME` on `GM.rhodes`, a single line: in each pair of bars a note on the "and" of 1 leads to a held note, then two eighths climb to a note on the "and" of 4 held over the bar line; over B twice, the second time higher, then over G, then over A, where it stays open on a held C♯5. From bar 48 a second voice a diatonic third below. Under the theme, a left hand on `GM.rhodes` (`leftHand`): the chord's root in two octaves, B2 B3, G2 G3 or A2 A3, struck on beats 1 and 3 with the kick; it also plays in the build and on the drop's G and A chords. Bars 52–67 (`ending`) are shared with `startSong7b` (`#music=7b`), whose bars 44–51 break the groove fully (`broken`): kick on beat 1 and the "and" of 2, clap on beat 3, open hats on the "and" of 1 and 3, closed hats on the eighths from bar 48, the loop out and the warm pad holding one chord per bar; the bass rests after each of those kicks (`gap`). Bars 52–55 build into the drop over G G A A (`build`): the clap from once a bar to every beat, to eighths, to sixteenths; the kick back on every beat from bar 53 and out for the last beat of bar 55; hats on every sixteenth in bar 55; a noise riser over the four bars; the mix low-pass closing from 10 kHz to 1.5 kHz and snapping open on the drop; the loop's first half-bar, softly, in bars 54 and 55; rolled chords on the off-beats, one more each bar and higher each bar; in bar 55 chords struck together, not rolled, on the "and" of 1, on beat 3 (top E5), on beat 4 where the kick is out (top D5) and on the "and" of 4 (top C♯5), leading into the drop (`FALL`). Bars 56–63 are the drop: the full groove on B B B B G G A A, the loop back; on beat 1 of bar 56 the arrival (`ARRIVAL`), B2 F♯3 B3 D4 F♯4 B4 struck together at velocity 0.7, with a B1 on the saw bass, which the bass's pumping rhythm otherwise leaves empty on the downbeat; the theme's opening figure in bar 58, and held G and A chords with their left-hand octaves in bars 60 and 62. The low-pass closes from bar 60 and reaches 205 Hz at the end of bar 67, while the velocities fall.

`playMidi` gives each General MIDI program in the file one voice from `PATCH`, keyed by program number (`GM` names them). A program with no entry plays `OTHER`, a triangle wave. `GM.rhodes` (4) is an `FMSynth` at harmonicity 1 whose modulation fades in 0.6 s, holding at 0.25 and released over 1.5 s, so held notes fade out after they end; `GM.electricPiano` (5) stays the short pluck song 5 uses. `GM.sawBass` (39) is a sawtooth through a fixed 600 Hz low-pass with a 0.08 s release; `GM.sawLead` (81) a sawtooth through 3 kHz; `GM.warmPad` (89) a sawtooth through 900 Hz with a 0.05 s attack and a chorus. A patch sets the synth, its volume in dB, its polyphony, its own effects (a fixed low-pass filter on sawtooth and square voices, vibrato, chorus, tremolo), and `send`, the share of its output that also goes to the song's room, one chain shared by every voice of that song. The rest goes to the output directly. Song 2 sends 0.6 of every voice through `ROOM.hall`, the same share as song 1. A score keeps each patch's own `send`. `stop` disposes the voices, their effects, and the room. `playSong` (song 1) is one triangle `PolySynth`. The whole voice goes to the shared mix, and 0.6 of it also goes through `ROOM.hall` into that mix. Its envelope attack is 0.05 s, decay 0.6 s, sustain 0.3, release 1.4 s. The parser reads channel 10 as any other channel, so General MIDI drums play as pitched notes.

Music runs on Tone's global context, set in `sound.utils.ts` on the browser's own `AudioContext` with `latencyHint: 'playback'` and `lookAhead: 0.1`; Tone derives `updateInterval` 0.05 from it. It is not Tone's default context from `standardized-audio-context`. That library connects every `ConstantSourceNode`, `OscillatorNode` and `AudioBufferSourceNode` it creates to the destination through a `GainNode` at gain 0 (its Bug #175, a Safari workaround), in every browser, so Chrome processes each running source and that gain on every 128-frame block. Tone's `Signal` is a `ConstantSourceNode` that runs until it is disposed, about ten per voice. On that context song 5 used at least 89% of the audio thread in its drop and underran from bar 14 to the end. A `PolySynth` holds a voice from the moment its note is scheduled until the note is silent, so `lookAhead` adds to the voices held, and a patch's `poly` covers the notes that start within `lookAhead` plus one note's length and release. Too few voices drops notes and logs **Max polyphony exceeded**. Notes are scheduled 0.1 s ahead; a main-thread stall longer than that starts notes late. Sound effects do not use that context. They share one browser `AudioContext` with `latencyHint: 'interactive'` in `vfx/sfx.ts`, and do not use Tone. A sound is a list of `Layer`s: white noise through one `BiquadFilterNode`, or one `OscillatorNode`, each through its own gain envelope, the filter or the pitch moving from `hz` to `to` over the layer's `len`. The nodes are created when the sound plays and stop with it, so no node runs between sounds. `vary` moves a value at random by a share of itself, so repeated hits are not identical. The click that runs `Tone.start()` also resumes this context, and leaving the window with `pauseWhenHidden` on suspends it with the music's.

### Gardener

Doing a job: hits, per seat. A job's duration sets how many hits play, never how fast one plays. `actHit` in `vfx/index.ts` gives an act its `Hit`: `every`, seconds of work between hits, and `play`, which takes the job's target cell. `strike` in `sound.ts` plays hit `n` of a seat's head job when its work done, `workTotal - workLeft`, reaches `n × every`. Hit 0 plays when the work starts. A later hit is skipped when less than `TAIL` (0.2 s) of work is left, so it does not sound over the finish one-shot. `every` of `Infinity` plays hit 0 only. Four gardeners on one act play four hits.

Dig time is the shovel's `workSeconds`, times `1 + DIG_HARD_SPAN × hardness` on untilled soil, or `BURROW_MUL` on a burrow: 0.3 s to 6.75 s. Stretching one sound over that range slows it down or speeds it up, so the hit is fixed and the count follows the time. What makes a dig slow is heard in each hit instead: harder soil gives a brighter, shorter hit with more grains, a stone scrape from `hardness` 0.5 up, and a burrow a lower, looser one. The dig is filtered noise: the blade into soil, a low thump, and grains of soil at random pitches and times (`crumbs`), with a quiet low sine under the thump. No pitched tone carries it. Each dig hit starts up to 40 ms after its mark, so the hits do not fall on an exact beat.

| act | `every` | hit | finish (`actOnce`) |
|---|---|---|---|
| `shovel` | 0.45 s | blade, thump and grains, by the cell's `hardness` and burrow | soil turned over, grains falling; on a burrow, `doShovel` also pushes `burrow` |
| `mine` | 0.55 s | pickaxe on rock | rock breaks |
| `chop` | 0.7 s | wooden knock | crack and a heavy thud |
| `water` | once | pour, 0.4 s | soak |
| `fertilize` | once | a bag of fertilizer or compost poured, 0.6 s | none |
| `harvest` | once | leaves | the fruit coming off |
| `compost`, `grind`, `mill`, `still`, `furnace`, `refuel`, `station`, `barrel`, `jam`, `infuse` | once | `load`: lid opens, item in, lid shuts; one sound for every machine | none |
| `drop` | no hits | none | `thump`: low-passed noise and a low sine; pushed by `doDrop` once the item is on the plot, for any item |

The rotary shovel plays the shovel's hits; the chainsaw and the electric chainsaw play the axe's.

Job finished: one one-shot at the outcome in `finishWork`, except `drop`, pushed by `doDrop`.

Opening is the accepted walk-up in `queue.ts`: the `chest` job whose cell kind is `chest`, `freezer`, `silo-produce`, or `postbox`; the `silo` job at a `seed-silo` or `silo-seed`; the `additives` job at an `additive-store` or `silo-spray`. That push is not in `finishWork`. Closing is `cueClose` in `queue.ts`, run from `ackCueBody`, which every close of those panels commits: a `close` item for the building at the `chest`, `silo` or `additives` cue's cell. The eight buildings share one open sound and one close sound.

### Machine

Working: one loop per building kind, not per building, while `craftState` is `working`. Every building of one kind shares that loop. The number of buildings of that kind in `working` is available to a later tune. This change does not start a loop per building.

Finished: one one-shot when a batch is put out (`progress = 0` after `emitProduct` returns true, inside that building's `tick` in `building.ts`) or when a barrel's `age` crosses `BARREL_MATURE`. The field initializer `progress = 0` is not a cue.

### Command Center

One one-shot when a row `id` from `noticeRows` is new. An `id` this client has not yet pushed, including each `id` in the first result after the `World` is bound, is pushed once. **Hide** moves the column off the right edge and does not stop the one-shot. The end-of-day sound is the new end-of-day summary row (`recap`). The day change does not play a second time.

### One-shot list

One-shots use a list on `World`, in the arrangement `bursts` uses: pushed at the outcome, drained by the view, absent from `Save`, the multiplayer snapshot, and the digest. Each peer pushes its own list, because each peer runs the jobs on its own `World`.

Doing a job and a machine `working` are not list items. The view reads them every frame beside `vfx.tick`.

| `kind` | fields |
|---|---|
| `act` | `act`: the job `act` on `Intent` |
| `burrow` | none |
| `open` | `building`: `chest`, `freezer`, `silo-produce`, `postbox`, `seed-silo`, `silo-seed`, `additive-store`, or `silo-spray` |
| `close` | `building`: as `open` |
| `machine` | `machine`: `MachineId` |
| `notice` | `notice`: `NoticeKind`; `id`: the row `id` |

### Cap

One playing instance of a cue. That cue twice in one drain plays once. That cue again while it is still sounding is dropped. It is not played over itself and it is not held until the first ends. A different cue in the same drain plays. A hit is keyed by act and seat, so one seat's hit is dropped while its previous hit on that act is still sounding. The rail click is keyed `click`.

### Interrupt

- Job cancelled: no further hits. A hit already started plays to its end. No finished one-shot.
- A machine leaves `working` without an output: that loop stops on the next view frame. No finished one-shot. The next start is from the beginning.
- A one-shot already started plays to its end. A later repeat of that cue is dropped until it ends.
- Simulation paused, by **Pause** or by a panel that pauses the game: sound keeps playing.
- Away: with `pauseWhenHidden` on, the window losing focus or the tab hidden (`away` in `App.tsx`) suspends both contexts. Music, loops, and a one-shot that has started hold and continue from that moment when the contexts resume. They are not restarted and they are not discarded. Cues pushed while away are drained each frame and not played. Picture effects keep moving on the Pixi ticker in `WorldView`. Sound does not follow that ticker.
- Farm left, or the `World` unbound: stop music, loops, and sounding one-shots. Discard the list, the set of notice `id`s already pushed, and each seat's last hit.
- End of day clears work timers (`workLeft` set to 0 in `tickWorld` on the day change): hits stop. A timer set to 0 does not push a finished one-shot.
- `stop` calls the function the tune returned. Pause is not `stop`.

### What stays out

A lookup returns the function or no function. No function means silence. Adding a tune later is filling one lookup. The call at the outcome is already there.

Reduced motion does not change sound. Sound has no distance. Sprinklers, tractor exhaust, and mill sails (`mill-sails`) have no lookup.

## Entry points

All in `sound.ts`, called from outside `feature-sound/`:

- `armSound()` — from the click that enters play in `App.tsx`: runs `Tone.start()` (`armAudio`) and resumes the effects context (`armEffects`).
- `holdSound(away)` — from `App.tsx` whenever `away` changes: suspends or resumes both contexts.
- `clickSound()` — from `IconButton`, `FaceBtn` and the lens × in `hud.tsx`, before the button's own action. Not a `World` cue: it plays on the client that pressed it.
- `volumeSound(music, effects)` — from `App.tsx` on load and from the Settings sliders, 0 to 100; `VOLUME_DEFAULT` plays at the levels the songs and sounds set ([[menu]]).
- `bindSound(world)`, `unbindSound(world)` — from `WorldView` mount and unmount in `world-view.ts`.
- `tickSound(world)` — each view frame in `world-view.ts`: music, hits (`strike`) from seat `workLeft` and `workTotal`, working loops from `craftState`, then the one-shot drain.
- `hearNotices(world)` — from `notices.tsx` each time the rows are computed: pushes a `notice` cue for each row `id` not pushed before.
- `World.cue(c)` — the push onto the one-shot list, from simulation code.

`stop` calls the function a lookup returned.
- Pushes onto the list: `finishWork`; `doDrop`; the accepted `chest`, `silo` and `additives` walk-ups and `cueClose` in `queue.ts`; `doShovel` on a burrow in `field.helpers.ts`; `progress = 0` after `emitProduct` returns true, and a barrel `age` crossing `BARREL_MATURE`, in `building.ts`; a `noticeRows` `id` not yet pushed.

## Data

The one-shot list lives on `World` and is drained by the view. It is not written by `dump`, not part of `Save`, not part of the snapshot, and not part of the digest. The set of notice `id`s already pushed, which cues are still sounding, and each seat's head job and number of its last hit live in the view. All are discarded when the `World` is unbound. None is saved.

## Invariants

| id | rule | test |
|---|---|---|
| `sound.local` | the list is not in the save, the snapshot, or the digest | none |
| `sound.once` | one cue per outcome, and a repeat while that cue is sounding is dropped | none |
| `sound.miss` | no function means silence | none |
| `sound.cap` | one loop per building kind, one one-shot instance per cue, one hit instance per act and seat | none |
| `sound.pace` | a job's duration changes the number of hits, never the speed of one | none |

## When you change this

- A new song: a file in `music/` and one entry in `music/index.ts`. The call at the outcome is already there.
- A new one-shot: push one list item at that outcome. Leave the list out of [[systems/save]] and out of the snapshot and digest in [[systems/net]].
- A new Command Center row: a new `id` from `noticeRows` is the one-shot. Do not add a call on the day change.
- A picture effect: `vfx.ts` and `layers/vfx.ts`. Sound stays in `sim/feature-sound/`.

## Decisions

- `act` on an `act` item is `Intent['act']`, not the command `Act` in `log.ts`.
- With no hash the farm plays `songs['song-1']` first, then, after `GAP` seconds of silence, random songs other than the one that just ended.
- Game pause does not hold sound, so rail clicks and the song keep playing while the game is paused; only leaving the window with `pauseWhenHidden` on holds it.
- The tempos in `music/` are not round numbers: each is the speed at which the developer heard and approved that song played alone. `song-7b` is left out of the draw because it is a version of song 7. The other lookups return no function, so filling one of those is how a cue is added.
- `vfxReduced` does not change sound.
- Sprinklers, tractor exhaust (`exhaust`), and `mill-sails` are picture effects with no lookup.
- The **Load Save** label, the menu version line, and the changelog are not part of this system.
