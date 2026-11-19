# Claudoperation

When AI writes most of the output, teammates can no longer see what each human actually contributed. Claudoperation fixes that with a **session record**: a short Markdown file, drafted by Claude and approved by you, that says what you decided, corrected and originated in a session with Claude, and which AI decisions nobody has reviewed. Teammates read it before the AI output.

## The problem

AI now writes most of the product, and nobody reads all of it. Teammates value human input most, but it stays in private chats.

<p align="center">
  <img src="docs/problem-before.svg" width="600" alt="Before: three people each work with a private AI chat. The shared product is large and mostly unreviewed AI output, with a few buried human lines.">
</p>

Claudoperation turns each session into a short record the author approves. Teammates, and their AIs, read the records before the product.

<p align="center">
  <img src="docs/problem-after.svg" width="600" alt="After: the capture skill drafts a record from each chat, the author approves it, the synthesize skill merges the records into a net story, and the product's text is tagged to its human author or marked as unreviewed AI.">
</p>

## What you approve

`/claudoperation-approve` opens the capture record in a pane (an example record is shown). You step between claims with `j`/`k` or the arrow keys, tick the ones that are accurate, press `l` to fix labels, add evidence where a label needs it, and endorse the AI decisions you checked.

Only claims a teammate needs to read get an approve box. Small edits (wording, naming, formatting) go in a collapsed "Minor details" list with no boxes, covered by one accuracy tick.

<p align="center">
  <img src="docs/approve-pane.svg" width="760" alt="The /claudoperation-approve pane showing an example record with approve checkboxes, label dropdowns, an evidence prompt, endorse checkboxes for AI decisions, and Save, Approve all and Cancel buttons.">
</p>

## What's in the plugin

| Part | What it does | Where it runs |
| --- | --- | --- |
| `/claudoperation:capture` | Drafts a record of the session since the last capture, ranks your key contributions, runs the validator, and (with your permission) adds session volume: active time, turns and typed words | Claude Code; skills also load on claude.ai |
| `SPEC.md` | The record format, v0.5 | Inside the skill folder |
| `scripts/validate.mjs` | Checks a record against the spec (needs Node.js) | Anywhere |
| `/claudoperation:synthesize` | Writes your net story (what changed from your first record to your latest) and refreshes the Team block below | Claude Code; skills also load on claude.ai |
| `/claudoperation-approve` | A pane to tick claims, change labels, add evidence, and endorse AI decisions, then save | Claude Code terminal, Desktop app, VS Code (v2.1.287+) |

## Install

```bash
claude plugin marketplace add kakwok/claudoperation
claude plugin install claudoperation@claudoperation
```

To try it without installing, from a clone:

```bash
claude --plugin-dir ./plugins/claudoperation
```

### In the Claude app (claude.ai)

The skills work in the Claude app; the approval pane does not, because it only exists in Claude Code.

1. Open **Customize**, then **Plugins**.
2. Add a marketplace: choose **Add from a repository** and enter `kakwok/claudoperation`.
3. Install the `claudoperation` plugin from that marketplace.
4. In a chat, ask Claude to capture the session, or run `/claudoperation:capture`.
5. Approve by replying "ok" with any corrections, or by ticking the checkboxes in the file.
6. Download the record and add it to your repo at `<capture_dir>/<you>/` (`sessions/<you>/` unless you chose another folder).

<p align="center">
  <img src="docs/claude-app.png" width="560" alt="The Claude app's Customize page, Plugins tab, with the Add marketplace dialog open. Add from a repository is the second option.">
</p>

## Use

1. Work with Claude as usual.
2. Run `/claudoperation:capture`. The first time, Claude asks where to save records and stores your answer as `capture_dir` in `.claudoperation/policy.yml` (default `sessions`). Then it writes `<capture_dir>/<you>/<date>-<slug>.md`.
3. Run `/claudoperation-approve` (it lists your records, pending first; pick one, or pass a path to open it directly), tick what's right, fix labels, save.
4. Commit the record with your product changes.

Without the pane, edit the checkboxes in the file directly, or reply "ok" with any corrections.

## Configuration

Settings live in `.claudoperation/policy.yml` at the repo root.

| Key | What it does | Default |
| --- | --- | --- |
| `capture_dir` | Folder, relative to the repo root, where records and net stories are saved. The first capture asks you and writes it here. | `sessions` |

Capture also reads each path's product type from this file; see `skills/capture/SKILL.md`.

## Team

<!-- claudoperation:martin:start -->
**martin** · 5 sessions, 2 approved · Direction 4, Origination 3, Correction 2, Choice 1 · human:AI claims 11:12 (informational, not a target)
Latest net story (unapproved): a before-and-after diagram of the problem, the approve command, and a Claude Code-only approval prompt. [Read it](sessions/martin/net/2026-11-05-net.md)
2 AI decisions unreviewed · 2 bulk approvals · 0 relabels · 0 overrides
<!-- claudoperation:martin:end -->

## Records in this repo

`sessions/martin/` holds the records of the conversation that designed Claudoperation. They are also the skill's worked examples.

## Develop

```bash
claude plugin validate ./plugins/claudoperation
cd plugins/claudoperation && claude plugin test
node plugins/claudoperation/skills/capture/scripts/validate.mjs <capture_dir>/*/*.md
```

Tested with Claude Code 2.1.317. The mod API is new and may change between releases.
