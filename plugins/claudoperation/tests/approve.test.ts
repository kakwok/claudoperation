import { expect, test } from 'claude-code/testing'
import { validateRecord, applyApproval, parseRecord } from '../hooks/record.js'
import { transcriptStats, formatVolume, IDLE_MINUTES } from '../hooks/transcript.js'

const RECORD = `# Ana: Detector layout

Ana chose the detector layout and fixed a wrong trigger rate.

## What Ana did

| Approve | Claim |
| :-- | --- |
| ☐ H1<br>🔀 Choice | Picked layout B over A.<br>**Why key:** sets the geometry. |
| ☐ H2<br>🛠️ Correction | The trigger rate is 100 kHz, not 1 MHz.<br>**Why key:** changes the budget.<br>corrects: AI assumed 1 MHz |

<details><summary>Also (1 more)</summary>

| Approve | Claim |
| :-- | --- |
| ☐ H3<br>📚 Knowledge | The 2024 test beam used 120 GeV pions. |

</details>

## AI decisions

☐ All AI claims and minor details below are recorded accurately

| Endorse | AI decision |
| :-- | --- |
| ☐ A1 | Use a two-column table for the budget |
| ☐ A2 | Section order follows the call text<br>Never discussed |

<details><summary>Minor details (3)</summary>

- M1 Renamed the "Notes" column to "Evidence" in the draft table.
- M2 Moved the label legend below the table.
- M3 AI: used sentence case for all headings (never discussed).

</details>

<details><summary>Links and evidence</summary>

- H2 → main.tex §Budget
</details>

<details><summary>Record details</summary>

| Field | Value |
| --- | --- |
| claudoperation | 0.3 |
| session | 2026-11-04-demo |
| member | ana |
| product | proposal/main.tex |
| product_type | endorsed |
| span | 2026-11-04 |
| approval | pending |
</details>
`

const PATH = 'sessions/ana/2026-11-04-demo.md'

const PANE = {
  plugin: 'claudoperation',
  component: 'Pane',
  requestId: 'claudoperation-approve',
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
  expect(r.minor.map((m) => m.id)).toEqual(['M1', 'M2', 'M3'])
  expect(r.human.length).toBe(3)
  expect(validateRecord(RECORD.replace('- M1 ', '- [ ] M1 ')).errors.join()).toContain('minor details: items take no checkbox')
  expect(validateRecord(RECORD).errors).toEqual([])
})

test('the validator catches a Correction without evidence and a fourth key claim', async () => {
  const bad = RECORD
    .replace('<br>corrects: AI assumed 1 MHz', '')
    .replace('| ☐ H2<br>', '| ☐ H4<br>🔀 Choice | Extra.<br>**Why key:** x. |\n| ☐ H5<br>🔀 Choice | Extra.<br>**Why key:** x. |\n| ☐ H2<br>')
  const { errors } = validateRecord(bad)
  expect(errors).toContain('H2: Correction needs a "corrects:" relation')
  expect(errors).toContain('key: 4 key claims, at most 3')
})

test('applyApproval adds the author note inside the links block', async () => {
  const out = applyApproval(RECORD, { human: { H1: { checked: true } }, notes: ['H1 checked by hand'], approval: 'individual' })
  expect(out).toContain('| ☑ H1<br>🔀 Choice')
  expect(out).toContain('- H2 → main.tex §Budget\n- author: H1 checked by hand\n</details>')
  expect(out).toContain('| approval | individual |')
})

test('the pane approves, relabels with evidence, endorses, and saves', async ($, on) => {
  const written = new Map<string, string>()
  stubFiles(on, written)

  // No argument: the pane lists the records, and pressing one opens it
  expect(await $.command.run({ command: 'claudoperation-approve', args: '' })).toEqual({})
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'rec-' + PATH })).toMatchObject({ props: { label: expect.stringContaining('pending') } })
  await ui.press({ key: 'rec-' + PATH })

  await ui.press({ key: 'h-H1' })
  await ui.press({ key: 'h-H2' })
  // Relabel H3 as Verification: the pane asks for what was checked
  await ui.press({ key: 'labels' })
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
  expect(out).toContain('| ☑ H1<br>🔀 Choice')
  expect(out).toContain('| ☑ H2<br>🛠️ Correction')
  expect(out).toContain('| ☐ H3<br>✅ Verification | The 2024 test beam used 120 GeV pions.<br>checked: compared with the 2024 run log |')
  expect(out).toContain('☑ All AI claims and minor details below are recorded accurately')
  expect(out).toContain('| ☑ A1 | Use a two-column table')
  expect(out).toContain('| ☐ A2 | Section order')
  expect(out).toContain('| approval | individual |')
  expect(out).toContain('- M2 Moved the label legend below the table.')
  expect(out).toContain('- author: H3 relabeled Knowledge → Verification')
  expect(validateRecord(out).errors).toEqual([])
})

