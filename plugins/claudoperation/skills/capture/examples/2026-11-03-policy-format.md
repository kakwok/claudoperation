---
claudoperation: 0.1
session: 2026-11-03-policy-format
member: martin
product: claudoperation/docs/design.md
product_type: endorsed
span: 2026-11-03
approval: pending
---

**Summary.** Martin tied the capture policy to the product's purpose and ruled out flagging low-human work. He named capture quality as the crux, set the claims list's job, and asked for claims ranked by influence.

## What Martin did — key
- [ ] H2 · 💡 Origination · Policy depends on product purpose: endorsed products (a proposal) get review rules; functional code records design decisions only. *Why key: splits capture, approval and policy into two modes.*
- [ ] H8 · 🎯 Direction · The claims list aims at recall of key human value: minor inputs may be missed, key decisions must not. *Why key: defines what capture quality means and how it is tested.*
- [ ] H10 · 🎯 Direction · Rank claims by influence for the reader; no weighting in analytics. → refines: 2026-11-02-taxonomy-workflow#H3. *Why key: changed the record's layout to key claims plus folded rest.*

<details><summary>Also (8 more)</summary>

- [ ] H1 · 🛠️ Correction · Even report-level flagging of low-human AI work is too harsh; insightful input can produce a lot of output. → corrects: AI proposal for Report as the default level
- [ ] H5 · 🎯 Direction · Capture quality is the crux; output must be logical and digestible, with diagrams for those who need them, later.
- [ ] H3 · 🛠️ Correction · Traceable human input means human-approved claims. → corrects: AI proposal to count human-originated claims
- [ ] H4 · 🛠️ Correction · Capture never asks the author questions. → corrects: AI proposal for type-specific questions
- [ ] H6 · 🎯 Direction · Support both Claude Code and claude.ai; not enough people use Claude Code.
- [ ] H9 · 🎯 Direction · Approval friction in Claude Code is too high; explore a custom UI extension.
- [ ] H7 · 💡 Origination · Use this design conversation as the first capture testbed.
- [ ] H11 · 💡 Origination · A claim's label category is itself a ranking signal.
</details>

## AI decisions
- [ ] All AI claims below are recorded accurately

Tick to endorse:
- [ ] A4 · Content and presentation separate; diagrams only from approved links
- [ ] A5 · Approval by exception for functional paths; PR task list for endorsed
- [ ] A1 · Product type declared per path in a policy file, with a repo default
- [ ] A2 · Policy checked per PR; author can override with a recorded reason
- [ ] A3 · Exemptions: small changes, generated files, merges, out-of-scope paths
- [ ] A6 · Ranking signals: downstream links, reversals, and scope
- [ ] A7 · Approval pane as a Claude Code mod, after the format freezes

## Open questions
- Will approval by exception decay into rubber-stamping?

<details><summary>Links and evidence</summary>

- H1, H2, H3 → design.md §Capture policy; refine: 2026-11-02-taxonomy-workflow#H9
- H5, A4 → design.md §Presentation layer
- H8 → design.md §v1 scope and pilot plan (capture-quality test)
- H10, H11, A6 → ranking rule
</details>
