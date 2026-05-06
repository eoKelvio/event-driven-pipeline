import { privateDecrypt, constants } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { config } from '../config.js'

let privateKey: string

function getPrivateKey(): string {
  if (!privateKey) {
    privateKey = readFileSync(config.privateKeyPath, 'utf8')
  }
  return privateKey
}

export function decrypt(encryptedBase64: string): string {
  const buffer = Buffer.from(encryptedBase64, 'base64')
  const decrypted = privateDecrypt(
    { key: getPrivateKey(), padding: constants.RSA_PKCS1_OAEP_PADDING },
    buffer,
  )
  return decrypted.toString('utf8')
}
