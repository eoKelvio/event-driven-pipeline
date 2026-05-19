import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Server } from 'socket.io'

type EachMessageHandler = (ctx: { topic: string; message: { value: Buffer | null } }) => Promise<void>

let capturedHandler: EachMessageHandler | undefined
let capturedCrashCallback: (() => void) | undefined

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    consumer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockImplementation((event: string, cb: () => void) => {
        if (event === 'consumer.crash') capturedCrashCallback = cb
      }),
      events: { CRASH: 'consumer.crash' },
      run: vi.fn().mockImplementation(({ eachMessage }: { eachMessage: EachMessageHandler }) => {
        capturedHandler = eachMessage
        return Promise.resolve()
      }),
    }),
  })),
}))

const mockEmit = vi.fn()
const mockIo = { emit: mockEmit } as unknown as Server

const { startKafkaBridge } = await import('../../src/lib/kafka-bridge.js')

beforeEach(() => {
  vi.clearAllMocks()
  capturedHandler = undefined
  capturedCrashCallback = undefined
})

describe('startKafkaBridge', () => {
  it('emite pipeline:event com topic e data quando recebe mensagem válida', async () => {
    await startKafkaBridge(mockIo)

    const payload = { cpf: '12345678901', name: 'João' }
    await capturedHandler!({
      topic: 'events.person.stored',
      message: { value: Buffer.from(JSON.stringify(payload)) },
    })

    expect(mockEmit).toHaveBeenCalledWith(
      'pipeline:event',
      expect.objectContaining({
        topic: 'events.person.stored',
        data: payload,
        timestamp: expect.any(String),
      }),
    )
  })

  it('ignora mensagem com value null', async () => {
    await startKafkaBridge(mockIo)

    await capturedHandler!({ topic: 'events.person.stored', message: { value: null } })

    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('chama process.exit(1) no evento CRASH', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any)

    await startKafkaBridge(mockIo)
    capturedCrashCallback!()

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })
})
