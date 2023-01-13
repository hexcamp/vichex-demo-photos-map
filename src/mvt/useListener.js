import Libp2p from 'libp2p'
import WebRTCStar from 'libp2p-webrtc-star'
import Secio from 'libp2p-secio'
import Mplex from 'libp2p-mplex'
import PeerInfo from 'peer-info'

export default function useListener (
  peerId,
  listeners,
  dispatchListenersAction
) {
  const peerIdStr = peerId.toB58String()
  const listener = listeners[peerIdStr]
  return [listener, create, log, dial]

  function create () {
    console.log('Jim request create', peerIdStr)
    dispatchListenersAction({ type: 'startListening', peerId })
    createListener(peerId, dispatchListenersAction, log)
  }

  function log (txt) {
    dispatchListenersAction({ type: 'log', peerId, payload: txt })
  }

  function dial (remotePeerId) {
    const remotePeerInfo = listener.peers[remotePeerId].peerInfo
    listener.libp2pNode.dial(remotePeerInfo)
  }
}

async function createListener (peerId, dispatchListenersAction, log) {
  const libp2pNode = await Libp2p.create({
    peerInfo: new PeerInfo(peerId),
    modules: {
      transport: [WebRTCStar],
      connEncryption: [Secio],
      streamMuxer: [Mplex]
    },
    config: {
      peerDiscovery: {
        autoDial: false
      }
    }
  })

  const webrtcAddr = '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star'
  libp2pNode.peerInfo.multiaddrs.add(webrtcAddr)

  libp2pNode.on('peer:discovery', peerInfo => {
    log(`Found peer ${peerInfo.id.toB58String()}`)
    dispatchListenersAction({ type: 'addPeer', peerId, peerInfo })
  })

  // Listen for new connections to peers
  libp2pNode.on('peer:connect', peerInfo => {
    log(`Connected to ${peerInfo.id.toB58String()}`)
    dispatchListenersAction({
      type: 'updatePeer',
      peerId,
      peerInfo,
      updatePeerFunc: peer => {
        peer.connected = true
      }
    })
  })

  // Listen for peers disconnecting
  libp2pNode.on('peer:disconnect', peerInfo => {
    log(`Disconnected from ${peerInfo.id.toB58String()}`)
    dispatchListenersAction({
      type: 'updatePeer',
      peerId,
      peerInfo,
      updatePeerFunc: peer => {
        peer.connected = false
      }
    })
  })

  await libp2pNode.start()
  dispatchListenersAction({ type: 'addLibp2pNode', peerId, libp2pNode })
  log('Created node')
}
