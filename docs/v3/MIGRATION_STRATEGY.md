# SidePilot v3 — Migration Strategy And Repo Split Checkpoint

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / engineer                   ║
║  Purpose         : Define when SidePilot v3 should continue  ║
║                    incubating in-repo and when it should     ║
║                    split into a new repository               ║
║  Confidence      : HIGH — decision checkpoint document       ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [ARCHITECTURE.md](ARCHITECTURE.md) · [PAGE_CONTEXT_MODEL.md](PAGE_CONTEXT_MODEL.md) · [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) · [DEV_MODE.md](DEV_MODE.md) · [MVP_TASKS.md](MVP_TASKS.md)

---

## Purpose

This document gives SidePilot v3 a clear migration policy:

1. **while v3 is still being proven**, it should continue incubating inside the current `SidePilot` repository
2. **once the baseline v3 goals are truly working**, Agents should treat a dedicated v3 repository as the default next project step

This file is intended to act as a future **Agent checkpoint** rather than a speculative strategy note.

---

## Core Decision

### Default rule

Until the v3 baseline is operational, SidePilot should remain:

- product name: `SidePilot`
- current repo: `SidePilot`
- v3 work location: `docs/v3/` plus `v3/` and any explicitly isolated implementation areas

### Split rule

Once the **v3 baseline goals are complete and demonstrably operational**, Agents should treat **opening a dedicated v3 repository** as the preferred next move.

In other words:

- **before baseline completion:** evolve in-place with strong isolation
- **after baseline completion:** split by default unless a human explicitly decides to keep v3 in the same repo

---

## Confirmed v3 Baseline Goals

The following goals are confirmed from the current v3 plan and define the minimum bar for "v3 is real, not just drafted".

### Goal 1 — Ambient Page Awareness must work

The agent must be able to understand the active page with substantially less manual capture.

Minimum expected behavior:

- detect active tab and route changes
- produce a structured page-context packet
- surface selected region and notable blocks when present
- show context preview in the side panel
- inject live page context into the prompt path used by the agent

This corresponds to **Milestone V3-A**.

### Goal 2 — Browser Evidence And Action must work

The agent must be able to gather evidence from the browser and perform bounded actions with reviewable output.

Minimum expected behavior:

- inspect page state through a stable evidence surface
- collect at least console or network summaries
- perform at least one approved state-changing interaction such as click or type
- log before/after evidence or an equivalent observable result
- fail with usable diagnostics instead of silent no-ops

This corresponds to **Milestone V3-B**.

### Goal 3 — Dev Mode self-iteration must work

The agent must be able to help build and debug SidePilot itself in a focused loop.

Minimum expected behavior:

- observe an issue in SidePilot runtime or UI
- connect runtime evidence to likely code hotspots
- apply an approved local patch in workspace scope
- run focused verification
- report outcome in a compact, auditable way

This corresponds to **Milestone V3-C**.

### Goal 4 — Safety and policy must be present

The baseline is **not** complete if v3 only works by bypassing safety boundaries.

Minimum expected behavior:

- observe / act / fix boundaries are visible
- risky actions require approval
- dev-only capabilities are gated
- context capture and action history are inspectable

This is required even if the first implementation is narrow.

---

## What Counts As “Can Actually Operate”

The trigger for repo split is not "docs exist" or "some modules compile".
The trigger is that the v3 baseline works as an integrated system.

Agents should interpret **can actually operate** as requiring all of the following:

| Area | Required evidence |
| ---- | ----------------- |
| Live page context | works on real pages such as docs, GitHub, or article pages in a running extension session |
| Prompt integration | the page-context packet is actually injected and used in live agent requests |
| Browser evidence/actions | at least one inspect path and one interactive path succeed with observable results |
| Dev mode | at least one diagnose → fix → verify loop succeeds in the SidePilot workspace |
| Safety model | approvals and boundaries are visible in the product flow, not only described in docs |

If any of these are still missing, v3 is still in incubation.

---

## Repo Split Checkpoint

This is the checkpoint Agents should evaluate during future development.

### Split readiness checklist

All items below should be true before Agents treat repo split as the default next action.

#### A. V3-A is operational

- [ ] live page observation works in a real running build
- [ ] current page context is available for preview in the side panel
- [ ] prompt assembly consumes `[Live Page Context]`
- [ ] stale or refreshed context state is visible

#### B. V3-B is operational

