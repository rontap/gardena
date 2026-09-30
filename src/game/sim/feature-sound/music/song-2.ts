import trackUrl from './track-2.mid?url'
import type { Stop } from '../sound.h.ts'
import { playMidi } from '../sound.utils.ts'

const MIDI_BPM = 110.21

let file: Promise<Uint8Array> | undefined

function midi(): Promise<Uint8Array> {
  if (file === undefined) {
    file = fetch(trackUrl).then(r => r.arrayBuffer()).then(buf => new Uint8Array(buf))
  }
  return file
}

export function startSong2(done: () => void): Stop {
  let stop: Stop = () => {}
  let gone = false
  void midi().then(bytes => {
    if (gone) return
    stop = playMidi(bytes, MIDI_BPM, done)
  })
  return () => {
    gone = true
    stop()
  }
}
