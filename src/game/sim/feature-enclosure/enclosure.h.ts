import type { Coord } from '../building.ts'

export type EnclosureId = number

export type Enclosure = {
  id: EnclosureId
  interior: Coord[]
  fences: Coord[]
}
