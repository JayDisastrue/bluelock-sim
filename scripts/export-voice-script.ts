// Writes docs/voice-script.csv + docs/voice-script.json: every voiceable line with its file slot.
import { mkdirSync, writeFileSync } from 'node:fs'
import { content } from '../src/content'
import { voiceFile } from '../src/engine/voice'
import { ORIGIN_IDS } from '../src/engine/schemas'

interface Row { file: string; id: string; speaker: string; origin: string; text: string }
const rows: Row[] = []
const clean = (t: string) => t.replace(/\*/g, '')
for (const s of Object.values(content.scripts)) {
  s.beats.forEach((b, i) => {
    if (b.t !== 'line' || b.mono) return
    const id = `${s.id}:${i}`
    const speaker = b.who === 'player' ? 'PLAYER' : (content.characters[b.who]?.name ?? b.who)
    rows.push({ file: voiceFile(id), id, speaker, origin: '', text: clean(b.text) })
    for (const o of ORIGIN_IDS) {
      const v = b.variants?.[o]
      if (v) rows.push({ file: voiceFile(id, o), id, speaker, origin: o, text: clean(v) })
    }
  })
}
mkdirSync('docs', { recursive: true })
const q = (v: string) => `"${v.replace(/"/g, '""')}"`
writeFileSync('docs/voice-script.csv', ['file,id,speaker,origin,text', ...rows.map((r) => [r.file, r.id, r.speaker, r.origin, r.text].map(q).join(','))].join('\n') + '\n')
writeFileSync('docs/voice-script.json', JSON.stringify(rows, null, 2) + '\n')
const bySpeaker = rows.reduce<Record<string, number>>((m, r) => ((m[r.speaker] = (m[r.speaker] ?? 0) + 1), m), {})
console.log(`${rows.length} voiceable lines →`, bySpeaker)
console.log('Drop audio at public/assets/voice/<file>  (see src/engine/voice.ts)')
