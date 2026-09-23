import type { LoopFn, Stop } from '../sound.h.ts'
import { startSong1 } from './song-1.ts'
import { startSong2 } from './song-2.ts'
import { startSong3 } from './song-3.ts'

export const songs: Record<string, () => Stop> = {
  'song-1': startSong1,
  'song-2': startSong2,
  'song-3': startSong3,
}

export function farmMusic(): LoopFn {
  const hash = window.location.hash
  const id = hash === '#music=2' ? 'song-2' : hash === '#music=3' ? 'song-3' : 'song-1'
  return () => songs[id]()
}
