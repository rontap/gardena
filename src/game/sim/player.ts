import type { PlayerId } from './world.h.ts'

export const MP_ID_KEY = 'gardena-mp-id'
export const MP_NAME_KEY = 'gardena-mp-name'
export const NAME_MAX = 16

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX)
}

export function localPlayerName(): string {
  return cleanName(localStorage.getItem(MP_NAME_KEY) ?? '')
}

export function setLocalPlayerName(raw: string): void {
  localStorage.setItem(MP_NAME_KEY, cleanName(raw))
}

export function localPlayerId(): PlayerId {
  const have = localStorage.getItem(MP_ID_KEY)
  if (have !== null) return have
  const id = crypto.randomUUID()
  localStorage.setItem(MP_ID_KEY, id)
  return id
}
