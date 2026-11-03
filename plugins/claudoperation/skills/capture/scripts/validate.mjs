#!/usr/bin/env node
// Validate Claudoperation session records against SPEC.md.
// Usage: node validate.mjs <record.md> [more.md ...]
// Exit 1 if any record has errors; warnings never fail.
import { readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { validateRecord } = await import(pathToFileURL(join(here, '../../../hooks/record.js')))

const files = process.argv.slice(2)
if (!files.length) {
  console.error('usage: node validate.mjs <record.md> [more.md ...]')
  process.exit(2)
}

let failed = false
for (const file of files) {
  const { errors, warnings, record } = validateRecord(readFileSync(file, 'utf8'), { filename: basename(file) })
  const counts = `${record.human.length} human, ${record.ai.length} AI`
  console.log(`${errors.length ? '✘' : '✔'} ${file} (${counts})`)
  for (const e of errors) console.log(`  error: ${e}`)
  for (const w of warnings) console.log(`  warning: ${w}`)
  if (errors.length) failed = true
}
process.exit(failed ? 1 : 0)
