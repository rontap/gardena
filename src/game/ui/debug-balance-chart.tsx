import { CROP_NAME } from '../defs/crops.ts'
import type { GrownCrop } from '../sim/ids.ts'
import { useEffect, useRef, type RefObject } from 'react'
import { Check } from './debug-balance-check.tsx'
import { CLICK_SECONDS, HAND_DAY_SECONDS, type HandLine, type HandSat } from './debug-balance.ts'

const LINE: { readonly [K in GrownCrop]: string } = {
  carrot: '#d4a017',
  potato: '#8a5a32',
  wheat: '#6bc04a',
  tomato: '#c43c3c',
  raspberry: '#8b3a2a',
  grape: '#6b1f8c',
  vanilla: '#d4788c',
  chilli: '#e04610',
  'sugar-cane': '#4a7c3f',
  apple: '#6b4423',
  apricot: '#e07b18',
  olive: '#3a6232',
  cherry: '#e23b2e',
}

export function HandChart({
  lines,
  autoWater,
  onAutoWater,
  sat,
  onSat,
  hidden,
  onHidden,
}: {
  lines: HandLine[]
  autoWater: boolean
  onAutoWater: (v: boolean) => void
  sat: HandSat
  onSat: (s: HandSat) => void
  hidden: ReadonlySet<GrownCrop>
  onHidden: (id: GrownCrop, on: boolean) => void
}) {
  const money: RefObject<HTMLCanvasElement | null> = useRef(null)
  const ratio: RefObject<HTMLCanvasElement | null> = useRef(null)
  useHandPlot(money, lines, hidden, 'cpm', '$/min', -10)
  useHandPlot(ratio, lines, hidden, 'pps', '$ / unit', null)

  return (
    <section className="flex flex-col gap-2">
      <div className="font-display text-sm">Hand income</div>
      <Check on={autoWater} label="Automatically watered" onChange={onAutoWater} />
      <div className="flex flex-wrap gap-3">
        <SatNum
          k="Lowering max %"
          value={sat.loweringMax}
          onChange={n => onSat({ ...sat, loweringMax: n })}
        />
        <SatNum k="Per unit %" value={sat.perUnit} onChange={n => onSat({ ...sat, perUnit: n })} />
        <SatNum
          k="Recovery per day %"
          value={sat.recoveryPerDay}
          onChange={n => onSat({ ...sat, recoveryPerDay: n })}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {lines.map(l => (
          <Check
            key={l.id}
            on={hidden.has(l.id) === false}
            label={CROP_NAME[l.id]()}
            onChange={on => onHidden(l.id, on === false)}
          />
        ))}
      </div>
      <div className="text-xs text-ink/45">
        {CLICK_SECONDS} s a click · Field clicks per plant · day {HAND_DAY_SECONDS} s
      </div>
      <div className="h-[22rem]">
        <canvas ref={money} />
      </div>
      <div className="font-display text-sm">Profit per unit</div>
      <div className="h-[22rem]">
        <canvas ref={ratio} />
      </div>
    </section>
  )
}

function useHandPlot(
  canvas: RefObject<HTMLCanvasElement | null>,
  lines: HandLine[],
  hidden: ReadonlySet<GrownCrop>,
  key: 'cpm' | 'pps',
  yTitle: string,
  yMin: number | null,
): void {
  useEffect(() => {
    const el = canvas.current
    if (el === null) return
    let chart: { destroy: () => void } | null = null
    let dead = false
    void import('chart.js/auto').then(mod => {
      if (dead) return
      const Chart = mod.default
      const shown = lines.filter(l => hidden.has(l.id) === false)
      const labels = shown.length === 0 ? [] : shown[0].points.map(p => p.planted)
      chart = new Chart(el, {
        type: 'line',
        data: {
          labels,
          datasets: shown.map(l => ({
            label: CROP_NAME[l.id](),
            data: l.points.map(p => p[key]),
            borderColor: LINE[l.id],
            backgroundColor: LINE[l.id],
            pointRadius: 0,
            borderWidth: 2,
            tension: 0.15,
          })),
        },
        options: {
          animation: false,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            x: {
              title: { display: true, text: 'Planted' },
              ticks: { maxTicksLimit: 12 },
            },
            y: {
              title: { display: true, text: yTitle },
              min: yMin === null ? undefined : yMin,
            },
          },
        },
      })
    })
    return () => {
      dead = true
      chart?.destroy()
    }
  }, [lines, hidden, key, yTitle, yMin, canvas])
}

function SatNum({ k, value, onChange }: { k: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center gap-1 text-xs">
      <span className="text-ink/60">{k}</span>
      <input
        type="number"
        step="any"
        value={value}
        className="w-[4.75rem] border-2 border-ink/30 bg-parch px-1 py-0.5 font-mono text-xs tabular-nums text-ink outline-none focus:border-ink"
        onChange={e => {
          const n = Number(e.target.value)
          if (e.target.value === '' || n !== n) return
          onChange(n)
        }}
      />
    </label>
  )
}
