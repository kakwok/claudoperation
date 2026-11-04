import { expect, test } from 'claude-code/testing'
import { validateRecord, applyApproval, parseRecord } from '../hooks/record.js'

const RECORD = `---
claudoperation: 0.1
session: 2026-11-04-demo
member: ana
product: proposal/main.tex
product_type: endorsed
span: 2026-11-04
approval: pending
---

**Summary.** Ana chose the detector layout and fixed a wrong trigger rate.

## What ana did — key
- [ ] H1 · 🔀 Choice · Picked layout B over A. *Why key: sets the geometry.*
- [ ] H2 · 🛠️ Correction · The trigger rate is 100 kHz, not 1 MHz. → corrects: AI assumed 1 MHz. *Why key: changes the budget.*

<details><summary>Also (1 more)</summary>

- [ ] H3 · 📚 Knowledge · The 2024 test beam used 120 GeV pions.
</details>

## AI decisions
- [ ] All AI claims below are recorded accurately

Tick to endorse:
- [ ] A1 · Use a two-column table for the budget
- [ ] A2 · Section order follows the call text — never discussed

<details><summary>Links and evidence</summary>

- H2 → main.tex §Budget
</details>
`

const PATH = 'sessions/ana/2026-11-04-demo.md'

const PANE = {
  plugin: 'claudoperation',
  component: 'Pane',
  requestId: 'clop-approve',
  viewport: { columns: 120, rows: 40 },
  props: {
    title: 'Approve record',
    isFocused: true,
    bodyColumns: 100,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

// A tiny file system with one pending record, and a log of what the mod wrote
function stubFiles(on, written: Map<string, string>) {
  on('fs.exists', ($, e) => ({ value: e.path.endsWith('sessions') || e.path.endsWith(PATH) }))
  on('fs.list', ($, e) => ({
    value: e.path.endsWith('sessions/ana')
      ? [{ name: '2026-11-04-demo.md', kind: 'file', size: RECORD.length, isLink: false }]
      : [{ name: 'ana', kind: 'dir', size: 0, isLink: false }],
  }))
  on('fs.read', ($, e) => ({ value: written.get(PATH) ?? RECORD }))
  on('fs.write', ($, e) => {
    written.set(PATH, e.text)
    return { value: undefined }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
}

test('the parser reads claims, key marks, relations and AI notes', async () => {
  const r = parseRecord(RECORD)
  expect(r.human.map((c) => c.id)).toEqual(['H1', 'H2', 'H3'])
  expect(r.human.map((c) => c.isKey)).toEqual([true, true, false])
  expect(r.human[1].relations).toEqual([{ kind: 'corrects', value: 'AI assumed 1 MHz' }])
  expect(r.ai[1].note).toBe('never discussed')
  expect(validateRecord(RECORD).errors).toEqual([])
})

test('the validator catches a Correction without evidence and a fourth key claim', async () => {
  const bad = RECORD
    .replace(' → corrects: AI assumed 1 MHz.', '')
    .replace('- [ ] H2 ·', '- [ ] H4 · 🔀 Choice · Extra. *Why key: x.*\n- [ ] H5 · 🔀 Choice · Extra. *Why key: x.*\n- [ ] H2 ·')
  const { errors } = validateRecord(bad)
  expect(errors).toContain('H2: Correction needs a "corrects:" relation')
  expect(errors).toContain('key: 4 key claims, at most 3')
})

test('applyApproval adds the author note inside the links block', async () => {
  const out = applyApproval(RECORD, { human: { H1: { checked: true } }, notes: ['H1 checked by hand'], approval: 'individual' })
  expect(out).toContain('- [x] H1 · 🔀 Choice')
  expect(out).toContain('- H2 → main.tex §Budget\n- author: H1 checked by hand\n</details>')
  expect(out).toContain('approval: individual')
})

test('the pane approves, relabels with evidence, endorses, and saves', async ($, on) => {
  const written = new Map<string, string>()
  stubFiles(on, written)

  // No argument: the command finds the newest pending record itself
  expect(await $.command.run({ command: 'clop:approve', args: '' })).toEqual({})
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  await ui.press({ key: 'h-H1' })
  await ui.press({ key: 'h-H2' })
  // Relabel H3 as Verification: the pane asks for what was checked
  await ui.select({ key: 'l-H3', value: 'Verification' })
  expect(await ui.find({ key: 'ev-H3' })).toBeDefined()

  // Saving without the evidence is refused
  await ui.press({ key: 'save' })
  expect(await ui.find({ type: 'Text', text: /Add evidence first: H3/ })).toBeDefined()
  expect(written.size).toBe(0)

  await ui.input({ key: 'ev-H3', text: 'compared with the 2024 run log' })
  await ui.press({ key: 'acc' })
  await ui.press({ key: 'a-A1' })
  await ui.press({ key: 'save' })

  const out = written.get(PATH)
  expect(out).toContain('- [x] H1 · 🔀 Choice')
  expect(out).toContain('- [x] H2 · 🛠️ Correction')
  expect(out).toContain('- [ ] H3 · ✅ Verification · The 2024 test beam used 120 GeV pions. → checked: compared with the 2024 run log')
  expect(out).toContain('- [x] All AI claims below are recorded accurately')
  expect(out).toContain('- [x] A1 · Use a two-column table')
  expect(out).toContain('- [ ] A2 · Section order')
  expect(out).toContain('approval: individual')
  expect(out).toContain('- author: H3 relabeled Knowledge → Verification')
  expect(validateRecord(out).errors).toEqual([])
})

test('approve all needs a second press and never endorses AI decisions', async ($, on) => {
  const written = new Map<string, string>()
  stubFiles(on, written)
  await $.command.run({ command: 'clop:approve', args: PATH })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'all' })
  expect(await ui.find({ key: 'all' })).toMatchObject({ props: { label: 'Confirm: approve all claims' } })
  await ui.press({ key: 'all' })
  await ui.press({ key: 'save' })

  const out = written.get(PATH)
  expect(out).toContain('approval: bulk')
  expect(out).toContain('- [x] H3 · 📚 Knowledge')
  expect(out).toContain('- [x] All AI claims below are recorded accurately')
  expect(out).toContain('- [ ] A1 · Use a two-column table')
})
