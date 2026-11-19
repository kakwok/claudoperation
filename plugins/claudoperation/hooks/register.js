// Claudoperation approval pane: /claudoperation-approve [record path]
// Opens a pane over a session record. The author ticks claims, changes labels,
// endorses AI decisions, and saves. The record file stays the source of truth.
import { parseRecord, applyApproval, validateRecord, LABELS, EVIDENCE } from './record.js'

const PANE = 'claudoperation-approve'
const LABEL_OPTIONS = Object.keys(LABELS).map((l) => ({ value: l, label: LABELS[l] + ' ' + l }))

// The record being reviewed and the author's unsaved choices
let rec = null
let draft = null
let cur = 0 // index of the claim last focused, for stepping with j/k and the arrows

// Moves the focus ring to the claim `delta` away from the current one; never touches labels
async function step($, delta) {
  if (!rec) return
  const n = rec.parsed.human.length
  cur = Math.max(0, Math.min(n - 1, cur + delta))
  await $.ui.focus({ requestId: PANE, key: 'h-' + rec.parsed.human[cur].id })
}

function startDraft(path, source) {
  const parsed = parseRecord(source)
  rec = { path, source, parsed }
  cur = 0
  draft = { human: {}, ai: {}, accuracy: parsed.accuracy ? parsed.accuracy.checked : false, bulk: false, armed: false, error: null }
  for (const c of parsed.human) draft.human[c.id] = { checked: c.checked, label: c.label, evidence: '' }
  for (const c of parsed.ai) draft.ai[c.id] = { checked: c.checked }
}

