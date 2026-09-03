export type Settings = {
  reducedMotion: boolean
  pauseWhenHidden: boolean
}

export const SETTINGS_DEFAULT: Settings = { reducedMotion: false, pauseWhenHidden: false }

const SETTINGS_KEY = 'gardena.settings'

function decode(text: string): Settings {
  try {
    const raw = JSON.parse(text) as Settings
    return { reducedMotion: raw.reducedMotion === true, pauseWhenHidden: raw.pauseWhenHidden === true }
  } catch {
    return SETTINGS_DEFAULT
  }
}

function readSettings(): Settings {
  const text = localStorage.getItem(SETTINGS_KEY)
  if (text === null) return SETTINGS_DEFAULT
  return decode(text)
}

let live: Settings = readSettings()

export function settings(): Settings {
  return live
}

export function saveSettings(next: Settings): void {
  live = next
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
}

export function sameSettings(a: Settings, b: Settings): boolean {
  return a.reducedMotion === b.reducedMotion && a.pauseWhenHidden === b.pauseWhenHidden
}
