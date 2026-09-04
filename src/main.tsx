import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorkerSink } from './game/sim/log.ts'
import { DebugContracts } from './game/ui/debug-contracts.tsx'
import { DebugIconset } from './game/ui/debug-iconset.tsx'
import { DebugWeather } from './game/ui/debug-weather.tsx'

const root = document.getElementById('root')!

function openScroll(): void {
  document.documentElement.style.overflow = 'auto'
  document.body.style.overflow = 'auto'
  root.style.overflow = 'auto'
  root.style.height = 'auto'
}

if (location.hash === '#debug-techtree') {
  openScroll()
  void import('./game/ui/debug-techtree.tsx').then(m =>
    createRoot(root).render(
      <StrictMode>
        <m.DebugTechTree />
      </StrictMode>,
    ),
  )
} else if (location.hash === '#debug-contracts') {
  openScroll()
  createRoot(root).render(
    <StrictMode>
      <DebugContracts />
    </StrictMode>,
  )
} else if (location.hash === '#debug-weather') {
  openScroll()
  createRoot(root).render(
    <StrictMode>
      <DebugWeather />
    </StrictMode>,
  )
} else if (location.hash === '#debug-iconset') {
  openScroll()
  createRoot(root).render(
    <StrictMode>
      <DebugIconset />
    </StrictMode>,
  )
} else {
  const sink = new WorkerSink(new Worker(new URL('./game/sim/log.worker.ts', import.meta.url), { type: 'module' }))
  if (import.meta.hot !== undefined) import.meta.hot.dispose(() => sink.terminate())
  createRoot(root).render(
    <StrictMode>
      <App sink={sink} />
    </StrictMode>,
  )
}
