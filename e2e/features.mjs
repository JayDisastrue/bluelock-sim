// Browser e2e (Playwright). Needs the app served: `npm run build && npx vite preview --port 4173`.
// Env: BASE (default http://127.0.0.1:4173), PW_CHROMIUM (path to a chromium binary), OUT (screenshot dir).
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
await page.addInitScript(() => { if (!localStorage.getItem('blel.settings')) localStorage.setItem('blel.settings', JSON.stringify({ textSpeed: 'instant', timerScale: 1 })) })
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
const save = async () => JSON.parse(await page.evaluate(() => localStorage.getItem('blel.autosave'))).data

// run a scene to completion; `prefer` = ordered choice ids to click when offered
async function drive(prefer = [], { stopAtTimed = false } = {}) {
  for (let i = 0; i < 500; i++) {
    await page.waitForTimeout(80)
    if ((await page.getByTestId('cutscene').count()) === 0) return 'done'
    if (await page.locator('.ripple').isVisible().catch(() => false)) { await page.keyboard.press('Enter'); continue }
    const btns = page.locator('.choice-btn:not([disabled])')
    if (await btns.count()) {
      if (stopAtTimed && (await page.locator('.ring').count())) return 'timed'
      let clicked = false
      for (const id of prefer) { const b = page.getByTestId(`choice-${id}`); if (await b.count() && await b.isEnabled()) { await b.click(); clicked = true; break } }
      if (!clicked) await btns.first().click()
      continue
    }
    await page.keyboard.press('Space')
  }
  return 'timeout'
}
async function newGame(origin, name = 'Tester') {
  await page.goto(`${BASE}/`)
  await page.getByText('New Game', { exact: true }).click()
  await page.getByTestId('name-input').fill(name)
  await page.getByTestId('next').click(); await page.getByTestId('next').click()
  await page.getByTestId(`origin-${origin}`).click()
  await page.getByTestId('next').click(); await page.getByTestId('next').click()
  await page.getByTestId('start').click()
}

// ───────── 1. progression + delayed consequences (fallen ace, Support Sora) ─────────
await newGame('fallen_ace', 'Kaito')
const r1 = await drive(['fear', 'support'])
ok('opening finishes (fallen_ace)', r1 === 'done')
let s = await save()
ok('Ego answer recorded (ADMITTED_FEAR)', s.flags.ADMITTED_FEAR === true)
ok('Sora supported → COMBO_ELIGIBLE:sora', s.flags['COMBO_ELIGIBLE:sora'] === true)
ok('delayed evt.sora.reunion scheduled', s.scheduled.some((x) => x.eventId === 'evt.sora.reunion'), JSON.stringify(s.scheduled.map((x) => `${x.eventId}@${x.due}`)))
const due = s.scheduled.find((x) => x.eventId === 'evt.sora.reunion').due
await page.screenshot({ path: `${OUT}/20-hub-after-opening.png` })
let playedEvent = false
for (let w = 0; w < due + 1; w++) {
  await page.getByTestId('advance').click()
  await page.waitForTimeout(400)
  if (await page.getByTestId('cutscene').count()) { playedEvent = true; await page.screenshot({ path: `${OUT}/21-delayed-event.png` }); break }
}
ok('delayed event plays on its due week', playedEvent)
if (playedEvent) {
  ok('event scene is Sora’s reunion', (await page.locator('.stage-title').innerText()).toLowerCase().includes('sora'))
  await drive(['support'])
  s = await save()
  ok('event choice changed state (SORA_ENGINE)', s.flags.SORA_ENGINE === true)
  ok('event consumed (not scheduled any more)', !s.scheduled.some((x) => x.eventId === 'evt.sora.reunion'))
  ok('event recorded as fired', s.firedEvents['evt.sora.reunion'] !== undefined)
}

// ───────── 2. save / load across reload ─────────
await page.goto(`${BASE}/#/saves`)
await page.getByTestId('slot-1').getByText('Save', { exact: true }).click()
const before = await save()
await page.reload()
await page.goto(`${BASE}/#/`)
await page.getByText('Continue (autosave)').click()
await page.waitForTimeout(300)
ok('Continue (autosave) returns to hub', await page.getByTestId('hub').isVisible())
await page.goto(`${BASE}/#/saves`); await page.waitForTimeout(200)
const slotText = await page.getByTestId('slot-1').innerText()
ok('slot 1 shows the saved game', /Kaito/.test(slotText) && /week/.test(slotText), slotText.replace(/\n+/g, ' | '))
await page.screenshot({ path: `${OUT}/22-saves.png` })

// export → import
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Export current game (JSON)').click()])
const file = `${OUT}/export.json`
await dl.saveAs(file)
ok('export downloads a JSON file', (await dl.suggestedFilename()).endsWith('.json'), await dl.suggestedFilename())
await page.getByTestId('import-input').setInputFiles(file)
await page.waitForTimeout(400)
ok('import loads the save and returns to hub', await page.getByTestId('hub').isVisible())
const after = await save()
ok('import round-trips the state', JSON.stringify(after.relationships) === JSON.stringify(before.relationships) && after.meta.turn === before.meta.turn)
await page.goto(`${BASE}/#/saves`)
await page.getByTestId('import-input').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"bluelock-egoist-life","version":1,"data":{"player":{"origin":"nope"}}}') })
await page.waitForTimeout(300)
ok('invalid import is rejected with a readable error', /Import failed/.test(await page.getByRole('status').innerText()), (await page.getByRole('status').innerText()).slice(0, 120))

