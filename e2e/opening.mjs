// Browser e2e (Playwright). Needs the app served: `npm run build && npx vite preview --port 4173`.
// Env: BASE (default http://127.0.0.1:4173), PW_CHROMIUM (path to a chromium binary), OUT (screenshot dir).
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const ORIGIN = process.argv[2] || 'street_renegade'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errors = []
page.on('response', (r) => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
await page.addInitScript(() => localStorage.setItem('blel.settings', JSON.stringify({ textSpeed: 'instant', timerScale: 2 })))
await page.goto(`${BASE}/`)
await page.screenshot({ path: `${OUT}/01-menu.png` })

// ---- creation wizard ----
await page.getByText('New Game', { exact: true }).click()
await page.getByTestId('name-input').fill('Kaito')
await page.getByTestId('next').click()
await page.screenshot({ path: `${OUT}/02-appearance.png` })
await page.getByTestId('next').click()
await page.getByTestId(`origin-${ORIGIN}`).click()
await page.screenshot({ path: `${OUT}/03-origin.png` })
await page.getByTestId('next').click()
await page.getByTestId('next').click()
await page.getByTestId('start').click()

// ---- play the opening ----
const seen = new Set()
const shot = async (name) => { if (!seen.has(name)) { seen.add(name); await page.screenshot({ path: `${OUT}/${String(seen.size + 3).padStart(2, '0')}-${name}.png` }) } }
let steps = 0
const log = []
while (steps++ < 400) {
  await page.waitForTimeout(120)
  if ((await page.getByTestId('cutscene').count()) === 0 && (await page.getByTestId('hub').isVisible().catch(() => false))) break
  const ripple = page.locator('.ripple')
  if (await ripple.isVisible().catch(() => false)) {
    log.push('RIPPLE: ' + (await ripple.innerText()).replace(/\n+/g, ' | ').slice(0, 220))
    await shot('ripple'); await page.keyboard.press('Enter'); continue
  }
  if (await page.locator('.ring').isVisible().catch(() => false)) { log.push('TIMED CHOICE visible'); await shot('timed-choice') }
  const btns = page.locator('.choice-btn:not([disabled])')
  if (await btns.count()) {
    const all = await page.locator('.choice-btn').allInnerTexts()
    log.push('CHOICES: ' + all.map((t) => t.replace(/\n+/g, ' ')).join(' || ').slice(0, 400))
    await shot(`choice-${steps}`)
    // prefer the "Devour" option when present, else first
    const dev = page.locator('.choice-btn.tone-Devour:not([disabled])')
    if (await dev.count()) await dev.first().click(); else await btns.first().click()
    continue
  }
  for (const k of ['panels', 'cutin', 'impact']) if (await page.getByTestId(k).isVisible().catch(() => false)) await shot(k)
  if (await page.locator('.dialogue.mono').isVisible().catch(() => false)) await shot('monologue')
  if (await page.locator('.actor').count()) await shot('dialogue-' + (await page.locator('.actor').first().getAttribute('data-who')))
  if (await page.locator('.vision').count()) await shot('vision')
  await page.keyboard.press('Space')
}
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/90-hub.png` })
console.log(log.join('\n'))
console.log('reached hub:', await page.getByTestId('hub').isVisible())
console.log('steps:', steps)
const state = JSON.parse(await page.evaluate(() => localStorage.getItem('blel.autosave')))
const d = state.data
console.log('autosave version', state.version, 'origin', d.player.origin, 'scheduled', JSON.stringify(d.scheduled))
console.log('relationships', JSON.stringify(Object.fromEntries(Object.entries(d.relationships).map(([k, v]) => [k, `${v.status} t${v.trust} r${v.respect} f${v.fear} v${v.rivalry}`]))))
console.log('flags', Object.keys(d.flags).join(','))
console.log('ripples', d.ripples.length, 'memory', d.memory.map((m) => m.text).join(' / '))
console.log('ERRORS', errors.length ? errors.join('\n') : 'none')
await browser.close()
