// Writes docs/IDS.md: every id in the project.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { content } from '../src/content'
import { buildIdList, buildRosterDoc } from '../src/engine/idlist'

mkdirSync('docs', { recursive: true })
const manifest = existsSync('public/assets/manifest.json') ? JSON.parse(readFileSync('public/assets/manifest.json', 'utf8')) : {}
writeFileSync('docs/IDS.md', buildIdList(content, manifest.playerParts ?? {}))
writeFileSync('docs/ROSTER.md', buildRosterDoc(content))
console.log('wrote docs/IDS.md and docs/ROSTER.md')