// ───────── 3. relationship map, ripple log, gallery, flag inspector, cutscene test page ─────────
await page.goto(`${BASE}/#/relationships`); await page.waitForTimeout(300)
await page.getByRole('button', { name: /Sora/ }).click()
await page.screenshot({ path: `${OUT}/23-relationships.png` })
ok('relationship map lists Sora with a status', /Sora: (Ally|Stranger|Rival|Devoted)/.test(await page.locator('svg[aria-label="Relationship graph"]').innerHTML().then((h) => h.match(/aria-label="Sora[^"]*"/)?.[0] ?? '')))
await page.goto(`${BASE}/#/ripples`); await page.waitForTimeout(300)
ok('ripple log lists ripples', (await page.locator('.ripple').count()) >= 2, `${await page.locator('.ripple').count()} cards`)
await page.screenshot({ path: `${OUT}/24-ripple-log.png` })
await page.goto(`${BASE}/#/gallery`); await page.waitForTimeout(300)
const unlockedText = await page.locator('p').first().innerText()
ok('gallery unlocked scenes as they were seen', /[1-9]\d* \/ \d+ scenes unlocked/.test(unlockedText), unlockedText)
const turnBefore = (await save()).meta.turn
await page.getByText('▶ Replay').first().click()
await page.waitForTimeout(500)
ok('replay runs as a preview scene', (await page.getByTestId('cutscene').count()) === 1)
await page.screenshot({ path: `${OUT}/25-replay.png` })
await page.keyboard.press('Escape')
ok('replay did not change the save', (await save()).meta.turn === turnBefore)

await page.goto(`${BASE}/#/dev/cutscenes`); await page.waitForTimeout(200)
await page.getByTestId('script-id').fill('opening.cold.late_starter')
await page.getByTestId('origin-select').selectOption('late_starter')
await page.getByTestId('play-preview').click()
const rt = await drive()
ok('test page plays any script by id', rt === 'done')
ok('test page shows the resulting delta', await page.getByTestId('result').isVisible())
await page.goto(`${BASE}/#/dev/flags`); await page.waitForTimeout(300)
await page.getByRole('checkbox', { name: 'Toggle SORA_ENGINE' }).scrollIntoViewIfNeeded()
await page.getByText('COMBO_ELIGIBLE:sora').first().click()
ok('flag inspector shows what reads/sets a flag', /Read by:[\s\S]*evt\.sora\.reunion/.test(await page.locator('body').innerText()))
await page.screenshot({ path: `${OUT}/26-flags.png` })

// ───────── 4. sandbox ─────────
await page.goto(`${BASE}/#/hub`); await page.waitForTimeout(300)
const flagBefore = (await save()).meta.sandboxUsed
await page.keyboard.press('`')
ok('~ opens the sandbox panel', await page.getByTestId('sandbox').isVisible())
const f0 = Number(await page.getByTestId('skill-finishing').innerText())
ok('opening sandbox alone does not flag the run', flagBefore === false && (await save()).meta.sandboxUsed === false)
await page.getByRole('button', { name: 'finishing +5' }).click()
ok('free points: +5 finishing, no unlock required', Number(await page.getByTestId('skill-finishing').innerText()) === f0 + 5)
ok('using the sandbox flips SANDBOX_USED', (await save()).meta.sandboxUsed === true && (await save()).flags.SANDBOX_USED === true)
await page.getByRole('button', { name: 'Relationships' }).click()
await page.getByTestId('rel-npc').selectOption('bachira')
await page.getByTestId('rel-status').selectOption('Devoured')
s = await save()
ok('relationship editor sets status (Devoured, pinned)', s.relationships.bachira?.status === 'Devoured' && s.relationships.bachira.pinned)
await page.getByTestId('rel-npc').selectOption('sora')
await page.getByTestId('rel-status').selectOption('Eliminated')
s = await save()
ok('relationship editor can eliminate an NPC', s.eliminated.includes('sora'))
await page.getByRole('button', { name: 'Flags' }).click()
await page.getByRole('checkbox', { name: 'Toggle SORA_ENGINE' }).uncheck()
ok('flag inspector toggles a flag', (await save()).flags.SORA_ENGINE === undefined)
await page.getByRole('button', { name: 'Scenes & Arcs' }).click()
await page.screenshot({ path: `${OUT}/27-sandbox.png` })
await page.getByTestId('sandbox-advance').click()
ok('sandbox can advance the calendar', (await save()).meta.turn > before.meta.turn)
await page.keyboard.press('`')
ok('~ closes the sandbox', (await page.getByTestId('sandbox').count()) === 0)
await page.goto(`${BASE}/#/saves`); await page.waitForTimeout(200)
ok('save slot is marked SANDBOX_USED', /SANDBOX_USED/.test(await page.getByTestId('slot-auto').innerText()))

// ───────── 5. timed-choice timeout has consequences ─────────
await page.evaluate(() => localStorage.setItem('blel.settings', JSON.stringify({ textSpeed: 'instant', timerScale: 1 })))
await newGame('overlooked_playmaker', 'Slow')
const stop = await drive([], { stopAtTimed: true })
ok('reached the timed Ego question', stop === 'timed')
const composure0 = (await save()).life.composure
await page.waitForTimeout(6600)
s = await save()
ok('timing out took the default choice with consequences', s.flags.FROZE_AT_ENTRY === true && s.flags.SILENT_AT_ENTRY === true, `composure ${composure0} → ${s.life.composure}`)
await page.screenshot({ path: `${OUT}/28-after-timeout.png` })

console.log('\nBROWSER ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none')
await browser.close()
