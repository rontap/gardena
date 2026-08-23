import { Peer, type DataConnection } from 'peerjs'
import { readMpMsg, type MpMsg, type MpWire } from '../sim/mp.ts'

export function openPeer(): Promise<Peer> {
  return new Promise((resolve, reject) => {
    // TODO 1.1 multiplayer TURN
    const peer = new Peer()
    peer.on('open', () => resolve(peer))
    peer.on('error', err => reject(err))
  })
}

export function wrapConn(conn: DataConnection): MpWire {
  let recv: ((msg: MpMsg) => void) | undefined
  let done = false
  const emit = (msg: MpMsg) => {
    if (done) return
    if (msg.a === 'bye') done = true
    if (recv !== undefined) recv(msg)
  }
  conn.on('data', data => {
    const msg = readMpMsg(data)
    if (msg === undefined) return
    emit(msg)
  })
  // The transport going away is 'lost' (worth retrying); only a real bye means the host meant it.
  conn.on('close', () => {
    emit({ a: 'bye', why: 'lost' })
  })
  conn.on('error', () => {
    emit({ a: 'bye', why: 'lost' })
  })
  return {
    send(msg) {
      conn.send(msg)
    },
    onRecv(fn) {
      recv = fn
    },
    close() {
      done = true
      conn.close()
    },
  }
}

export function listen(peer: Peer, onGuest: (wire: MpWire, conn: DataConnection) => void): void {
  peer.on('connection', conn => {
    conn.on('open', () => {
      onGuest(wrapConn(conn), conn)
    })
  })
}

export function dial(peer: Peer, hostId: string): Promise<MpWire> {
  return new Promise((resolve, reject) => {
    const conn = peer.connect(hostId)
    conn.on('open', () => resolve(wrapConn(conn)))
    conn.on('error', err => reject(err))
    peer.on('error', err => reject(err))
  })
}
