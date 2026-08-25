import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorkerSink } from './game/sim/log.ts'
import { DebugContracts } from './game/ui/debug-contracts.tsx'

const root = document.getElementById('root')!

if (location.hash === '#debug-contracts') {
  document.documentElement.style.overflow = 'auto'
  document.body.style.overflow = 'auto'
  root.style.overflow = 'auto'
  root.style.height = 'auto'
  createRoot(root).render(
    <StrictMode>
      <DebugContracts />
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