test('approve all needs a second press and never endorses AI decisions', async ($, on) => {
  const written = new Map<string, string>()
  stubFiles(on, written)
  await $.command.run({ command: 'claudoperation-approve', args: PATH })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'all' })
  expect(await ui.find({ key: 'all' })).toMatchObject({ props: { label: 'Confirm: approve all claims' } })
  await ui.press({ key: 'all' })
  await ui.press({ key: 'save' })

  const out = written.get(PATH)
  expect(out).toContain('| approval | bulk |')
  expect(out).toContain('| ☑ H3<br>📚 Knowledge')
  expect(out).toContain('☑ All AI claims and minor details below are recorded accurately')
  expect(out).toContain('| ☐ A1 | Use a two-column table')
})

// A key claim with its own context (v0.4); neutral invented content
const CONTEXT_RECORD = RECORD.replace(
  '| ☐ H1<br>🔀 Choice | Picked layout B over A.<br>**Why key:** sets the geometry. |',
  '| ☐ H1<br>🔀 Choice | The office floor plan uses layout B: desks in pods of four, not rows.<br>**Before:** desks stood in long rows.<br>**Now:** pods of four with a shared whiteboard.<br>**Example:** the second-floor team moved first.<br>**Why key:** sets the geometry. |',
)

test('key claims may carry Before, Now and Example lines without polluting relations or text', async () => {
  const r = parseRecord(CONTEXT_RECORD)
  const h1 = r.human[0]
  expect(h1.text).toBe('The office floor plan uses layout B: desks in pods of four, not rows.')
  expect(h1.before).toBe('desks stood in long rows.')
  expect(h1.now).toBe('pods of four with a shared whiteboard.')
  expect(h1.example).toBe('the second-floor team moved first.')
  expect(h1.why).toBe('sets the geometry.')
  expect(h1.relations).toEqual([])
  expect(validateRecord(CONTEXT_RECORD).errors).toEqual([])
  // Ticking a claim leaves its context lines intact
  const out = applyApproval(CONTEXT_RECORD, { human: { H1: { checked: true } } })
  expect(out).toContain('| ☑ H1<br>🔀 Choice | The office floor plan')
  expect(out).toContain('<br>**Before:** desks stood in long rows.<br>**Now:**')
})

test('the validator holds the context lines to key claims, in order, without a duplicate "before"', async () => {
  const nonKey = RECORD.replace('| The 2024 test beam used 120 GeV pions. |', '| The 2024 test beam used 120 GeV pions.<br>**Now:** x |')
  expect(validateRecord(nonKey).errors).toContain('H3: Before/Now/Example lines are for key claims only')
  const order = CONTEXT_RECORD.replace('**Before:** desks stood in long rows.<br>**Now:** pods of four with a shared whiteboard.', '**Now:** pods of four with a shared whiteboard.<br>**Before:** desks stood in long rows.')
  expect(validateRecord(order).errors).toContain('H1: context lines must run Before, Now, Example')
  const afterWhy = CONTEXT_RECORD.replace('<br>**Why key:** sets the geometry.', '').replace('**Example:** the second-floor team moved first.', '**Why key:** sets the geometry.<br>**Example:** the second-floor team moved first.')
  expect(validateRecord(afterWhy).errors).toContain('H1: "Why key" comes after the Before/Now/Example lines')
  const dup = RECORD.replace('corrects: AI assumed 1 MHz', 'corrects: AI assumed 1 MHz').replace('<br>**Why key:** changes the budget.', '<br>**Before:** 1 MHz.<br>**Why key:** changes the budget.')
  expect(validateRecord(dup).errors).toContain('H2: a "corrects:" line already says what was before; drop "Before:"')
})

// A transcript: one captured turn, the marker, then a human turn mixing typing and a paste
const line = (o: object) => JSON.stringify(o)
const human = (t: string, text: string) => line({ type: 'user', timestamp: t, origin: { kind: 'human' }, promptSource: 'typed', message: { role: 'user', content: text } })
const TRANSCRIPT = [
  human('2026-11-18T10:00:00Z', 'before the marker, ignored entirely'),
  line({ type: 'assistant', timestamp: '2026-11-18T10:01:00Z', message: { content: [{ type: 'text', text: 'Captured.\n[claudoperation:captured 2026-11-18-first]' }] } }),
  human('2026-11-18T10:10:00Z', 'make the stats simple please'),
  line({ type: 'assistant', timestamp: '2026-11-18T10:11:00Z', message: { content: [{ type: 'text', text: 'one two three four' }] } }),
  line({ type: 'user', timestamp: '2026-11-18T10:12:00Z', message: { role: 'user', content: [{ type: 'tool_result', content: 'ignored words here' }] } }),
  line({ type: 'user', timestamp: '2026-11-18T10:13:00Z', origin: { kind: 'system' }, message: { role: 'user', content: 'task notification not typed by a person' } }),
  human('2026-11-18T10:20:00Z', 'use this <pasted_content id="1">alpha beta gamma delta epsilon</pasted_content> as a guide'),
  human('2026-11-18T12:00:00Z', 'back after lunch'),
  '{"type":"user","times',
].join('\n')

