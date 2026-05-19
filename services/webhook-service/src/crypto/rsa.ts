import { privateDecrypt, publicEncrypt, constants } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { config } from '../config.js'

let privateKey: string
let publicKey: string

function getPrivateKey(): string {
  if (!privateKey) privateKey = readFileSync(config.privateKeyPath, 'utf8')
  return privateKey
}

function getPublicKey(): string {
  if (!publicKey) publicKey = readFileSync(config.publicKeyPath, 'utf8')
  return publicKey
}

export function decrypt(encryptedBase64: string): string {
  const buffer = Buffer.from(encryptedBase64, 'base64')
  const decrypted = privateDecrypt(
    { key: getPrivateKey(), padding: constants.RSA_PKCS1_OAEP_PADDING },
    buffer,
  )
  return decrypted.toString('utf8')
}

export function encrypt(plaintext: string): string {
  const encrypted = publicEncrypt(
    { key: getPublicKey(), padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(plaintext, 'utf8'),
  )
  return encrypted.toString('base64')
}
