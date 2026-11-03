# Claudoperation

When AI writes most of the output, teammates can no longer see what each human actually contributed. Claudoperation fixes that with a **session record**: a short Markdown file, drafted by Claude and approved by you, that says what you decided, corrected and originated in a session with Claude, and which AI decisions nobody has reviewed. Teammates read it before the AI output.

## What's in the plugin

| Part | What it does | Where it runs |
| --- | --- | --- |
| `/claudoperation:capture` | Drafts a record of the session since the last capture, ranks your key contributions, and runs the validator | Claude Code; skills also load on claude.ai |
| `SPEC.md` | The record format, v0.1 | Inside the skill folder |
| `scripts/validate.mjs` | Checks a record against the spec (needs Node.js) | Anywhere |
| `/claudo-approve` | A pane to tick claims, change labels, add evidence, and endorse AI decisions, then save | Claude Code terminal, Desktop app, VS Code (v2.1.287+) |

## Install

```bash
claude plugin marketplace add <owner>/claudoperation
claude plugin install claudoperation@claudoperation
```

To try it without installing, from a clone:

```bash
claude --plugin-dir ./plugins/claudoperation
```

## Use

1. Work with Claude as usual.
2. Run `/claudoperation:capture`. Claude writes `sessions/<you>/<date>-<slug>.md`.
3. Run `/claudo-approve` (it opens the newest pending record), tick what's right, fix labels, save.
4. Commit the record with your product changes.

Without the pane, edit the checkboxes in the file directly, or reply "ok" with any corrections.

## Records in this repo

`sessions/martin/` holds the records of the conversation that designed Claudoperation. They are also the skill's worked examples.

## Develop

```bash
claude plugin validate ./plugins/claudoperation
cd plugins/claudoperation && claude plugin test
node plugins/claudoperation/skills/capture/scripts/validate.mjs sessions/*/*.md
```

Tested with Claude Code 2.1.317. The mod API is new and may change between releases.
