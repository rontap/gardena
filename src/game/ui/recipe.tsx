import { m } from '../../paraglide/messages.js'
import type { Amount, Craft, Ingredient, MachineId, Recipe, Yield } from '../sim/recipe.ts'
import { clockText, craftMachine, recipesOf } from '../sim/recipe.ts'
import type { Face } from '../sim/item.ts'
import { faceName } from '../sim/item.ts'
import { bindHud } from '../view/motion.ts'
import { faceGfx, UI_ARROW_FILL, UI_ARROW_INK } from '../view/svgs.ts'
import { useCycle } from './cycle.ts'

export type RecipeView =
  | { kind: 'list'; machine: MachineId }
  | { kind: 'one'; recipe: Recipe }
  | { kind: 'live'; craft: Craft }

type Size = 'sm' | 'md'

const FACE: { readonly [K in Size]: string } = { sm: 'h-6 w-6', md: 'h-8 w-8' }
const ARROW: { readonly [K in Size]: string } = { sm: 'h-5 w-10', md: 'h-6 w-12' }
const TYPE: { readonly [K in Size]: string } = { sm: 'text-sm', md: 'text-base' }

function num(n: number): string {
  return String(Number(n.toFixed(2)))
}

function amountText(a: Amount): string {
  if (a.kind === 'liters') return m.hud_amount_liters({ n: num(a.l) })
  if (a.kind === 'waste') return m.hud_waste({ n: a.n })
  return String(a.n)
}

function cycleLen(recipe: Recipe): number {
  const ins = recipe.inputs.flatMap(i => (i.kind === 'any' ? [i.faces.length] : []))
  const out = recipe.out.kind === 'range' ? recipe.out.faces.length : 1
  return Math.max(1, out, ...ins)
}

function Slot({ face, text, size, warn }: { face: Face; text: string; size: Size; warn: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <svg viewBox="0 0 24 24" className={`shrink-0 ${FACE[size]}`} dangerouslySetInnerHTML={{ __html: faceGfx(face) }} />
      <span className={`flex min-w-0 flex-col ${warn ? 'font-bold text-roof' : 'text-ink/80'}`}>
        <span className={`${TYPE[size]} leading-tight`}>{faceName(face)}</span>
        <span className={`${TYPE[size]} leading-none tabular-nums`}>{text}</span>
      </span>
    </span>
  )
}

function InputSlot({
  input,
  size,
  text,
  warn,
  stage,
}: {
  input: Ingredient
  size: Size
  text: string
  warn: boolean
  stage: number
}) {
  const face = input.kind === 'one' ? input.face : input.faces[stage % input.faces.length]
  return <Slot face={face} text={text} size={size} warn={warn} />
}

function OutputSlot({ out, size, stage }: { out: Yield; size: Size; stage: number }) {
  const text = out.kind === 'range' ? `${out.min}-${out.max}` : amountText(out.amount)
  const face = out.kind === 'range' ? out.faces[stage % out.faces.length] : out.face
  return <Slot face={face} text={text} size={size} warn={false} />
}

function Arrow({ fill, size, live }: { fill: number; size: Size; live: boolean }) {
  const pct = fill <= 0 ? 0 : fill >= 1 ? 100 : fill * 100
  return (
    <span className={`relative block ${ARROW[size]}`}>
      <svg
        viewBox="0 0 24 24"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-25"
        dangerouslySetInnerHTML={{ __html: UI_ARROW_INK }}
      />
      <span
        ref={live ? el => bindHud('craft-fill', el) : undefined}
        data-craft-fill
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          preserveAspectRatio="none"
          className={`absolute inset-y-0 left-0 h-full ${ARROW[size]}`}
          dangerouslySetInnerHTML={{ __html: UI_ARROW_INK }}
        />
        <svg
          viewBox="0 0 24 24"
          preserveAspectRatio="none"
          className={`absolute inset-y-0 left-0 h-full ${ARROW[size]}`}
          dangerouslySetInnerHTML={{ __html: UI_ARROW_FILL }}
        />
      </span>
    </span>
  )
}

function Row({
  recipe,
  size,
  fill,
  time,
  short,
  live,
}: {
  recipe: Recipe
  size: Size
  fill: number
  time: string
  short: { at: number; text: string }
  live: boolean
}) {
  const stage = useCycle(cycleLen(recipe))
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {recipe.inputs.map((input, i) => (
          <InputSlot
            key={i}
            input={input}
            size={size}
            text={i === short.at ? short.text : amountText(input.amount)}
            warn={i === short.at}
            stage={stage}
          />
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Arrow fill={fill} size={size} live={live} />
        <span
          ref={live ? el => bindHud('craft-time', el) : undefined}
          data-craft-time
          className={`${TYPE[size]} leading-none tabular-nums text-ink/70`}
        >
          {time}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 justify-end">
        <OutputSlot out={recipe.out} size={size} stage={stage} />
      </div>
    </div>
  )
}

const NO_SHORT = { at: -1, text: '' }

function stateLine(craft: Craft): string {
  if (craft.kind === 'idle') return m.hud_craft_empty()
  if (craft.kind === 'paused') return m.hud_craft_paused()
  if (craft.kind === 'thirsty') return m.hud_craft_thirsty()
  if (craft.kind === 'ready') return m.hud_craft_blocked()
  return ''
}

function LiveRow({ craft, size }: { craft: Craft; size: Size }) {
  const rows = recipesOf(craftMachine(craft))
  const cycled = useCycle(rows.length)
  const recipe = craft.kind === 'idle' ? rows[cycled] : craft.recipe
  const fill = craft.kind === 'working' ? craft.progress : craft.kind === 'ready' ? 1 : 0
  const short =
    craft.kind === 'filling' ? { at: craft.at, text: `${num(craft.have)}/${num(craft.need)}` } : NO_SHORT
  const time = craft.kind === 'working' ? clockText(craft.left) : clockText(recipe.duration.seconds)
  const line = stateLine(craft)
  return (
    <div className="flex flex-col">
      <Row recipe={recipe} size={size} fill={fill} time={time} short={short} live={true} />
      {line !== '' && <span className={`${TYPE[size]} leading-tight font-semibold text-roof`}>{line}</span>}
    </div>
  )
}

export function Recipes({ view, size }: { view: RecipeView; size: Size }) {
  if (view.kind === 'live') {
    return (
      <div className="pointer-events-none">
        <LiveRow craft={view.craft} size={size} />
      </div>
    )
  }
  if (view.kind === 'one') {
    return (
      <div className="pointer-events-none">
        <Row
          recipe={view.recipe}
          size={size}
          fill={1}
          time={clockText(view.recipe.duration.seconds)}
          short={NO_SHORT}
          live={false}
        />
      </div>
    )
  }
  return (
    <div className="pointer-events-none flex flex-col divide-y divide-ink/10">
      {recipesOf(view.machine).map((recipe, i) => (
        <Row
          key={i}
          recipe={recipe}
          size={size}
          fill={1}
          time={clockText(recipe.duration.seconds)}
          short={NO_SHORT}
          live={false}
        />
      ))}
    </div>
  )
}
