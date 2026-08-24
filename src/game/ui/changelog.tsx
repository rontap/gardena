export type ChangeKind = 'bugfix' | 'improvement' | 'feature' | 'deprecation' | 'major-feature'

export type Change =
  | { kind: 'bugfix'; text: string; notes: readonly string[] }
  | { kind: 'improvement'; text: string; notes: readonly string[] }
  | { kind: 'feature'; text: string; notes: readonly string[] }
  | { kind: 'deprecation'; text: string; notes: readonly string[] }
  | { kind: 'major-feature'; text: string; notes: readonly string[]; changes: readonly Change[] }

export type Release = {
  id: string
  name: string
  summary: string
  changes: readonly Change[]
}

export const KIND_EMOJI: { readonly [K in ChangeKind]: string } = {
  'major-feature': '🎉',
  feature: '✨',
  improvement: '🔧',
  bugfix: '🐛',
  deprecation: '🚫',
}

export const RELEASES: readonly Release[] = [
  {
    id: '1.7',
    name: 'Sight lines',
    summary: 'Effects that tell you what is running, and clearer props.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Machines now show what they are doing.',
        notes: [
          'A working sprinkler throws an animated arc out to the edge of the ground it covers.',
          'The spray stops the moment the water does, instead of lingering.',
          'Tending a plant and pouring a bucket leave a brief mark on the tile.',
          'Effects never block a click, and they stop moving if your system asks for reduced motion.',
        ],
        changes: [],
      },
      {
        kind: 'improvement',
        text: 'Redrew five props that were hard to read on the farm.',
        notes: [
          'The pump is one machine now: a rocker arm over a water sump, not two halves seen from two angles.',
          'The tap has a proper handwheel and spout, and the water lands on its base.',
          'The freezer is a steel cabinet instead of a blue chest.',
          'The mill has a millstone and a flour sack; the grinder has a drum and a crank.',
        ],
      },
    ],
  },
  {
    id: '1.6.2',
    name: 'Machine — Vehicle patch',
    summary: 'Machines, stores, and vehicles pass goods. Sensors can pause machines and read full stores.',
    changes: [
      {
        kind: 'improvement',
        text: 'The pot still is 2×1 steel.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Dropoff and takeup pads while you drive.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Load and Unload from the dash.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Wire a mill, jam machine, or still to disable its input.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Chests, freezers, the seed silo, and the additive store output when full.',
        notes: [],
      },
    ],
  },
  {
    id: '1.6.1',
    name: 'Sensors polish',
    summary: 'The Sensors tab opens the overlay. Ports, wires, and water-system look are clearer.',
    changes: [
      {
        kind: 'bugfix',
        text: 'Opening the Sensors shelf turns on the Sensors overlay. Closing Build, Shop, or Escape turns it off.',
        notes: [
          'Switching to another Build category does not turn it off. Shop to Build keeps the overlay.',
        ],
      },
      {
        kind: 'bugfix',
        text: 'Sensor tiles stay unfaded on the Sensors overlay.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'Ports draw as small circles (outputs) and squares (inputs), including sprinklers and smart valves.',
        notes: ['AND and OR gates are more compact. The lamp input sits on top.'],
      },
      {
        kind: 'improvement',
        text: 'Drawing the same wire again removes it. Inputs take many wires (OR).',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'A water-system sensor with no pipes around it says so.',
        notes: [],
      },
    ],
  },
  {
    id: '1.6',
    name: 'Automation III',
    summary: 'Sensors and Smart Irrigation.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Added the Sensors shelf: wires, lever, button, lamp, AND, OR, and NOT.',
        notes: [
          'Research Sensors. Click a port to draw a wire.',
          'Throw the lever. Press the button for a short pulse. The lamp lights when its input is high.',
          'AND is high if both inputs are. OR if either is. NOT inverts.',
        ],
        changes: [],
      },
      {
        kind: 'major-feature',
        text: 'Field readers: water, fertilizer, harvest, and water-system sensors.',
        notes: [
          'Water reads nearby plant water. High when a plot matches the checked boxes.',
          'Fertilizer reads nearby growing plants. High when any is starving.',
          'Harvest: Any — one ripe. All — every growing or ripe plant is ripe.',
          'Water-system joins a net. High when sprinklers want more than the tanks hold.',
        ],
        changes: [],
      },
      {
        kind: 'major-feature',
        text: 'Smart Irrigation: existing sprinklers gain a signal input.',
        notes: ['Unwired sprinklers still pour. Wire one to turn it on and off.'],
        changes: [],
      },
      {
        kind: 'major-feature',
        text: 'Added a smart valve and a vehicle detector.',
        notes: [
          'Smart valve sits on an edge. Closed unless its input is high. No manual click.',
          'Vehicle detector is a flush plate. High when a field Quad or tractor sits on this tile.',
        ],
        changes: [],
      },
    ],
  },
  {
    id: '1.5.2',
    name: 'Vehicles II patch',
    summary: 'Boom width, slower machines, weed spray, and skill moves.',
    changes: [
      {
        kind: 'feature',
        text: 'Tractor boom switches between 3 and 5 while you drive.',
        notes: ['A dash button shows the current width. Quad has no boom.'],
      },
      {
        kind: 'improvement',
        text: 'Vehicles are slower. Tilled soil and rocks drag more; paving is still faster.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Enter boards the nearest parked machine, or gets you off if you are driving.',
        notes: ['Works within a short walk. The dash Disembark button and the parked Embark button stay.'],
      },
      {
        kind: 'feature',
        text: 'Weed spray and weed outbreaks.',
        notes: [
          'Buy spray in Supplies. Click tilled soil to starve weeds there.',
          'A fully grown weed seeds its four neighbours.',
        ],
      },
      {
        kind: 'improvement',
        text: 'Driving classes sit on you. Machinery and contracts sit on your husband. Bulk buying is always on.',
        notes: ['Ctrl-click seed packs to buy five at a discount. No skill lock.'],
      },
      {
        kind: 'improvement',
        text: 'Fertilizer bags and buckets hold more.',
        notes: [],
      },
    ],
  },
  {
    id: '1.5.1',
    name: 'Shop split',
    summary: 'The store and the build menu are two panels, with search across both.',
    changes: [
      {
        kind: 'improvement',
        text: 'The shop is two panels: General store to buy, Build to place.',
        notes: [
          'Categories are filed by what a thing does, not when it shipped. Water holds every pump, pipe, and sprinkler; the chest and the freezer sit together.',
          'Cards in a grid, three across, with a category rail down the side. Research uses the same shell.',
        ],
      },
      {
        kind: 'feature',
        text: 'Search both panels at once.',
        notes: [
          'Type in either panel and results come from both. Picking one that lives in the other panel takes you there.',
          'Escape clears the box before it closes anything.',
        ],
      },
      {
        kind: 'bugfix',
        text: 'The build buttons appear for the compost box.',
        notes: ['Delete and Cancel were missing while a compost box was on the cursor.'],
      },
      {
        kind: 'bugfix',
        text: 'Opening the settings menu no longer leaves the pipe layer on.',
        notes: ['Closing the shop through the gear or multiplayer button dropped the ghost but kept the pipe overlay up.'],
      },
    ],
  },
  {
    id: '1.5',
    name: 'Vehicle Update II',
    summary: 'Tractor, trailers, and field silos.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Drive a tractor with a seeder, sprayer, or harvester.',
        notes: [
          'Buy the tractor and three trailers at a hangar. The boom seeds, sprays, or harvests when you drive straight.',
          'Three inert field silos. Capacity 100 on the dash.',
        ],
        changes: [],
      },
    ],
  },
  {
    id: '1.4',
    name: 'Vehicle Update I',
    summary: 'Vehicles arrive on the farms! Jet around with a quad around your large farm!',
    changes: [
      {
        kind: 'major-feature',
        text: 'New research unlocks a new building, hangar. First vehicle: quad',
        notes: [
          'Quad is deployed from the hangar, has six item slots, and docks back on the arrows.',
          'Fuel and speed are shown on the dashboard. Surfaces affect how fast the quad is.',
        ],
        changes: [],
      },
    ],
  },
  {
    id: '1.3',
    name: 'Seed silo and fertilizer store',
    summary: 'Seeds and fertilizer no longer spawn in the house.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Added a seed silo next to the house.',
        notes: [
          'Bought seed packs go into the silo, up to individual 100 seeds.',
          'Starter packs start are also spawned there.',
        ],
        changes: [],
      },
      {
        kind: 'major-feature',
        text: 'Added a fertilizer store next to the house.',
        notes: ['Fertilizer, synthetic fertilizer, and compost are kept here as liters, up to 200 L.'],
        changes: [],
      },
      {
        kind: 'improvement',
        text: 'Walk up to a store to drop off what it stores. Click a pile to take it with you.',
        notes: [],
      },
      {
        kind: 'deprecation',
        text: 'Buying fertilizer no longer puts a bag in your hand to place on a plot. It fills the fertilizer store instead.',
        notes: [],
      },
    ],
  },
  {
    id: '1.2',
    name: 'Machine Update I',
    summary: 'Machines on the farm turn crops into goods you can sell.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Added a mill, jam machine, pot still, wine barrel, and freezer.',
        notes: [
          'Harvest sugar cane like a crop. Mill the cane, or buy sugar, to get liters of sugar.',
          'The mill also turns olives into oil, wheat into flour, and grass into extract.',
          'The jam machine makes jam, and ketchup from tomatoes.',
          'The pot still distills spirits.',
          'The wine barrel ages grapes into wine.',
          'The freezer stops food from going stale while it sits inside.',
        ],
        changes: [],
      },
      {
        kind: 'improvement',
        text: 'Finishing one research can unlock several machines at once.',
        notes: [
          'Seed grinder also unlocks the mill.',
          'Preservatives unlocks jam, freezer, and sugar.',
          'Fermentation unlocks the still, the barrel, and sugar cane.',
        ],
      },
    ],
  },
  {
    id: '1.1',
    name: 'Multiplayer beta',
    summary: 'Added multiplayer to the game. Up to four players can play simultaneously on the same farm.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Host from the in-game menu. Friends join from the main menu with a room key.',
        notes: ['Money and land are shared.', 'When anyone pauses, the whole farm pauses.'],
        changes: [],
      },
    ],
  },
  {
    id: '1.0',
    name: 'Early Access',
    summary: 'You can leave the farm and come back to it.',
    changes: [
      {
        kind: 'feature',
        text: 'Added a main menu: new game, load, upload a save, and (in play) save or download.',
        notes: [],
      },
      { kind: 'feature', text: 'The first new farm walks you through a short tour.', notes: [] },
      { kind: 'feature', text: 'Added a Pause button on the top bar.', notes: [] },
      {
        kind: 'improvement',
        text: 'The well connects to the pipe network. Click it with a bucket to fill.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'Weeds and grass are gentler on the first day of a new farm.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'A map overlay colors untilled ground so you can see poor dirt before you dig.',
        notes: [],
      },
    ],
  },
  {
    id: '0.8',
    name: 'Plants & Trees',
    summary: 'Trees and new crops.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Added apple, apricot, lemon, and cherry trees. Ripe fruit drops on the grass by itself.',
        notes: [],
        changes: [],
      },
      { kind: 'feature', text: 'Added olive, grape, vanilla, and sugar cane.', notes: [] },
      { kind: 'deprecation', text: 'Wild berry shrubs are gone.', notes: [] },
    ],
  },
  {
    id: '0.7.4',
    name: 'Cottage',
    summary: 'Fences, lawn, and a cleaner interface.',
    changes: [
      { kind: 'feature', text: 'Added wooden fences you can place on untilled ground.', notes: [] },
      { kind: 'feature', text: 'Added cobble, brick, and paved ground tiles.', notes: [] },
      {
        kind: 'feature',
        text: 'Added grass seeds. Once they grow, the plot becomes lawn again.',
        notes: [],
      },
      { kind: 'feature', text: 'Added a rotary shovel and a diamond pickaxe.', notes: [] },
      {
        kind: 'improvement',
        text: 'Shop, research, and family panels were redone. Blocked buttons now say why you cannot use them.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'The end-of-day recap now shows your stipend, tax, and remaining money.',
        notes: [],
      },
    ],
  },
  {
    id: '0.6',
    name: 'Family',
    summary: 'Added family menu, where family members can gain skills that help you in minor ways as you progress the game.',
    changes: [
      {
        kind: 'major-feature',
        text: 'You garden, your husband runs research, your daughter runs the market.',
        notes: ['Each morning everyone gets a skill point.', 'Pick skills on the Family panel.'],
        changes: [],
      },
      {
        kind: 'improvement',
        text: 'The market closes at sunset until you unlock Open late or Open 24/7.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'Map overlays for water and soil quality unlock from study skills.',
        notes: [],
      },
    ],
  },
  {
    id: '0.5',
    name: 'Irrigation II',
    summary: 'More control over watering.',
    changes: [
      { kind: 'feature', text: 'Added manual valves to control the flow in pipes.', notes: [] },
      {
        kind: 'feature',
        text: 'Added a tap that fills buckets from an existing pipe network.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Added a rainwater tank that passively gathers rainwater.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Smart sprinklers: click a sprinkler, pick a crop, and it pours only as much as that crop drinks.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'Pumps, wells, and tanks now store water. A pipe only needs to touch a source at one corner to connect.',
        notes: [],
      },
    ],
  },
  {
    id: '0.4',
    name: 'Plant care',
    summary: 'Plants can be overwatered, rot, and be composted.',
    changes: [
      {
        kind: 'feature',
        text: 'Added a compost box. Drop in rotten fruit and dead plants; it makes compost.',
        notes: [],
      },
      { kind: 'feature', text: 'Added synthetic fertilizer.', notes: [] },
      {
        kind: 'improvement',
        text: 'Plants now care about both water and fertilizer. Too much water hurts them.',
        notes: [],
      },
    ],
  },
  {
    id: '0.3',
    name: 'Dirt Overhaul & Fertilizers',
    summary: 'Water and fertilizer belong to the dirt, not the plant.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Water and fertilizer now live in the soil.',
        notes: [
          'You can water bare tilled dirt.',
          'Harvesting, digging, or a plant dying no longer wipes the soil.',
        ],
        changes: [],
      },
      { kind: 'feature', text: 'Weeds sprout on empty tilled plots.', notes: [] },
      { kind: 'feature', text: 'Grass can spread on untilled ground.', notes: [] },
      { kind: 'feature', text: 'Added a fertilizer bag.', notes: [] },
      {
        kind: 'deprecation',
        text: 'Plants no longer have their own thirst. The dirt holds the water.',
        notes: [],
      },
    ],
  },
  {
    id: '0.1',
    name: 'Market truck',
    summary: 'Sell at the stall, not the house.',
    changes: [
      {
        kind: 'feature',
        text: 'Take crops to the market truck. Open the market to sell them.',
        notes: [],
      },
      {
        kind: 'deprecation',
        text: 'You can no longer sell by walking to the house door.',
        notes: [],
      },
    ],
  },
  {
    id: 'beta-6',
    name: 'Staleness mechanics',
    summary: 'Picked fruit goes stale. Better fruit shows a gem.',
    changes: [
      { kind: 'feature', text: 'Picked fruit now goes stale and can rot.', notes: [] },
      { kind: 'feature', text: 'Better fruit shows a gem. A map overlay highlights rarity.', notes: [] },
      {
        kind: 'feature',
        text: 'Delete moved onto the toolbar. You can remove buildings (no refund). The house and starter pump stay.',
        notes: [],
      },
      {
        kind: 'improvement',
        text: 'Days now have sunrise, day, sunset, and twilight. The almanac is split into tabs.',
        notes: [],
      },
    ],
  },
  {
    id: 'beta-5',
    name: 'Irrigation',
    summary: 'Pipes and sprinklers water the tilled lands for you.',
    changes: [
      {
        kind: 'major-feature',
        text: 'Added pipes between tiles and sprinklers at the corners.',
        notes: [],
        changes: [],
      },
      { kind: 'feature', text: 'Added a well.', notes: [] },
      { kind: 'feature', text: 'Added watermelon.', notes: [] },
      { kind: 'feature', text: 'Added a map overlay that shows the water network.', notes: [] },
      {
        kind: 'bugfix',
        text: 'Sprinklers can be placed before they have water; they do nothing until a source feeds them. Empty pipes look dry.',
        notes: [],
      },
    ],
  },
  {
    id: 'beta-4',
    name: 'Almanac',
    summary: 'A catalog of crops and tools, plus storage is added.',
    changes: [
      {
        kind: 'feature',
        text: 'Added the Almanac: a catalog of crops, tools, and buildings.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'Added map overlays that color soil water, ripeness, and what is on a tile.',
        notes: [],
      },
      { kind: 'feature', text: 'Added a chest you can walk up to and store items in.', notes: [] },
      { kind: 'feature', text: 'Added a seed grinder: put fruit in, get seeds out.', notes: [] },
      {
        kind: 'improvement',
        text: 'The shop has tabs. Research uses readable names.',
        notes: [],
      },
    ],
  },
  {
    id: 'beta-3',
    name: 'Land Expansion',
    summary: 'Buy more land. Rocks and shrubs show up farther out.',
    changes: [
      {
        kind: 'major-feature',
        text: 'You can buy neighboring land. Owned land is taxed at night.',
        notes: [],
        changes: [],
      },
      { kind: 'feature', text: 'Added rocks and a pickaxe.', notes: [] },
      {
        kind: 'feature',
        text: 'Added berry shrubs. Harvest berries; shovel a ripe shrub to plant it.',
        notes: [],
      },
      {
        kind: 'feature',
        text: 'The pumpjack is now a building you place, not an upgrade to the starter pump.',
        notes: [],
      },
    ],
  },
  {
    id: 'beta-2',
    name: 'Inventory',
    summary: 'A house inventory and buckets instead of cans.',
    changes: [
      {
        kind: 'feature',
        text: 'The house now has 16 inventory slots. Swap with what you are holding.',
        notes: [],
      },
      { kind: 'feature', text: 'You start with a 3 L bucket. A larger bucket is in the shop.', notes: [] },
      { kind: 'deprecation', text: 'Watering cans are gone.', notes: [] },
      {
        kind: 'improvement',
        text: 'Shop, research, and market are side panels.',
        notes: [],
      },
    ],
  },
  {
    id: 'beta-1',
    name: 'First farm',
    summary: 'Shovel, plant, water, harvest, sell.',
    changes: [
      {
        kind: 'major-feature',
        text: 'The first playable farm: shovel, plant, water, harvest, and sell.',
        notes: [
          'House, water pump, shop, research, and market.',
          'Crops: carrot, potato, wheat, tomato, raspberry.',
        ],
        changes: [],
      },
    ],
  },
]

