import type { GameState } from './schemas'
import { makeSave, parseSave, type SaveFile } from './save'

/**
 * Copy-paste save codes: `BLEL1.<crc32>.<base64url(gzip(save json))>`.
 * Works across devices/browsers (the localStorage saves don't). The checksum catches truncated or edited pastes.
 */
export const CODE_PREFIX = 'BLEL1'
const MAX_JSON_BYTES = 5_000_000 // refuse decompression bombs

let crcTable: Uint32Array | undefined
export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit = Infinity): Promise<Uint8Array> {
  const writer = stream.writable.getWriter()
  void writer.write(bytes as BufferSource).catch(() => {})
  void writer.close().catch(() => {})
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > limit) {
      void reader.cancel()
      throw new Error('Save code is too large.')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) { out.set(c, off); off += c.length }
  return out
}

export async function encodeSaveCode(state: GameState, label = 'Shared'): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(makeSave(state, label)))
  const gz = await pipe(json, new CompressionStream('gzip'))
  return `${CODE_PREFIX}.${crc32(gz).toString(16).padStart(8, '0')}.${toBase64Url(gz)}`
}

export async function decodeSaveCode(raw: string): Promise<{ ok: true; save: SaveFile } | { ok: false; error: string }> {
  const code = raw.replace(/\s+/g, '') // pasted codes often get wrapped
  const [prefix, crc, payload, ...extra] = code.split('.')
  if (prefix !== CODE_PREFIX || !crc || !payload || extra.length) return { ok: false, error: 'That is not a Blue Lock: Egoist Life save code.' }
  let gz: Uint8Array
  try {
    gz = fromBase64Url(payload)
  } catch {
    return { ok: false, error: 'The save code has invalid characters. Did the paste get cut off?' }
  }
  if (crc32(gz).toString(16).padStart(8, '0') !== crc.toLowerCase()) return { ok: false, error: 'Checksum mismatch: the code is incomplete or was edited. Copy it again in full.' }
  let json: string
  try {
    json = new TextDecoder().decode(await pipe(gz, new DecompressionStream('gzip'), MAX_JSON_BYTES))
  } catch (e) {
    return { ok: false, error: (e as Error).message === 'Save code is too large.' ? 'Save code is too large.' : 'The save code could not be decompressed.' }
  }
  return parseSave(json)
}
