import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { content } from '../content'
import { buildIdList } from './idlist'

describe('docs/IDS.md', () => {
  it('lists every id and is up to date (run `npm run ids` if this fails)', () => {
    const doc = readFileSync('docs/IDS.md', 'utf8')
    expect(doc).toBe(buildIdList(content))
    for (const id of Object.keys(content.characters)) expect(doc).toContain(`\`${id}\``)
    for (const id of Object.keys(content.scripts)) expect(doc).toContain(`\`${id}\``)
    expect(doc).toContain('`changePosition`')
    expect(doc).toContain('`heavy_lid`')
  })
})
