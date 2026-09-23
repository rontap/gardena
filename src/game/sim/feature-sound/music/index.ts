import type { LoopFn, Stop } from '../sound.h.ts'
import { startSong1 } from './song-1.ts'
import { startSong2 } from './song-2.ts'
import { startSong3 } from './song-3.ts'
import { startSong4 } from './song-4.ts'

export const songs: Record<string, () => Stop> = {
  'song-1': startSong1,
  'song-2': startSong2,
  'song-3': startSong3,
  'song-4': startSong4,
}

const BY_HASH: Partial<Record<string, string>> = { '#music=2': 'song-2', '#music=3': 'song-3', '#music=4': 'song-4' }

export function farmMusic(): LoopFn {
  const id = BY_HASH[window.location.hash] ?? 'song-1'
  return () => songs[id]()
}
