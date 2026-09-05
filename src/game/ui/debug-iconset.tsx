import { ANNUAL_IDS, TREE_IDS, type CropId } from '../sim/ids.ts'
import { CROPS, FRUIT, TREE_PROP, TREE_SEED_ART, groupInner, svgGroupIds, svgViewBox } from '../view/svgs.ts'
import { Chrome } from './frame.tsx'

type File = { file: string; crop: CropId; raw: string }

const FRUIT_FILES: File[] = ([...ANNUAL_IDS, ...TREE_IDS] as CropId[]).map(crop => ({
  file: `fruit-${crop}`,
  crop,
  raw: FRUIT[crop],
}))

const GROWTH_FILES: File[] = ANNUAL_IDS.map(crop => ({
  file: `crop-${crop}`,
  crop,
  raw: CROPS[crop],
}))

const TREE_FILES: File[] = TREE_IDS.map(crop => ({
  file: `prop-${crop}-tree`,
  crop,
  raw: TREE_PROP[crop],
}))

function Cell({
  file,
  id,
  body,
  viewBox,
  tall,
}: {
  file: string
  id: string
  body: string
  viewBox: string
  tall: boolean
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 bg-dirt/25 px-2 py-2"
    >
      <svg
        viewBox={viewBox}
        className={tall ? 'h-40 w-20 shrink-0' : 'h-16 w-16 shrink-0'}
        shapeRendering="crispEdges"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <span className="text-center text-xs text-ink/70">{file}</span>
      <span className="text-center text-xs font-semibold">{id}</span>
    </div>
  )
}

function GroupSection({
  title,
  files,
  tall,
  cols,
}: {
  title: string
  files: File[]
  tall: boolean
  cols: 4 | 6
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-display text-sm">{title}</div>
      <div className={cols === 6 ? 'grid grid-cols-6 gap-2' : 'grid grid-cols-4 gap-2'}>
        {files.flatMap(({ file, raw }) =>
          svgGroupIds(raw).map(id => (
            <Cell
              key={`${file}:${id}`}
              file={file}
              id={id}
              body={groupInner(raw, id)}
              viewBox={svgViewBox(raw)}
              tall={tall}
            />
          )),
        )}
      </div>
    </div>
  )
}

function Seeds() {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-display text-sm">seeds</div>
      <div className="grid grid-cols-4 gap-2">
        {ANNUAL_IDS.flatMap(crop => {
          const raw = CROPS[crop]
          const file = `crop-${crop}`
          return svgGroupIds(raw)
            .filter(id => id.startsWith('ripe'))
            .map(id => (
              <Cell
                key={`seed:${file}:${id}`}
                file={file}
                id={id}
                body={groupInner(raw, id)}
                viewBox={svgViewBox(raw)}
                tall={false}
              />
            ))
        })}
        {TREE_IDS.map(crop => (
          <Cell
            key={`item-seed-${crop}`}
            file={`item-seed-${crop}`}
            id="seed"
            body={TREE_SEED_ART[crop]}
            viewBox="0 0 24 24"
            tall={false}
          />
        ))}
      </div>
    </div>
  )
}

export function DebugIconset() {
  return (
    <div className="h-screen overflow-y-auto scroll-pane bg-ink p-4">
      <div className="relative mx-auto w-[72rem]">
        <Chrome className="relative px-4 py-3">
          <div className="relative z-20 flex flex-col gap-6">
            <div className="font-display text-lg">#debug-iconset</div>
            <GroupSection title="fruits" files={FRUIT_FILES} tall={false} cols={4} />
            <Seeds />
            <GroupSection title="growth" files={GROWTH_FILES} tall={false} cols={6} />
            <GroupSection title="trees" files={TREE_FILES} tall cols={4} />
          </div>
        </Chrome>
      </div>
    </div>
  )
}
