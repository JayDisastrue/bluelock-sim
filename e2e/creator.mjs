// Player creator: locked striker, rolled foot/weapon, mix-and-match parts, randomize, and that choices reach the save.
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--no-sandbox'] })
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
await page.addInitScript(() => localStorage.setItem('blel.settings', JSON.stringify({ textSpeed: 'instant', timerScale: 2 })))
await page.goto(`${BASE}/`)
await page.getByText('New Game', { exact: true }).click()
await page.getByTestId('name-input').fill('Creator Test')

// ── identity: striker is locked; foot is rolled and re-rollable ──
ok('position is locked to Striker (no picker)', /striker \(st\)/i.test(await page.getByTestId("position-locked").innerText()) && (await page.getByRole('radio', { name: 'CB' }).count()) === 0)
const feet = new Set([await page.getByTestId('foot-value').innerText()])
for (let i = 0; i < 40; i++) { await page.getByTestId('dice-Re-roll foot').click(); feet.add(await page.getByTestId('foot-value').innerText()) }
ok('strong foot is random and re-rollable', feet.size >= 2, [...feet].join(' / '))
await page.screenshot({ path: `${OUT}/50-wizard-identity.png` })
await page.getByTestId('next').click()

// ── appearance: big selection, mix and match, dice ──
const count = async (slot) => page.locator(`[data-testid^="part-${slot}-"]`).count()
const counts = { hair: await count('hair'), eyes: await count('eyes'), face: await count('face'), brow: await count('brow'), nose: await count('nose'), mark: await count('mark'), accessory: await count('accessory') }
ok('large selection of parts per slot', counts.hair >= 16 && counts.eyes >= 8 && counts.face >= 6 && counts.brow >= 6 && counts.nose >= 4 && counts.mark >= 7 && counts.accessory >= 5, JSON.stringify(counts))
await page.screenshot({ path: `${OUT}/51-wizard-appearance.png`, fullPage: true })
const preview = () => page.locator('[aria-label="Portrait preview"] svg').first().innerHTML()
const base = await preview()
await page.getByTestId('part-hair-bob').click()
await page.getByTestId('part-eyes-heavy_lid').click()
await page.getByTestId('part-face-square').click()
await page.getByTestId('part-accessory-glasses').click()
ok('mix-and-match: picked parts are selected', (await page.getByTestId('part-hair-bob').getAttribute('aria-checked')) === 'true' && (await page.getByTestId('part-eyes-heavy_lid').getAttribute('aria-checked')) === 'true')
ok('the preview changes when parts change', (await preview()) !== base)
const seen = new Set()
for (let i = 0; i < 8; i++) { await page.getByTestId('randomize-all').click(); seen.add(await preview()) }
ok('randomize everything produces different looks', seen.size >= 6, `${seen.size}/8 distinct`)
const h0 = await preview(); let changed = false
for (let i = 0; i < 12 && !changed; i++) { await page.getByTestId('dice-Random Hair').click(); changed = (await preview()) !== h0 }
ok('per-slot dice work', changed)
await page.screenshot({ path: `${OUT}/52-wizard-randomized.png` })
await page.getByTestId('part-hair-ponytail').click(); await page.getByTestId('part-face-sharp').click()
await page.getByTestId('next').click()

// ── origin, then rolled weapon ──
await page.getByTestId('origin-street_renegade').click()
await page.getByTestId('next').click()
const weapons = new Set([await page.getByTestId('weapon-value').innerText()])
const tiers = new Set([await page.getByTestId('rarity-badge').first().getAttribute('data-rarity')])
for (let i = 0; i < 60; i++) { await page.getByTestId('dice-Re-roll weapon').click(); weapons.add(await page.getByTestId('weapon-value').innerText()); tiers.add(await page.getByTestId('rarity-badge').first().getAttribute('data-rarity')) }
ok('starting weapon is random and re-rollable (never the non-seedable ones)', weapons.size >= 3 && ![...weapons].some((n) => /hunter press|sovereign strike/i.test(n)), [...weapons].join(' / '))
ok('rarity badge shown with a label, never mythic at start', tiers.has('common') && !tiers.has('mythic') && (await page.getByTestId('rarity-badge').first().innerText()).trim().length > 2, [...tiers].join(','))
const rolledWeapon = await page.getByTestId('weapon-value').innerText()
await page.screenshot({ path: `${OUT}/53-wizard-weapon.png` })
await page.getByTestId('next').click()
const confirmText = await page.locator('.wizard-grid').innerText()
await page.getByTestId('start').click()
for (let i = 0; i < 400 && (await page.getByTestId('cutscene').count()); i++) {
  await page.waitForTimeout(50)
  if (await page.locator('.ripple').isVisible().catch(() => false)) { await page.keyboard.press('Enter'); continue }
  const b = page.locator('.choice-btn:not([disabled])')
  if (await b.count()) { await b.first().click(); continue }
  await page.keyboard.press('Space')
}
const d = JSON.parse(await page.evaluate(() => localStorage.getItem('blel.autosave'))).data
ok('saved game: position is ST', d.player.position === 'ST')
ok('saved game: rolled weapon is the starting weapon', d.player.weaponSeed && Object.keys(d.weapons).includes(d.player.weaponSeed))
ok('confirm screen showed the rolled foot', new RegExp(d.player.handedness === 'both' ? 'two-footed' : `${d.player.handedness}-footed`).test(confirmText), `foot=${d.player.handedness}`)
ok('saved game: chosen look persisted (ponytail, sharp face)', d.player.portrait.hair === 'ponytail' && d.player.portrait.face === 'sharp')
await page.screenshot({ path: `${OUT}/54-hub-after.png` })
ok('hub shows position and foot', /ST · (left|right|two)-?/.test(await page.getByTestId('hub').innerText()) || /footed/.test(await page.getByTestId('hub').innerText()))
console.log('\nBROWSER ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none')
await browser.close()
