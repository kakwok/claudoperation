# Martin: README diagrams and approve command

Martin asked for a before-and-after diagram of the problem, then reset its focus: AI output is too large to read, and people value human input most. He also proposed attaching the skills to the chat, named the approve command `clop:approve`, and limited the approve prompt to Claude Code.

## What Martin did

| Approve | Claim |
| :-- | --- |
| ☑ H2<br>🛠️ Correction | The core problem is that the AI product is large and unread, and people value human input more, not that texts look alike.<br>**Why key:** reset the diagram's message; later edits follow from it.<br>corrects: AI framing that human and AI text look alike |
| ☑ H1<br>🎯 Direction | Draw a before-and-after diagram: separate AI chats and hidden human input, versus approved contributions that teammates can see.<br>**Why key:** set the goal and content of the whole diagram. |
| ☑ H4<br>💡 Origination | Show the capture skill attached to each AI chat in the After panel, plus the synthesize skill.<br>**Why key:** put the tools into the picture; the net story card follows. |

<details><summary>Also (7 more)</summary>

| Approve | Claim |
| :-- | --- |
| ☑ H3<br>🎯 Direction | Show AI and human output as colors inside the product, in both panels; the After product should be better accounted for. |
| ☑ H6<br>🎯 Direction | Make the diagram suitable for the README's first page, and add an illustration of the approve pane showing an example capture. |
| ☑ H5<br>💡 Origination | AI can also read the records to build a more coherent product, because human direction is now exposed. |
| ☑ H9<br>🔀 Choice | Add the approve prompt to the capture skill, rather than building a real auto-open.<br>refined by: #H10 |
| ☑ H10<br>🎯 Direction | Trigger the approve prompt only in Claude Code.<br>refines: #H9 |
| ☑ H8<br>💡 Origination | Name the approve command `clop:approve`.<br>depends_on: #H7 |
| ☑ H7<br>🛠️ Correction | The name `claudo-approve` reads weird; find another.<br>corrects: AI-chosen command name `claudo-approve`<br>led_to: #H8 |

</details>

## AI decisions

☑ All AI claims below are recorded accurately

| Endorse | AI decision |
| :-- | --- |
| ☑ A1 | Green for human text, amber for unreviewed AI, a green outline for AI a human checked<br>Never discussed |
| ☑ A2 | The README diagram is two standalone SVG panels, Before and After, that follow light and dark mode<br>Never discussed |
| ☐ A3 | A net story card, fed by the records, sits between the records and the product<br>depends_on: #H4 |
| ☑ A4 | The approve-pane image is a terminal mock built from `register.js`, using an example record and an invented evidence prompt<br>Never discussed |
| ☐ A5 | The skill only asks the author to run `/clop:approve`; it does not open the pane<br>depends_on: #H9 |
| ☑ A6 | Example figures in the diagrams ("40 pages", "~2 min", sample claims) are made up<br>Never discussed |

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

<details><summary>Record details</summary>

| Field | Value |
| --- | --- |
| claudoperation | 0.2 |
| session | 2026-11-04-readme-diagrams |
| member | martin |
| product | README.md, docs/ |
| product_type | endorsed |
| span | 2026-11-03 → 2026-11-04 |
| approval | bulk |
</details>
