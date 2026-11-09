# Martin: Capture policy and record format

Martin tied the capture policy to the product's purpose and ruled out flagging low-human work. He named capture quality as the crux, set the claims list's job, and asked for claims ranked by influence.

## What Martin did

| Approve | Claim |
| :-- | --- |
| ☐ H2<br>💡 Origination | Policy depends on product purpose: endorsed products (a proposal) get review rules; functional code records design decisions only.<br>**Why key:** splits capture, approval and policy into two modes. |
| ☐ H8<br>🎯 Direction | The claims list aims at recall of key human value: minor inputs may be missed, key decisions must not.<br>**Why key:** defines what capture quality means and how it is tested. |
| ☐ H10<br>🎯 Direction | Rank claims by influence for the reader; no weighting in analytics.<br>**Why key:** changed the record's layout to key claims plus folded rest.<br>refines: 2026-11-02-taxonomy-workflow#H3 |

<details><summary>Also (8 more)</summary>

| Approve | Claim |
| :-- | --- |
| ☐ H1<br>🛠️ Correction | Even report-level flagging of low-human AI work is too harsh; insightful input can produce a lot of output.<br>corrects: AI proposal for Report as the default level |
| ☐ H5<br>🎯 Direction | Capture quality is the crux; output must be logical and digestible, with diagrams for those who need them, later. |
| ☐ H3<br>🛠️ Correction | Traceable human input means human-approved claims.<br>corrects: AI proposal to count human-originated claims |
| ☐ H4<br>🛠️ Correction | Capture never asks the author questions.<br>corrects: AI proposal for type-specific questions |
| ☐ H6<br>🎯 Direction | Support both Claude Code and claude.ai; not enough people use Claude Code. |
| ☐ H9<br>🎯 Direction | Approval friction in Claude Code is too high; explore a custom UI extension. |
| ☐ H7<br>💡 Origination | Use this design conversation as the first capture testbed. |
| ☐ H11<br>💡 Origination | A claim's label category is itself a ranking signal. |

</details>

## AI decisions

☐ All AI claims below are recorded accurately

| Endorse | AI decision |
| :-- | --- |
| ☐ A4 | Content and presentation separate; diagrams only from approved links |
| ☐ A5 | Approval by exception for functional paths; PR task list for endorsed |
| ☐ A1 | Product type declared per path in a policy file, with a repo default |
| ☐ A2 | Policy checked per PR; author can override with a recorded reason |
| ☐ A3 | Exemptions: small changes, generated files, merges, out-of-scope paths |
| ☐ A6 | Ranking signals: downstream links, reversals, and scope |
| ☐ A7 | Approval pane as a Claude Code mod, after the format freezes |

## Open questions
- Will approval by exception decay into rubber-stamping?

<details><summary>Links and evidence</summary>

- H1, H2, H3 → design.md §Capture policy; refine: 2026-11-02-taxonomy-workflow#H9
- H5, A4 → design.md §Presentation layer
- H8 → design.md §v1 scope and pilot plan (capture-quality test)
- H10, H11, A6 → ranking rule
</details>

<details><summary>Record details</summary>

| Field | Value |
| --- | --- |
| claudoperation | 0.2 |
| session | 2026-11-03-policy-format |
| member | martin |
| product | claudoperation/docs/design.md |
| product_type | endorsed |
| span | 2026-11-03 |
| approval | pending |
</details>
