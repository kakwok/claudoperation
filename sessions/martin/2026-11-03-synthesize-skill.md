# Martin: Synthesize skill

Martin asked for the synthesize skill to be built from the design doc, and gave no other input. Claude chose the file layout, the counting script and the rules for what enters a net story.

## What Martin did

| Approve | Claim |
| :-- | --- |
| ☐ H1<br>🎯 Direction | Build the synthesize skill from the design doc.<br>**Why key:** the only human input; set the scope for everything built. |

## AI decisions

☑ All AI claims below are recorded accurately

| Endorse | AI decision |
| :-- | --- |
| ☑ A1 | Only ticked (approved) claims enter a net story; superseded claims are dropped from the story but still counted |
| ☑ A2 | A separate `stats.mjs` script does all counting, reusing the existing record parser<br>Never discussed |
| ☑ A3 | Net stories are written to `sessions/<member>/net/<date>-net.md` with `kind: net-story`<br>Never discussed |
| ☑ A4 | "Since the last release" is found from `releases/<member>/`<br>Never discussed |
| ☑ A5 | Relabels and overrides are counted by matching loose `author:` text, since SPEC has no fixed line for them<br>Never discussed |
| ☑ A6 | A net story stays `pending` and unapproved between releases; release only when the author asks<br>depends_on: #H1 |

## Open questions
- The net-story format is not in SPEC.md, so the validator would reject `kind: net-story` files.
- `stats.mjs` is untested: no `node` was available, so the validator was not run on this record either.

<details><summary>Links and evidence</summary>

- H1 → `Claudoperation — design doc.docx` §v1 scope and pilot plan
- A1–A6 → `plugins/claudoperation/skills/synthesize/SKILL.md`, `scripts/stats.mjs`
</details>

<details><summary>Record details</summary>

| Field | Value |
| --- | --- |
| claudoperation | 0.2 |
| session | 2026-11-03-synthesize-skill |
| member | martin |
| product | plugins/claudoperation/skills/synthesize |
| product_type | endorsed |
| span | 2026-11-03 |
| approval | bulk |
</details>
