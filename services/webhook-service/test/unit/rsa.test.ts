import { describe, it, expect, afterAll } from 'vitest'
import { generateKeyPairSync, publicEncrypt, constants } from 'node:crypto'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Gera um par de chaves RSA real para o teste
const { privateKey: privKey, publicKey: pubKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicKeyPem = pubKey.export({ type: 'spki', format: 'pem' }) as string

// Escreve a chave privada num arquivo temporário e aponta o config pra ele
const tmpDir = mkdtempSync(join(tmpdir(), 'rsa-test-'))
const keyPath = join(tmpDir, 'private.pem')
writeFileSync(keyPath, privKey.export({ type: 'pkcs8', format: 'pem' }) as string)
process.env.PRIVATE_KEY_PATH = keyPath

// Importa decrypt DEPOIS de configurar a env var
const { decrypt } = await import('../../src/crypto/rsa.js')

afterAll(() => rmSync(tmpDir, { recursive: true }))

function encrypt(text: string): string {
  return publicEncrypt(
    { key: publicKeyPem, padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(text),
  ).toString('base64')
}

describe('decrypt', () => {
  it('decripta um payload criptografado com RSA-OAEP', () => {
    const original = JSON.stringify({ person_id: 1, name: 'Test' })
    expect(decrypt(encrypt(original))).toBe(original)
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