function ChangeItems({ changes }: { changes: readonly Change[] }) {
  return (
    <>
      {changes.map((change, i) => (
        <div key={i}>
          <div className="flex text-base">
            <span className="w-6 shrink-0">{KIND_EMOJI[change.kind]}</span>
            <span>{change.text}</span>
          </div>
          {change.notes.map((note, j) => (
            <div key={j} className="pl-6 text-base text-ink/45">
              {note}
            </div>
          ))}
          {change.kind === 'major-feature' && change.changes.length > 0 ? (
            <div className="pl-4">
              <ChangeItems changes={change.changes} />
            </div>
          ) : null}
        </div>
      ))}
    </>
  )
}

export function Changelog() {
  return (
    <div className="scroll-pane max-h-[min(32rem,calc(100vh-14rem))] overflow-y-auto flex flex-col gap-3">
      {RELEASES.map((release, i) => (
        <div key={release.id}>
          <div className="text-lg font-semibold">
            {release.id} {release.name}
          </div>
          <div className="text-base text-ink/45">{release.summary}</div>
          <div className="pl-3">
            <ChangeItems changes={release.changes} />
          </div>
          {i < RELEASES.length - 1 ? <div className="h-px bg-ink/20 my-1" /> : null}
        </div>
      ))}
    </div>
  )
}
