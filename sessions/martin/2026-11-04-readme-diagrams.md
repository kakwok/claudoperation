---
claudoperation: 0.1
session: 2026-11-04-readme-diagrams
member: martin
product: README.md, docs/
product_type: endorsed
span: 2026-11-03 → 2026-11-04
approval: pending
---

**Summary.** Martin asked for a before-and-after diagram of the problem, then reset its focus: AI output is too large to read, and people value human input most. He also proposed attaching the skills to the chat, named the approve command `clop:approve`, and limited the approve prompt to Claude Code.

## What Martin did — key
- [ ] H2 · 🛠️ Correction · The core problem is that the AI product is large and unread, and people value human input more, not that texts look alike. → corrects: AI framing that human and AI text look alike. *Why key: reset the diagram's message; later edits follow from it.*
- [ ] H1 · 🎯 Direction · Draw a before-and-after diagram: separate AI chats and hidden human input, versus approved contributions that teammates can see. *Why key: set the goal and content of the whole diagram.*
- [ ] H4 · 💡 Origination · Show the capture skill attached to each AI chat in the After panel, plus the synthesize skill. *Why key: put the tools into the picture; the net story card follows.*

<details><summary>Also (7 more)</summary>

- [ ] H3 · 🎯 Direction · Show AI and human output as colors inside the product, in both panels; the After product should be better accounted for.
- [ ] H6 · 🎯 Direction · Make the diagram suitable for the README's first page, and add an illustration of the approve pane showing an example capture.
- [ ] H5 · 💡 Origination · AI can also read the records to build a more coherent product, because human direction is now exposed.
- [ ] H9 · 🔀 Choice · Add the approve prompt to the capture skill, rather than building a real auto-open. → refined by: #H10
- [ ] H10 · 🎯 Direction · Trigger the approve prompt only in Claude Code. → refines: #H9
- [ ] H8 · 💡 Origination · Name the approve command `clop:approve`. → depends_on: #H7
- [ ] H7 · 🛠️ Correction · The name `claudo-approve` reads weird; find another. → corrects: AI-chosen command name `claudo-approve`. led_to: #H8
</details>

## AI decisions
- [ ] All AI claims below are recorded accurately

Tick to endorse:
- [ ] A1 · Green for human text, amber for unreviewed AI, a green outline for AI a human checked — never discussed
- [ ] A2 · The README diagram is two standalone SVG panels, Before and After, that follow light and dark mode — never discussed
- [ ] A3 · A net story card, fed by the records, sits between the records and the product → depends_on: #H4
- [ ] A4 · The approve-pane image is a terminal mock built from `register.js`, using an example record and an invented evidence prompt — never discussed
- [ ] A5 · The skill only asks the author to run `/clop:approve`; it does not open the pane → depends_on: #H9
- [ ] A6 · Example figures in the diagrams ("40 pages", "~2 min", sample claims) are made up — never discussed

## Open questions
- Does a colon in the command name work at runtime? Only the plugin validator was run.
- The cached copy of the capture skill still says `/claudo-approve`, so it will need refreshing.
- The README images were not checked on GitHub, and the pane's right-hand callouts were only partly seen in a preview.
- The test file was edited for the rename but not run; no `node` was available.

<details><summary>Links and evidence</summary>

- H1–H5 → `docs/problem-before.svg`, `docs/problem-after.svg`, published artifact "Claudoperation Problem Diagram"
- H6 → `README.md`, `docs/approve-pane.svg`
- H7–H10 → `hooks/register.js`, `tests/approve.test.ts`, `skills/capture/SKILL.md` §7
- A4 → `plugins/claudoperation/hooks/register.js`
</details>
