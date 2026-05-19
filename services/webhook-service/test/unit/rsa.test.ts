import { describe, it, expect, afterAll } from 'vitest'
import { generateKeyPairSync, publicEncrypt, constants } from 'node:crypto'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { privateKey: privKey, publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicKeyPem = pubKey.export({ type: 'spki', format: 'pem' }) as string

const tmpDir = mkdtempSync(join(tmpdir(), 'rsa-test-'))
const keyPath = join(tmpDir, 'private.pem')
const pubKeyPath = join(tmpDir, 'public.pem')
writeFileSync(keyPath, privKey.export({ type: 'pkcs8', format: 'pem' }) as string)
writeFileSync(pubKeyPath, pubKey.export({ type: 'spki', format: 'pem' }) as string)
process.env.PRIVATE_KEY_PATH = keyPath
process.env.PUBLIC_KEY_PATH = pubKeyPath

const { decrypt, encrypt } = await import('../../src/crypto/rsa.js')

afterAll(() => rmSync(tmpDir, { recursive: true }))

function encryptWithKey(text: string): string {
  return publicEncrypt(
    { key: publicKeyPem, padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(text),
  ).toString('base64')
}

describe('encrypt', () => {
  it('retorna uma string base64', () => {
    const result = encrypt('hello world')
    expect(typeof result).toBe('string')
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it('pode ser decriptado com a chave privada correspondente', () => {
    const original = JSON.stringify({ person_id: 1, name: 'Test' })
    expect(decrypt(encrypt(original))).toBe(original)
  })
})

describe('decrypt', () => {
  it('decripta um payload criptografado com RSA-OAEP', () => {
    const original = JSON.stringify({ person_id: 1, name: 'Test' })
    expect(decrypt(encryptWithKey(original))).toBe(original)
  })

  it('lança erro quando o dado não é base64 válido', () => {
    expect(() => decrypt('!@#$%^&*')).toThrow()
  })

  it('lança erro quando o dado foi criptografado com uma chave diferente', () => {
    const { publicKey: wrongPub } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const wrongPubPem = wrongPub.export({ type: 'spki', format: 'pem' }) as string

    const encrypted = publicEncrypt(
      { key: wrongPubPem, padding: constants.RSA_PKCS1_OAEP_PADDING },
      Buffer.from('test'),
    ).toString('base64')

    expect(() => decrypt(encrypted)).toThrow()
  })
})
