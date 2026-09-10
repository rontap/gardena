import { Act, type Cmd } from './log.ts'
import * as family from './family.ts'
import * as necro from './feature-necronomicon/necronomicon.ts'
import * as place from './feature-place/place.ts'
import * as store from './store.ts'
import * as vehicles from './feature-vehicles/vehicle.ts'
import {
  acceptContractBody,
  cancelContractBody,
  reorderContractBody,
} from './feature-contracts/market.ts'
import type { BuyFail, World } from './world.ts'

export function applyCmd(w: World, cmd: Cmd): 'queued' | 'placed' | 'blocked' | 'noop' | BuyFail | undefined | void {
  const seat = w.seats[cmd.p]
  if (seat === undefined) return
  w.act = seat
  switch (cmd.a) {
    case Act.click:
      return place.clickBody(w, { col: cmd.c[0], row: cmd.c[1] })
    case Act.clickValve:
      place.clickValveBody(w, cmd.e)
      return
    case Act.enqueue:
      w.enqueueOn(w.act, cmd.i)
      return
    case Act.buy:
      return place.buyBody(w, cmd.s, { col: cmd.c[0], row: cmd.c[1] })
    case Act.buyPacks:
      place.buyPacksBody(w, cmd.s, { col: cmd.c[0], row: cmd.c[1] })
      return
    case Act.placePipe:
      place.placePipeBody(w, cmd.e)
      return
    case Act.placeSprinkler:
      place.placeSprinklerBody(w, cmd.s)
      return
    case Act.delete:
      if (cmd.k === 'pipe') place.deletePipeBody(w, cmd.e)
      else if (cmd.k === 'sprinkler') place.deleteSprinklerBody(w, { col: cmd.c[0], row: cmd.c[1] })
      else if (cmd.k === 'wire') w.deleteWireBody(cmd.from, cmd.to)
      else place.deleteBuildingBody(w, { col: cmd.c[0], row: cmd.c[1] })
      return
    case Act.expand:
      place.expandBody(w, cmd.k)
      return
    case Act.startResearch:
      w.startResearchBody(cmd.r)
      return
    case Act.pickSkill:
      family.pickSkillBody(w, cmd.m, cmd.s)
      return
    case Act.sellAll:
      store.sellAllBody(w)
      return
    case Act.swap:
      w.swapBody(cmd.i)
      return
    case Act.takeStore: {
      const at = { col: cmd.s[0], row: cmd.s[1] }
      if (cmd.k === 'silo') {
        const before = store.seedStoreAt(w, at).levels()
        store.takeSiloBody(w, at, cmd.c, cmd.r)
        place.restockSeedsBody(w, at, before)
        return
      }
      const before = store.additiveStoreAt(w, at).levels()
      if (cmd.k === 'sugar') store.takeSugarBody(w, at)
      else store.takeAdditiveBody(w, at, cmd.d)
      place.restockAdditivesBody(w, at, before)
      return
    }
    case Act.setRestock:
      w.setRestockBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.on)
      return
    case Act.swapChest:
      w.swapChestBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.i)
      return
    case Act.tuneSprinkler:
      w.tuneSprinklerBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.u)
      return
    case Act.openHud:
      w.openHudBody({ kind: cmd.k, at: { col: cmd.c[0], row: cmd.c[1] } })
      return
    case Act.closeHud:
      w.closeHudBody()
      return
    case Act.armDelete:
      place.armDeleteBody(w)
      return
    case Act.cancelPlace:
      place.cancelPlaceBody(w)
      return
    case Act.rotatePlace:
      place.rotatePlaceBody(w)
      return
    case Act.dismissRecap:
      w.dismissRecapBody()
      return
    case Act.ackCue:
      w.ackCueBody()
      return
    case Act.rightClick:
      place.rightClickBody(w, { col: cmd.c[0], row: cmd.c[1] })
      return
    case Act.cheat:
      if (cmd.k === 'all') w.unlockAllBody()
      else if (cmd.k === 'money') w.cheatMoneyBody()
      else if (cmd.k === 'points') w.cheatPointsBody()
      else if (cmd.k === 'research') w.toggleCheatResearchBody()
      else if (cmd.k === 'speed') w.setCheatSpeedBody(cmd.n)
      else if (cmd.k === 'day') w.endDayBody()
      else family.unlockAllSkillsBody(w)
      return
    case Act.drive:
      vehicles.driveBody(w, cmd.throttle, cmd.steer)
      return
    case Act.stride:
      w.strideBody(cmd.x, cmd.y)
      return
    case Act.buyVehicle:
      vehicles.buyVehicleBody(w, { col: cmd.c[0], row: cmd.c[1] }, cmd.k)
      return
    case Act.buyTrailer:
      vehicles.buyTrailerBody(w, { col: cmd.c[0], row: cmd.c[1] }, cmd.k)
      return
    case Act.deploy:
      vehicles.deployBody(w, cmd.v, { col: cmd.c[0], row: cmd.c[1] }, cmd.hitch)
      return
    case Act.embark:
      vehicles.embarkBody(w, cmd.v)
      return
    case Act.disembark:
      vehicles.disembarkBody(w)
      return
    case Act.dock:
      vehicles.dockBody(w)
      return
    case Act.swapVehicle:
      vehicles.swapVehicleBody(w, cmd.v, cmd.i)
      return
    case Act.swapTrailer:
      vehicles.swapTrailerBody(w, cmd.u, cmd.i)
      return
    case Act.refill:
      vehicles.refillBody(w, { col: cmd.c[0], row: cmd.c[1] })
      return
    case Act.setBoom:
      vehicles.setBoomBody(w, cmd.w)
      return
    case Act.armWire:
      w.armWireBody(cmd.from)
      return
    case Act.placeWire:
      w.placeWireBody(cmd.from, cmd.to)
      return
    case Act.tuneWater:
      w.tuneWaterBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.wilt, cmd.over)
      return
    case Act.tuneHarvest:
      w.tuneHarvestBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.mode)
      return
    case Act.tuneCounter:
      w.tuneCounterBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.n)
      return
    case Act.resetCounter:
      w.resetCounterBody({ col: cmd.c[0], row: cmd.c[1] })
      return
    case Act.tuneDay:
      w.tuneDayBody({ col: cmd.c[0], row: cmd.c[1] }, cmd.sunrise, cmd.day, cmd.sunset, cmd.twilight)
      return
    case Act.tuneSensor:
      w.tuneSensorBody(cmd)
      return
    case Act.load:
      vehicles.loadBody(w)
      return
    case Act.unload:
      vehicles.unloadBody(w)
      return
    case Act.acceptContract:
      acceptContractBody(w, cmd.c)
      return
    case Act.cancelContract:
      cancelContractBody(w, cmd.c)
      return
    case Act.reorderContract:
      reorderContractBody(w, cmd.c, cmd.d)
      return
    case Act.route:
      vehicles.routeBody(w, cmd)
      return
    case Act.necronomicon:
      if (cmd.k === 'gold') necro.sacrificeGoldBody(w)
      else necro.ritualBody(w)
      return
  }
}
