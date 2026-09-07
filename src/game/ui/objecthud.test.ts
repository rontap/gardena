import { expect, test } from 'vitest'
import { makeSensor } from '../sim/sensor.ts'
import { World } from '../sim/world.ts'
import { hudSpec } from './objecthud.tsx'

test('Sensor ObjectHud uses HudSpec.rows check/radio', () => {
  const w = new World(1)
  const put = (
    kind: 'sensor-water' | 'sensor-harvest' | 'logic' | 'sensor-variety' | 'sensor-weather' | 'vehicle-detector',
    at: { col: number; row: number },
  ) => {
    w.setCell(at, makeSensor(kind, { shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
  }
  const water = { col: 10, row: 12 }
  const harvest = { col: 11, row: 12 }
  const logic = { col: 12, row: 12 }
  const variety = { col: 10, row: 13 }
  const weather = { col: 11, row: 13 }
  const pressure = { col: 12, row: 13 }
  put('sensor-water', water)
  put('sensor-harvest', harvest)
  put('logic', logic)
  put('sensor-variety', variety)
  put('sensor-weather', weather)
  put('vehicle-detector', pressure)
  const waterHud = hudSpec(w, { kind: 'water', at: water })
  expect(waterHud?.chrome).toBe('rows')
  if (waterHud?.chrome !== 'rows') throw new Error('water')
  expect(waterHud.rows.map(r => r.kind)).toEqual(['check', 'check'])
  const harvestHud = hudSpec(w, { kind: 'harvest', at: harvest })
  expect(harvestHud?.chrome).toBe('rows')
  if (harvestHud?.chrome !== 'rows') throw new Error('harvest')
  expect(harvestHud.rows.map(r => r.kind)).toEqual(['radio'])
  const logicHud = hudSpec(w, { kind: 'logic', at: logic })
  expect(logicHud?.chrome).toBe('rows')
  if (logicHud?.chrome !== 'rows') throw new Error('logic')
  expect(logicHud.rows.map(r => r.kind)).toEqual(['radio'])
  const varietyHud = hudSpec(w, { kind: 'variety', at: variety })
  expect(varietyHud?.chrome).toBe('rows')
  if (varietyHud?.chrome !== 'rows') throw new Error('variety')
  expect(varietyHud.rows.map(r => r.kind)).toEqual(['check', 'check', 'check'])
  const weatherHud = hudSpec(w, { kind: 'weather', at: weather })
  expect(weatherHud?.chrome).toBe('rows')
  if (weatherHud?.chrome !== 'rows') throw new Error('weather')
  expect(weatherHud.rows.map(r => r.kind)).toEqual(['check', 'check', 'check', 'check', 'check'])
  const pressureHud = hudSpec(w, { kind: 'pressure', at: pressure })
  expect(pressureHud?.chrome).toBe('rows')
  if (pressureHud?.chrome !== 'rows') throw new Error('pressure')
  expect(pressureHud.rows.map(r => r.kind)).toEqual(['check', 'check', 'check'])
})