- [ ] inspect actions produce useful browser evidence
- [ ] at least one bounded interaction works under approval
- [ ] evidence or state changes are logged after actions
- [ ] failures produce useful diagnostics

#### C. V3-C is operational

- [ ] dev mode is explicitly gated
- [ ] an approved patch loop works end to end in SidePilot workspace
- [ ] verification can use focused tests, reload, or browser checks
- [ ] audit summary shows evidence, files changed, and result

#### D. Operational coherence exists

- [ ] browser runtime and local runtime cooperate in one continuous flow
- [ ] the system feels like a real v3 runtime, not disconnected experiments
- [ ] the v3 code path is substantial enough that ongoing development would benefit from repo separation

---

## Mandatory Trigger Rule

If **all** split readiness checklist items are satisfied, Agents should:

1. mark v3 as **baseline operational**
2. treat **new repository creation** as the preferred recommendation
3. stop assuming the current mono-repo incubation model is still the best default

If the checklist is **not** fully satisfied, Agents should continue using the current repository and avoid premature repo splitting.

---

## Why The Split Happens After Baseline Completion

This strategy intentionally delays the split until v3 is operational because earlier separation would create more cost than clarity.

### Before baseline completion

Keeping v3 in the current repo is useful because:

- existing SidePilot code is still the fastest reference surface
- v3 still needs selective reuse from current extension and bridge code
- the architecture boundary is not yet fully proven
- docs, schema, and prototype implementation still need tight iteration

### After baseline completion

Splitting becomes useful because:

- v3 has crossed from concept into product line
- runtime, release, and roadmap decisions will likely diverge more sharply
- keeping v3 beside the stable line may create review and maintenance drag
- future Agents benefit from a cleaner scope boundary

---

## Agent Operating Policy

Future Agents working on this repository should follow this policy.

### While v3 is still incubating

Agents should prefer:

- `docs/v3/` for planning and checkpoint updates
- `v3/` for new architecture-specific schema or code
- narrowly scoped integration into current extension/bridge only when needed to prove v3 behavior

Agents should avoid:

- treating v3 as already split
- scattering v3 work across unrelated stable areas without reason
- recommending a new repo only because v3 is ambitious on paper

### Once split readiness is achieved

Agents should prefer:

- recommending a dedicated repository for v3 development
- reducing cross-coupling with the current shipped line
- packaging the v3 work as an intentional project line rather than an experimental sidecar

---

## Default New Repository Shape

If the split checkpoint passes and a new repository is created, the default assumption should be:

- repository name: **`SidePilot-v3`** or **`SidePilot-Next`**
- product name: still **`SidePilot`** unless a human decides otherwise
- current repository remains the stable historical line for `v0.5.x / v2`

This document does **not** force the exact repository name.
It only establishes that a dedicated repo becomes the preferred structure once the baseline works.

---

## “Automatic New Repo” Interpretation

The phrase **automatic new repo** should be interpreted as a workflow decision rule for Agents:

- when the checkpoint passes, Agents should automatically conclude that repo split is the default next step
- if future tooling allows direct repository creation, Agents may execute that workflow
- if tooling does not allow direct repository creation, Agents should still produce the split recommendation and a handoff plan automatically

This keeps the decision logic deterministic even if repo-creation capabilities differ by environment.

---

## Required Handoff Package At Split Time

When the checkpoint passes, the Agent should prepare or request a handoff package containing at least:

- current v3 architecture summary
- current v3 schema/contracts
- implementation areas already proven in code
- validated milestones completed
- known gaps after split
- recommended initial folder structure for the new repo

Use [REPO_SPLIT_HANDOFF_TEMPLATE.md](REPO_SPLIT_HANDOFF_TEMPLATE.md) as the default structure for that package.

---

## What Does **Not** Trigger A Split

The following are not enough on their own:

- architecture docs exist
- schemas are drafted
- isolated helper modules exist
- a prototype works only in partial or mocked conditions
- browser actions work but dev mode does not
- dev mode works but live page context is not integrated into actual runtime

The split happens only when v3 baseline capability is operational as a system.

---

## Review Cadence

Agents should revisit this checkpoint when any of the following occurs:

- a v3 milestone is declared complete
- a new end-to-end demo path begins working
- dev mode succeeds on a real fix/verify loop
- the repo starts showing strong friction from co-hosting stable line and v3 line together

---

## One-Sentence Rule

**Keep SidePilot v3 in the current repo until the baseline v3 goals truly work in a real running flow; once they do, Agents should treat a dedicated v3 repository as the default next step.**
