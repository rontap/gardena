import { m } from '../../paraglide/messages.js'
import { useState } from 'react'
import { WEATHER_NAME } from '../defs/weather.ts'
import { forecastWeather } from '../sim/weather.ts'
import { UI_WEATHER } from '../view/svgs.ts'
import { Btn, Chrome } from './frame.tsx'

export function DebugWeather() {
  const [seed, setSeed] = useState(1)
  const table = forecastWeather(seed, 50)
  return (
    <div className="h-full overflow-y-auto scroll-pane bg-ink p-4">
      <div className="relative mx-auto w-[72rem]">
        <Chrome className="relative px-4 py-3">
          <div className="relative z-20 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="font-display text-lg">{m.hud_debug_weather()}</div>
              <span className="text-sm text-ink/45">{m.hud_debug_seed({ n: seed })}</span>
              <Btn onClick={() => setSeed(s => s + 1)}>{m.hud_debug_random()}</Btn>
            </div>
            <div className="flex flex-col gap-1">
              {table.map((kind, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 text-sm tabular-nums text-ink/45">{i + 1}</span>
                  <span className="text-base font-semibold">{WEATHER_NAME[kind]()}</span>
                  <svg
                    viewBox="0 0 16 16"
                    className="h-5 w-5 shrink-0"
                    dangerouslySetInnerHTML={{ __html: UI_WEATHER[kind] }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Chrome>
      </div>
    </div>
  )
}
