// Cross-device save test: generate a code in one browser profile, paste it into a completely separate one.
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--no-sandbox'] })
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
const settings = () => localStorage.setItem('blel.settings', JSON.stringify({ textSpeed: 'instant', timerScale: 2 }))

// device A
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const a = await ctxA.newPage()
await a.addInitScript(settings)
await a.goto(`${BASE}/`)
await a.getByText('New Game', { exact: true }).click()
await a.getByTestId('name-input').fill('Phone Kaito')
await a.getByTestId('next').click(); await a.getByTestId('next').click()
await a.getByTestId('origin-overlooked_playmaker').click()
await a.getByTestId('next').click(); await a.getByTestId('next').click()
await a.getByTestId('start').click()
for (let i = 0; i < 400 && (await a.getByTestId('cutscene').count()); i++) {
  await a.waitForTimeout(60)
  if (await a.locator('.ripple').isVisible().catch(() => false)) { await a.keyboard.press('Enter'); continue }
  const b = a.locator('.choice-btn:not([disabled])')
  if (await b.count()) { await b.first().click(); continue }
  await a.keyboard.press('Space')
}
await a.goto(`${BASE}/#/saves`)
await a.getByTestId('make-code').click()
const code = await a.getByTestId('code-out').inputValue()
const stateA = JSON.parse(await a.evaluate(() => localStorage.getItem('blel.autosave'))).data
ok('device A generates a save code', /^BLEL1\.[0-9a-f]{8}\./.test(code), `${code.length} characters`)

// device B: a separate browser profile with no saves at all
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const b = await ctxB.newPage()
await b.addInitScript(settings)
await b.goto(`${BASE}/#/saves`)
ok('device B starts with no save', (await b.evaluate(() => localStorage.getItem('blel.autosave'))) === null)
await b.getByTestId('code-in').fill(code.replace(/(.{70})/g, '$1\n')) // simulate a wrapped paste
await b.getByTestId('load-code').click()
await b.waitForTimeout(500)
ok('device B loads the game into the hub', await b.getByTestId('hub').isVisible())
const stateB = JSON.parse(await b.evaluate(() => localStorage.getItem('blel.autosave'))).data
ok('player, origin and week match', stateB.player.name === 'Phone Kaito' && stateB.player.origin === stateA.player.origin && stateB.meta.turn === stateA.meta.turn)
ok('relationships, flags, memory and scheduled events all carried over', JSON.stringify(stateB.relationships) === JSON.stringify(stateA.relationships) && JSON.stringify(stateB.flags) === JSON.stringify(stateA.flags) && stateB.memory.length === stateA.memory.length && stateB.scheduled.length === stateA.scheduled.length)
await b.screenshot({ path: `${OUT}/40-loaded-from-code.png` })

// tampered / truncated codes are rejected
await b.goto(`${BASE}/#/saves`)
await b.getByTestId('code-in').fill(code.slice(0, -30))
await b.getByTestId('load-code').click()
ok('truncated code is rejected with a clear error', /Could not load code: .*(Checksum|invalid|decompressed)/.test(await b.getByRole('status').innerText()), (await b.getByRole('status').innerText()).slice(0, 110))
await browser.close()
