import type { Cmd, WorkerIn } from './log.ts'

const cmds: Cmd[] = []

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  const msg = e.data
  if (msg.kind === 'cmd') {
    cmds.push(msg.cmd)
    return
  }
  if (msg.kind === 'reset') {
    cmds.length = 0
    return
  }
  self.postMessage(cmds.slice())
}
