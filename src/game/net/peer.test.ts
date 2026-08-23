import { describe, expect, test } from 'vitest'
import type { DataConnection } from 'peerjs'
import { wrapConn } from './peer.ts'
import type { MpMsg } from '../sim/mp.ts'

function fakeConn() {
  const handlers = new Map<string, ((arg?: unknown) => void)[]>()
  return {
    on(ev: string, fn: (arg?: unknown) => void) {
      const list = handlers.get(ev)
      if (list === undefined) handlers.set(ev, [fn])
      else list.push(fn)
    },
    send(_msg: MpMsg) {},
    close() {
      handlers.get('close')?.forEach(fn => fn())
    },
    emit(ev: string, arg?: unknown) {
      handlers.get(ev)?.forEach(fn => fn(arg))
    },
  }
}

describe('wrapConn', () => {
  test('one onRecv. Unknown a is dropped. close/error is bye lost. Local close is not.', () => {
    const conn = fakeConn()
    const wire = wrapConn(conn as unknown as DataConnection)
    const got: MpMsg[] = []
    wire.onRecv(msg => {
      got.push(msg)
    })
    wire.onRecv(msg => {
      got.push(msg)
    })
    conn.emit('data', { a: 'pause', on: true })
    expect(got).toEqual([{ a: 'pause', on: true }])
    conn.emit('data', { a: 'nope' })
    expect(got).toHaveLength(1)
    conn.emit('close')
    expect(got).toEqual([
      { a: 'pause', on: true },
      { a: 'bye', why: 'lost' },
    ])
    conn.emit('error')
    expect(got).toHaveLength(2)
    const conn2 = fakeConn()
    const wire2 = wrapConn(conn2 as unknown as DataConnection)
    const got2: MpMsg[] = []
    wire2.onRecv(msg => {
      got2.push(msg)
    })
    wire2.close()
    expect(got2).toEqual([])
  })
})
