import type { LoopFn, OnceFn, Stop } from '../sound.h.ts'
import { wait } from '../sound.utils.ts'
import { startSong1 } from './song-1.ts'
import { startSong2 } from './song-2.ts'
import { startSong3 } from './song-3.ts'
import { startSong4 } from './song-4.ts'
import { startSong5 } from './song-5.ts'
import { startSong6 } from './song-6.ts'
import { startSong7, startSong7b } from './song-7.ts'

export const songs: Record<string, OnceFn> = {
  'song-1': startSong1,
  'song-2': startSong2,
  'song-3': startSong3,
  'song-4': startSong4,
  'song-5': startSong5,
  'song-6': startSong6,
  'song-7': startSong7,
  'song-7b': startSong7b,
}

const BY_HASH: Partial<Record<string, string>> = {
  '#music=1': 'song-1',
  '#music=2': 'song-2',
  '#music=3': 'song-3',
  '#music=4': 'song-4',
  '#music=5': 'song-5',
  '#music=6': 'song-6',
  '#music=7': 'song-7',
  '#music=7b': 'song-7b',
}

// `song-7b` is a version of song 7 and plays only from its hash.
const ROTATION = Object.keys(songs).filter(id => id !== 'song-7b')

function another(id: string): string {
  const rest = ROTATION.filter(s => s !== id)
  return rest[Math.floor(Math.random() * rest.length)]
}

const GAP = 30

// A hash names one song, which repeats until stopped. Without one, song 1 plays first, then, `GAP` seconds after a
// song ends, a random song other than that one, and so on until stopped.
export function farmMusic(): LoopFn {
  const pinned = BY_HASH[window.location.hash]
  if (pinned !== undefined) return () => songs[pinned](() => {})
  return () => {
    let stop: Stop
    const play = (id: string): void => {
      stop = songs[id](() => {
        stop()
        stop = wait(GAP, () => play(another(id)))
      })
    }
    play('song-1')
    return () => stop()
  }
}
