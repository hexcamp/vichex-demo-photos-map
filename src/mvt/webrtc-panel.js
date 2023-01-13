import React from 'react'
import useListener from './useListener'

export default function WebRTCPanel ({
  peerId,
  listeners,
  dispatchListenersAction
}) {
  const [listener, create, log, dial] = useListener(
    peerId,
    listeners,
    dispatchListenersAction
  )

  if (!listener) {
    return (
      <div>
        Not listening
        <button onClick={create}>Listen</button>
      </div>
    )
  }

  const { peers, logs } = listener
  return (
    <div>
      <h3>Peers</h3>
      <ul>
        {Object.keys(peers).map(remotePeerId => {
          const peer = peers[remotePeerId]
          return (
            <li key={remotePeerId}>
              {remotePeerId.slice(-3)}{' '}
              {peer.connected ? 'Connected' : 'Disconnected'}
              {!peer.connected && <button onClick={connect}>Connect</button>}
            </li>
          )
          function connect () {
            log(`Dialing ${remotePeerId}`)
            dial(remotePeerId)
            log(`Dialed ${remotePeerId}`)
          }
        })}
      </ul>
      <h3>Logs</h3>
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
}
