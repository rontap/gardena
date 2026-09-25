import type { LoopFn, Stop } from '../sound.h.ts'
import { startSong1 } from './song-1.ts'
import { startSong2 } from './song-2.ts'
import { startSong3 } from './song-3.ts'
import { startSong4 } from './song-4.ts'
import { startSong5 } from './song-5.ts'
import { startSong6 } from './song-6.ts'
import { startSong7, startSong7b } from './song-7.ts'

export const songs: Record<string, () => Stop> = {
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
  '#music=2': 'song-2',
  '#music=3': 'song-3',
  '#music=4': 'song-4',
  '#music=5': 'song-5',
  '#music=6': 'song-6',
  '#music=7': 'song-7',
  '#music=7b': 'song-7b',
}

export function farmMusic(): LoopFn {
  const id = BY_HASH[window.location.hash] ?? 'song-1'
  return () => songs[id]()
}
