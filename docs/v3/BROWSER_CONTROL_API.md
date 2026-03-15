# SidePilot v3 — Browser Control API

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Define the proposed bounded browser       ║
║                    control surface for SidePilot v3         ║
║  Confidence      : MEDIUM — initial draft framework         ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Related docs:** [ARCHITECTURE.md](ARCHITECTURE.md) · [PAGE_CONTEXT_MODEL.md](PAGE_CONTEXT_MODEL.md) · [DEV_MODE.md](DEV_MODE.md)

---

## Purpose

The v3 browser control API defines the bounded action plane through which the agent can inspect and interact with the browser.

This API should make browser actions:

- capability-scoped
- evidence-backed
- permission-aware
- suitable for both user assistance and SidePilot self-verification

It is not intended to be an unrestricted automation layer.

---

## Capability Groups

| Group | Example actions | Default risk |
|-------|-----------------|--------------|
| Inspect | snapshot, DOM query, visible text summary, active element, console summary, network summary | Low |
| Navigate | open URL, reload, go back, switch tab | Medium |
| Interact | click, type, press key, select option, scroll | Medium |
| Capture | screenshot, region capture, structured evidence bundle | Medium |
| Verify | wait for text, assert visible state, compare before/after evidence | Medium |

---

## API Intent

Each action should answer four questions:

1. What capability is being requested?
2. What target page or element is in scope?
3. What evidence should be collected before and after the action?
4. Does the action require explicit approval?

The implementation can be extension-led, bridge-led, or hybrid, but the public contract should remain stable at the capability level.

---

## Proposed Request Shape

| Field | Intent |
|-------|--------|
| `action` | Capability name such as `inspect.snapshot` or `interact.click` |
| `target` | Page, tab, selector, element handle, or active-context reference |
| `args` | Action-specific parameters |
| `approvalMode` | Whether approval is already granted, must be requested, or is not required |
| `evidence` | Requested before/after evidence bundle |
| `contextRef` | Optional reference to the current live page-context packet |

### Example

```json
{
  "action": "interact.click",
  "target": {
    "tab": "active",
    "selector": "[data-testid='save-button']"
  },
  "args": {
    "button": "left"
  },
  "approvalMode": "require-user",
  "evidence": {
    "before": ["snapshot", "console-summary"],
    "after": ["snapshot", "network-summary"]
  },
  "contextRef": "page-context:active"
}
```

---

## Proposed Result Shape

| Field | Intent |
|-------|--------|
| `status` | `ok`, `blocked`, `failed`, or `partial` |
| `action` | Echo of requested capability |
| `targetResolved` | What page/element actually received the action |
| `evidence` | Collected artifacts and summaries |
| `changesObserved` | Visible or runtime changes detected after execution |
| `error` | Failure explanation when applicable |

---

## Evidence Requirements

Every action should leave an evidence trail suitable for diagnosis or audit.

| Evidence type | Purpose |
|---------------|---------|
| Snapshot | Human-readable page state before or after an action |
| Screenshot | Visual confirmation for UI changes |
| Console summary | Runtime errors and warnings |
| Network summary | Request failures or notable activity |
| Action log | What was attempted, when, and with which arguments |

At minimum, state-changing actions should capture both pre-action and post-action evidence.

---

## Approval Boundary

| Action class | Suggested default |
|--------------|-------------------|
| Passive inspection | Allowed in observe mode |
| Navigation away from current page | Request approval |
| Typing, clicking submit, or changing form state | Request approval |
| Download, upload, or destructive UI action | Strong approval plus explicit impact explanation |

Approval decisions should be surfaced inside the SidePilot UI rather than hidden in logs.

---

## Integration Expectations

- The API should be able to consume the current page-context packet as a target hint.
- Dev mode should reuse the same action/evidence contract instead of inventing a separate automation language.
- Logging should be serializable so browser actions can appear in task history and fix verification summaries.

---

## Current Open Decisions

1. Which capabilities should be implemented directly via extension APIs versus external automation tooling?
2. How should selectors and page references be normalized across extension, CDP, and possible Playwright-backed flows?
3. What is the smallest useful evidence bundle for MVP without making every action too slow?
