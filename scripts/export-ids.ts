// Writes docs/IDS.md: every id in the project.
import { mkdirSync, writeFileSync } from 'node:fs'
import { content } from '../src/content'
import { buildIdList } from '../src/engine/idlist'

mkdirSync('docs', { recursive: true })
writeFileSync('docs/IDS.md', buildIdList(content))
console.log('wrote docs/IDS.md')