// Every record under <capture_dir>/<member>/, newest first, with its approval state
let list = null
async function loadList($) {
  const found = []
  // Claude Code may be started below the repo root: look for the capture directory in the working directory, then up to three levels above
  // The directory is the capture_dir key in .claudoperation/policy.yml, 'sessions' when unset
  let root = null
  for (const up of ['', '../', '../../', '../../../']) {
    let dir = 'sessions'
    if (await $.fs.exists(up + '.claudoperation/policy.yml')) {
      const m = (await $.fs.read(up + '.claudoperation/policy.yml')).match(/^capture_dir:\s*["']?([^"'#\n]+?)["']?\s*(#.*)?$/m)
      if (m) dir = m[1].replace(/^\.\//, '').replace(/\/+$/, '')
    }
    if (await $.fs.exists(up + dir)) { root = up + dir; break }
  }
  if (root) {
    for (const member of await $.fs.list(root)) {
      if (member.kind !== 'dir') continue
      for (const f of await $.fs.list(root + '/' + member.name)) {
        if (f.kind === 'file' && f.name.endsWith('.md')) found.push(root + '/' + member.name + '/' + f.name)
      }
    }
  }
  found.sort((a, b) => a.split('/').pop().localeCompare(b.split('/').pop())).reverse()
  list = []
  for (const path of found) {
    const p = parseRecord(await $.fs.read(path))
    list.push({
      path,
      member: path.split('/').slice(-2)[0],
      name: path.split('/').pop().replace(/\.md$/, ''),
      approval: p.frontmatter.approval || 'unknown',
      ticked: p.human.filter((c) => c.checked).length,
      total: p.human.length,
    })
  }
}

async function openRecord($, path) {
  if (!(await $.fs.exists(path))) return 'No such file: ' + path
  startDraft(path, await $.fs.read(path))
  if (!rec.parsed.human.length) {
    rec = null
    return 'No claims found in ' + path
  }
  return null
}

// Claims whose label needs evidence the record doesn't hold and the author hasn't typed
function missingEvidence() {
  return rec.parsed.human
    .filter((c) => {
      const d = draft.human[c.id]
      const need = EVIDENCE[d.label]
      return need && !c.relations.some((r) => r.kind === need) && !d.evidence
    })
    .map((c) => c.id + ' (' + EVIDENCE[draft.human[c.id].label] + ':)')
}

async function save($) {
  const missing = missingEvidence()
  if (missing.length) {
    draft.error = 'Add evidence first: ' + missing.join(', ')
    return false
  }
  // Refuse to overwrite edits made on disk since the pane opened
  const onDisk = await $.fs.read(rec.path)
  if (onDisk !== rec.source) {
    draft.error = 'The file changed on disk. Close and run /claudoperation-approve again.'
    return false
  }
  const changes = { human: {}, ai: {}, accuracy: draft.accuracy, notes: [], approval: draft.bulk ? 'bulk' : 'individual' }
  for (const c of rec.parsed.human) {
    const d = draft.human[c.id]
    changes.human[c.id] = { checked: d.checked, label: d.label !== c.label ? d.label : undefined, evidence: d.evidence || undefined }
    if (d.label !== c.label) changes.notes.push(c.id + ' relabeled ' + c.label + ' → ' + d.label)
  }
  for (const c of rec.parsed.ai) changes.ai[c.id] = { checked: draft.ai[c.id].checked }
  const out = applyApproval(rec.source, changes)
  const { errors } = validateRecord(out)
  if (errors.length) {
    draft.error = 'Not saved: ' + errors[0]
    return false
  }
  await $.fs.write(rec.path, out)
  const approved = Object.values(draft.human).filter((d) => d.checked).length
  const endorsed = Object.values(draft.ai).filter((d) => d.checked).length
  $.ui.toast('Saved ' + rec.path + ': ' + approved + ' approved, ' + endorsed + ' endorsed')
  return true
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'claudoperation-approve',
      description: 'Approve a Claudoperation session record in a pane',
      argumentHint: '[record path] (omit to pick from a list)',
    })
    return next(e)
  })

  on('command.run', { command: 'claudoperation-approve' }, async ($, e) => {
    const path = (e.args || '').trim()
    rec = null
    if (path) {
      const err = await openRecord($, path)
      if (err) return { text: err }
    } else {
      await loadList($)
      if (!list.length) return { text: 'No records found in the capture directory. Pass a path: /claudoperation-approve <record.md>' }
    }
    await $.ui.open({ id: PANE, title: 'Approve record', focus: true, closeOnEscape: true })
    return {}
  })

  // Keep the claim index in step with wherever the ring lands (Tab, click, j/k, arrows)
  on('ui.focus', { requestId: PANE }, async ($, e, next) => {
    const i = rec && e.element && e.element.startsWith('h-') ? rec.parsed.human.findIndex((c) => 'h-' + c.id === e.element) : -1
    if (i >= 0) cur = i
    return next(e)
  })

  // The arrows arrive through the Client in the pane
  on('ui.message', { requestId: PANE }, async ($, e, next) => {
    const d = e.data
    if (e.element === 'nav' && d && typeof d.step === 'number') {
      await step($, d.step)
      return {}
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    const { Box, Text, Button, Select, Input, Client } = $.ui.resolve(e)
    if (!rec) {
      const pending = (list || []).filter((x) => x.approval === 'pending').length
      return Box({
        flexDirection: 'column',
        children: [
          Text({ bold: true, children: ['Session records  (' + pending + ' pending). Enter opens one.'] }),
          Text({ children: [' '] }),
          ...(list || []).map((x, i) =>
            Button({
              key: 'rec-' + x.path,
              label: (x.approval === 'pending' ? '[ ] ' : '[x] ') + x.name + '  ' + x.member + '  ' + x.ticked + '/' + x.total + ' claims  ' + x.approval,
              plain: true,
              ...(i === 0 ? { autoFocus: true } : {}),
              onPress: async () => {
                const err = await openRecord($, x.path)
                if (err) $.ui.toast(err)
                $.ui.invalidate('ui.render')
              },
            }),
          ),
          Text({ children: [' '] }),
          Button({ key: 'close', label: 'Close', hotkey: 'c', plain: true, onPress: async () => { await $.ui.close({ id: PANE }) } }),
        ],
      })
    }
    const r = rec.parsed
    const redraw = () => $.ui.invalidate('ui.render')
    const endorsed = r.frontmatter.product_type !== 'functional'
    const rows = []

    rows.push(Text({ bold: true, children: [r.frontmatter.session + ' · ' + r.frontmatter.product_type] }))
    if (r.summary) rows.push(Text({ wrap: 'wrap', children: [r.summary] }))
    rows.push(Text({ children: [' '] }))
    rows.push(Text({ bold: true, children: ['What ' + r.frontmatter.member + ' did  (★ key)'] }))
    rows.push(Client({ key: 'nav', module: './nav.js', height: 1 }))

    r.human.forEach((c, i) => {
      const d = draft.human[c.id]
      rows.push(
        Box({
          key: 'row-' + c.id,
          flexDirection: 'row',
          columnGap: 1,
          children: [
            Button({
              key: 'h-' + c.id,
              label: (d.checked ? '[x] ' : '[ ] ') + (c.isKey ? '★ ' : '  ') + c.id,
              plain: true,
              ...(i === 0 ? { autoFocus: true } : {}),
              onPress: () => { d.checked = !d.checked; draft.error = null; redraw() },
            }),
            draft.editLabels
              ? Select({
                  key: 'l-' + c.id,
                  options: LABEL_OPTIONS,
                  value: d.label,
                  onSelect: (value) => { d.label = value; draft.error = null; redraw() },
                })
              : Text({ key: 'l-' + c.id, children: [LABELS[d.label] + ' ' + d.label] }),
          ],
        }),
      )
      rows.push(Text({ key: 't-' + c.id, wrap: 'wrap', dimColor: !c.isKey, children: ['    ' + c.text] }))
      const need = EVIDENCE[d.label]
      if (need && !c.relations.some((rel) => rel.kind === need)) {
        rows.push(
          Input({
            key: 'ev-' + c.id,
            label: '    ' + need,
            placeholder: need === 'corrects' ? 'what AI proposal or error this fixed' : 'what you checked, and how',
            value: d.evidence,
            submitLabel: 'set',
            onInput: (value) => { d.evidence = value.trim() },
            onSubmit: (value) => { d.evidence = value.trim(); redraw() },
          }),
        )
      }
    })

    if (r.ai.length || r.minor.length) {
      rows.push(Text({ children: [' '] }))
      rows.push(Text({ bold: true, children: [r.minor.length ? 'AI decisions and minor details' : 'AI decisions'] }))
      rows.push(
        Button({
          key: 'acc',
          label: (draft.accuracy ? '[x]' : '[ ]') + (r.minor.length ? ' All AI claims and minor details are recorded accurately' : ' All AI claims are recorded accurately'),
          plain: true,
          onPress: () => { draft.accuracy = !draft.accuracy; redraw() },
        }),
      )
      if (r.minor.length) {
        rows.push(
          Button({
            key: 'minor',
            label: (draft.showMinor ? '[-] ' : '[+] ') + r.minor.length + ' minor details (no approval needed, covered by the tick above)',
            plain: true,
            onPress: () => { draft.showMinor = !draft.showMinor; redraw() },
          }),
        )
        if (draft.showMinor) for (const m of r.minor) rows.push(Text({ key: 'm-' + m.id, wrap: 'wrap', dimColor: true, children: ['    ' + m.id + ' ' + m.text] }))
      }
      for (const c of r.ai) {
        const d = draft.ai[c.id]
        const text = c.id + ' ' + c.text
        rows.push(
          endorsed
            ? Button({
                key: 'a-' + c.id,
                label: (d.checked ? '[x] endorse ' : '[ ] endorse ') + text,
                plain: true,
                onPress: () => { d.checked = !d.checked; redraw() },
              })
            : Text({ key: 'a-' + c.id, wrap: 'wrap', dimColor: true, children: ['    ' + text] }),
        )
      }
    }

    rows.push(Text({ children: [' '] }))
    if (draft.error) rows.push(Text({ color: 'red', wrap: 'wrap', children: [draft.error] }))
    rows.push(
      Box({
        key: 'footer',
        flexDirection: 'row',
        columnGap: 3,
        children: [
          Button({
            key: 'save',
            label: 'Save',
            hotkey: 's',
            plain: true,
            onPress: async () => {
              if (await save($)) {
                rec = null
                await loadList($)
              }
              redraw()
            },
          }),
          Button({ key: 'next', label: 'Next claim', hotkey: 'j', plain: true, onPress: () => step($, 1) }),
          Button({ key: 'prev', label: 'Prev claim', hotkey: 'k', plain: true, onPress: () => step($, -1) }),
          Button({
            key: 'labels',
            label: draft.editLabels ? 'Done with labels' : 'Edit labels',
            hotkey: 'l',
            plain: true,
            onPress: () => { draft.editLabels = !draft.editLabels; redraw() },
          }),
          Button({
            key: 'all',
            label: draft.armed ? 'Confirm: approve all claims' : 'Approve all',
            hotkey: 'a',
            plain: true,
            onPress: () => {
              if (!draft.armed) draft.armed = true
              else {
                // Approves claims and accuracy only: endorsing AI decisions stays deliberate
                for (const d of Object.values(draft.human)) d.checked = true
                draft.accuracy = true
                draft.bulk = true
                draft.armed = false
              }
              redraw()
            },
          }),
          Button({
            key: 'cancel',
            label: 'Back to list',
            hotkey: 'c',
            plain: true,
            onPress: async () => { rec = null; await loadList($); redraw() },
          }),
        ],
      }),
    )

    return Box({ flexDirection: 'column', children: rows })
  })
}
