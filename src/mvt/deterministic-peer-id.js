import sodium from 'sodium-universal'
import PeerId from 'peer-id'
import libp2pCrypto from 'libp2p-crypto'
import { Buffer } from 'buffer'

// https://libsodium.gitbook.io/doc/key_derivation
// https://github.com/mafintosh/hyperdrive/blob/a4b3a82e84877b4ddcf38fffd1db342a861a863a/index.js#L904

export default async function getPeerIdFromH3HexAndSecret (h3Hex, secretHex) {
  const secret = Buffer.from(secretHex, 'hex')
  const subKey1 = new Buffer(sodium.crypto_sign_SEEDBYTES)
  const context = Buffer.from(h3Hex + 'f', 'hex') // Add half a byte to make 8
  const publicKey = new Buffer(sodium.crypto_sign_PUBLICKEYBYTES)
  const secretKey = new Buffer(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_kdf_derive_from_key(subKey1, 1, context, secret)
  sodium.crypto_sign_seed_keypair(publicKey, secretKey, subKey1)
  if (subKey1.fill) subKey1.fill(0)

  const privKey = libp2pCrypto.keys.marshalPrivateKey(
    new libp2pCrypto.keys.supportedKeys.ed25519.Ed25519PrivateKey(
      secretKey,
      publicKey
    ),
    'ed25519'
  )
  const peerId = await PeerId.createFromPrivKey(privKey)

  return peerId
}
