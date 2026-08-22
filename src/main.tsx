import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorkerSink } from './game/sim/log.ts'

const sink = new WorkerSink(new Worker(new URL('./game/sim/log.worker.ts', import.meta.url), { type: 'module' }))
if (import.meta.hot !== undefined) import.meta.hot.dispose(() => sink.terminate())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sink={sink} />
  </StrictMode>,
)
