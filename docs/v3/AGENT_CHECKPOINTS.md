# SidePilot v3 — Agent Checkpoints

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / engineer                   ║
║  Purpose         : Provide a practical checkpoint sheet      ║
║                    for validating SidePilot v3 progress      ║
║                    and deciding when repo split is justified ║
║  Confidence      : HIGH — operational checklist             ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [ARCHITECTURE.md](ARCHITECTURE.md) · [MVP_TASKS.md](MVP_TASKS.md) · [DEV_MODE.md](DEV_MODE.md) · [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md)

---

## Purpose

This document turns the v3 plan into a practical checkpoint sheet that future Agents can use while developing SidePilot v3.

It is intentionally more operational than the architecture docs:

- **architecture docs** explain what v3 is trying to become
- **migration strategy** explains when repo split should happen
- **this file** explains how an Agent can decide whether progress is real, partial, blocked, or split-ready

---

## How Agents Should Use This File

When working on v3, an Agent should:

1. identify which milestone or subsystem is being changed
2. update only the relevant checkpoint group mentally or in status reporting
3. avoid claiming a milestone is complete unless all required checks in that group are satisfied
4. consult [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) before recommending a new repository

This file is a **development checkpoint**, not a release note.

---

## Status Labels

Agents should classify each checkpoint using one of these states when reporting progress.

| State | Meaning |
| ----- | ------- |
| `not-started` | No meaningful implementation or validation yet |
| `in-progress` | Partial implementation exists but the flow is not yet proven |
| `validated` | The checkpoint works in a real, relevant path |
| `blocked` | Progress is currently prevented by a known dependency or unresolved decision |

---

## V3-A — Ambient Context Checkpoints

This group corresponds to the live page-context foundation.

### A1. Context packet contract

- [ ] packet schema is defined and versioned
- [ ] packet fields are stable enough for prompt assembly
- [ ] packet includes identity, summary, selection, notable blocks, freshness, and privacy metadata

### A2. Context production

- [ ] active tab changes trigger refresh evaluation
- [ ] route changes trigger refresh evaluation
- [ ] selected text or focused high-signal region can be captured
- [ ] notable page regions can be extracted without dumping full DOM state

### A3. Context preview and trust

- [ ] current page context can be previewed in the side panel
- [ ] stale state is visible or inferable to the user
- [ ] privacy or redaction state is surfaced in a bounded way

### A4. Prompt integration

- [ ] the runtime prompt path can consume `[Live Page Context]`
- [ ] injected page context is inspectable and bounded
- [ ] the feature works on at least common docs pages and GitHub pages

### V3-A completion rule

Agents should only mark V3-A as **validated** when A1 through A4 are all true in a real running flow.

---

## V3-B — Browser Evidence And Action Checkpoints

This group corresponds to bounded browser control with evidence.

### B1. Evidence collection

- [ ] page snapshot or equivalent inspect output exists
- [ ] console summary or equivalent runtime evidence exists
- [ ] network summary or equivalent request evidence exists when applicable

### B2. Capability boundaries

- [ ] inspect actions are clearly separated from state-changing actions
- [ ] action types are classified at least at the level of inspect / interact / capture / verify
- [ ] risky actions are not silently executed

### B3. Interaction path

- [ ] at least one bounded click or type flow works
- [ ] approval is requested for state-changing interaction
- [ ] post-action result can be observed through evidence or visible UI change

### B4. Failure quality

- [ ] failures return diagnostics instead of silent no-ops
- [ ] action results are recorded and reviewable
- [ ] evidence can explain what changed or why nothing changed

### V3-B completion rule

Agents should only mark V3-B as **validated** when B1 through B4 are all true in a real browser-assisted path.

---

## V3-C — Dev Mode Checkpoints

This group corresponds to self-iteration inside the SidePilot workspace.

### C1. Mode gating

- [ ] dev-only capability is explicitly gated
- [ ] workspace mutation is clearly distinguished from observation
- [ ] approval boundary for code changes is visible

### C2. Diagnose path

- [ ] the agent can connect runtime evidence to likely code hotspots
- [ ] relevant extension or bridge files can be identified with explanation
- [ ] proposed fix scope is bounded before mutation

### C3. Fix path

- [ ] an approved patch can be applied in workspace scope
- [ ] the patch is minimal and traceable
- [ ] touched files and rationale can be summarized

### C4. Verify path

- [ ] focused tests, reload, or browser checks can be run after the patch
- [ ] before/after state can be compared in a useful way
- [ ] outcome can be reported as fixed, blocked, or partially verified

### V3-C completion rule

Agents should only mark V3-C as **validated** when at least one real diagnose → fix → verify loop succeeds end to end.

---

## V3-D — Unified Workspace Checkpoints

This group corresponds to the point where v3 starts feeling like a coherent runtime instead of separate experiments.

### D1. Shared task flow

- [ ] browser context and local code context can participate in one task flow
- [ ] actions, observations, and fixes are visible in one understandable narrative

### D2. Runtime coherence

- [ ] browser runtime can answer what is happening now
- [ ] local runtime can answer what should change and whether it worked
- [ ] the two channels cooperate without relying on manual glue for every step

### D3. Product coherence

- [ ] the side panel can surface enough state for users to understand the active workflow
- [ ] v3 feels like a product direction, not just a set of disconnected experiments

### V3-D completion rule

Agents should only mark V3-D as **validated** when D1 through D3 are true in an integrated demonstration path.

---

## Cross-Cutting Safety Checkpoints

These checks apply across all milestones.

- [ ] observation is visible and user-controllable
- [ ] destructive or high-risk actions require stronger approval
- [ ] prompt input from the page is bounded and not an uncontrolled dump
- [ ] audit trail exists for important actions or fixes
- [ ] dev-mode capabilities do not silently leak into normal user mode

If these checks fail, milestone completion should be treated as partial at best.

---

## Split Readiness Shortcut

For a fast repo-split decision, Agents can use this short form before consulting the full migration strategy.

- [ ] V3-A is validated
- [ ] V3-B is validated
- [ ] V3-C is validated
- [ ] cross-cutting safety checkpoints are satisfied
- [ ] the v3 runtime works as a coherent real flow rather than isolated demos

If any item above is missing, the default recommendation remains:

- **keep v3 in the current repo**

If all items above are true, Agents should consult [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) and treat a dedicated repository as the preferred next step.

---

## What Agents Must Not Overclaim

Agents should not claim v3 milestone completion just because:

- docs are thorough
- schemas exist
- isolated helpers exist
- mocked demos pass
- a single subsystem works without the rest of the flow

The standard is operational reality, not document completeness.

---

## Suggested Reporting Format For Future Agents

When reporting v3 progress, Agents should prefer a compact summary such as:

- `V3-A: in-progress — packet + preview exist, prompt path not yet validated`
- `V3-B: validated — inspect snapshot + approved click path verified`
- `V3-C: blocked — dev-mode gating exists, but no successful end-to-end fix loop yet`
- `Split readiness: not ready — V3-C incomplete`

This makes milestone progress easy to compare across future sessions.

---

## One-Sentence Rule

**Treat v3 progress as real only when a milestone works in a relevant running flow, and treat repo split as justified only when the validated milestones satisfy the migration strategy checkpoint.**