test('transcript stats count typed words without pasted text, and only human turns after the last marker', async () => {
  const s = transcriptStats(TRANSCRIPT)
  expect(s.scopedFromMarker).toBe(true)
  expect(s.humanTurns).toBe(3)
  expect(s.typedWords).toBe(5 + 5 + 3) // "make the stats simple please" + "use this  as a guide" + "back after lunch"
  expect(s.activeMinutes).toBe(1 + 1 + 1 + 7) // 10:10 to 10:20; the 100-minute gap before 12:00 is a break
  // Whole session, ignoring the marker
  const all = transcriptStats(TRANSCRIPT, { afterMarker: false })
  expect(all.scopedFromMarker).toBe(false)
  expect(all.humanTurns).toBe(4)
})

test('the volume section reports active time with the 15-minute idle rule, and the validator reads it', async () => {
  expect(IDLE_MINUTES).toBe(15)
  const text = formatVolume(transcriptStats(TRANSCRIPT))
  expect(text).toContain('| 10 m | 3 | 13 |')
  expect(text).toContain('gaps of up to 15 minutes')
  expect(formatVolume({ activeMinutes: 65, humanTurns: 24, typedWords: 1340 })).toContain('| 1 h 05 m | 24 | 1340 |')
  const withVolume = RECORD.replace('<details><summary>Record details</summary>', text + '\n<details><summary>Record details</summary>')
  expect(validateRecord(withVolume).errors).toEqual([])
  expect(parseRecord(withVolume).volume).toMatchObject({ active: '10 m', turns: '3', words: '13' })
  expect(validateRecord(withVolume.replace('| 10 m |', '| about an hour |')).errors.join()).toContain('active time')
  // After Record details, or without its row, the section is refused
  const after = RECORD + '\n' + text
  expect(validateRecord(after).errors).toContain('session volume: must come before the Record details block')
  expect(validateRecord(RECORD.replace('<details><summary>Record details</summary>', '## Session volume\n\n<details><summary>Record details</summary>')).errors.join()).toContain('session volume: needs one row')
})

test('the pane finds sessions/ above the working directory', async ($, on) => {
  // Claude Code started two folders below the repo root: the engine resolves each
  // candidate to an absolute path, so the stub answers by order (cwd, ../, ../../)
  let probes = 0
  on('fs.exists', ($, e) => ({ value: e.path.endsWith('sessions') && ++probes === 3 }))
  on('fs.list', ($, e) => ({
    value: e.path.endsWith('/sessions')
      ? [{ name: 'ana', kind: 'dir', size: 0, isLink: false }]
      : [{ name: '2026-11-04-demo.md', kind: 'file', size: RECORD.length, isLink: false }],
  }))
  on('fs.read', () => ({ value: RECORD }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  expect(await $.command.run({ command: 'claudoperation-approve', args: '' })).toEqual({})
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'rec-../../sessions/ana/2026-11-04-demo.md' })).toMatchObject({ props: { label: expect.stringContaining('ana') } })
})

test('the pane collects each child repo capture_dir when started above sibling repos', async ($, on) => {
  // operations-orchestra/ (not a repo) holds aggregator/ and utils/, each with a policy
  // pointing into ../dev-log/<repo>; nothing is found walking up from the working directory
  const policy = (repo) => `capture_dir: ../dev-log/${repo}  # records live in dev-log\n`
  const dir = (name) => ({ name, kind: 'dir', size: 0, isLink: false })
  const file = (name) => ({ name, kind: 'file', size: RECORD.length, isLink: false })
  on('fs.exists', ($, e) => ({ value: /(aggregator|utils)\/\.claudoperation\/policy\.yml$|dev-log\/(aggregator|utils)$/.test(e.path) }))
  on('fs.read', ($, e) => ({ value: e.path.endsWith('policy.yml') ? policy(e.path.match(/(aggregator|utils)\/\.claudoperation/)[1]) : RECORD }))
  on('fs.list', ($, e) => ({
    value: /dev-log\/(aggregator|utils)$/.test(e.path) ? [dir('ana')]
      : /dev-log\/aggregator\/ana$/.test(e.path) ? [file('2026-11-20-store.md')]
      : /dev-log\/utils\/ana$/.test(e.path) ? [file('2026-11-20-store.md'), file('2026-11-19-time.md')]
      : [dir('aggregator'), dir('utils'), dir('dev-log'), file('notes.txt')],
  }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  expect(await $.command.run({ command: 'claudoperation-approve', args: '' })).toEqual({})
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'rec-dev-log/aggregator/ana/2026-11-20-store.md' })).toBeDefined()
  expect(await ui.find({ key: 'rec-dev-log/utils/ana/2026-11-20-store.md' })).toBeDefined()
  expect(await ui.find({ key: 'rec-dev-log/utils/ana/2026-11-19-time.md' })).toBeDefined()
})
