# SidePilot v3 — MVP Tasks

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Define the initial execution framework    ║
║                    for the SidePilot v3 MVP                 ║
║  Confidence      : MEDIUM — initial draft framework         ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [ARCHITECTURE.md](ARCHITECTURE.md) · [PAGE_CONTEXT_MODEL.md](PAGE_CONTEXT_MODEL.md) · [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) · [DEV_MODE.md](DEV_MODE.md)

---

## Purpose

This document turns the v3 architecture direction into an initial, milestone-shaped execution backlog. It is intentionally lightweight: enough structure to guide implementation, not a replacement for issue tracking.

---

## MVP Priority

Start with the smallest slice that proves SidePilot can understand the current page with less manual capture and can expose that context safely to the agent.

Initial priority order:

1. Live page context system
2. Prompt pipeline support for live page context
3. Policy boundary for observe vs act vs fix
4. Narrow browser evidence actions
5. Dev-mode fix/verify loop for SidePilot workspace issues

---

## Milestone V3-A — Ambient Context MVP

| Task | Intent |
|------|--------|
| Define page-context packet fields | Lock the minimum useful schema for prompt injection |
| Build tab and route observation hooks | Detect when context should refresh |
| Extract high-signal page regions | Capture summary, selection, and notable blocks |
| Add side panel preview surface | Let users inspect live context before injection |
| Inject `[Live Page Context]` into SDK prompt assembly | Make the new packet visible to the agent |

**Acceptance signals:**

- common docs and GitHub pages can be summarized without manual capture
- users can inspect what will be injected
- stale context is visibly marked or refreshed

---

## Milestone V3-B — Browser Evidence And Action MVP

| Task | Intent |
|------|--------|
| Define capability taxonomy for inspect / navigate / interact / capture / verify | Keep the control plane bounded |
| Implement low-risk inspection actions first | Start with useful evidence before active interaction |
| Add approval prompts for state-changing actions | Keep active control understandable |
| Persist action and evidence summaries | Make actions reviewable in task flow |

**Acceptance signals:**

- the agent can gather useful browser evidence without guessing
- active interactions are gated and logged
- failures produce diagnostics instead of silent no-ops

---

## Milestone V3-C — Dev Mode MVP

| Task | Intent |
|------|--------|
| Gate dev-only features behind explicit mode or policy | Separate normal usage from workspace workflows |
| Reuse browser evidence contract for reproduction and verification | Avoid parallel tooling models |
| Add focused diagnose/fix/verify workflow in SidePilot workspace | Enable narrow self-iteration loops |
| Produce compact audit summaries for each fix attempt | Keep mutation traceable |

**Acceptance signals:**

- a narrow class of SidePilot issues can be reproduced, patched, and rechecked end to end
- code changes require explicit approval
- verification results are visible and auditable

---

## Cross-Cutting Tasks

| Task | Intent |
|------|--------|
| Document privacy and redaction defaults | Prevent ambient context from becoming uncontrolled capture |
| Keep v3 isolated from current stable docs and runtime behavior | Avoid confusing v0.5.x / v2 users |
| Define shared terminology across architecture, API, and dev-mode docs | Reduce spec drift before implementation |

---

## Suggested First Implementation Pass

1. Finalize the page-context packet fields and preview behavior
2. Wire live page context into the SDK prompt pipeline
3. Add freshness and redaction markers
4. Introduce browser inspection actions with evidence logging
5. Add dev-mode gating and one focused verify loop

---

## Current Open Decisions

1. Which v3 milestone should land first in code without destabilizing the current extension?
2. How much of the browser action layer should be MVP versus deferred until page context is proven useful?
3. Should the first dev-mode slice target extension UI bugs, bridge/runtime bugs, or one curated workflow from each?
