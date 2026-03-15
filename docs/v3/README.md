# SidePilot v3 — Documentation Hub

<!--
╔══════════════════════════════════════════════════════════════╗
║  FOR AI AGENT                                                ║
║  Primary reader  : AI assistant / language model agent       ║
║  Purpose         : Navigation hub for SidePilot v3 planning  ║
║                    and architecture documents                ║
║  Confidence      : HIGH — authoritative index               ║
║  Last updated    : 2026-03-15                                ║
╚══════════════════════════════════════════════════════════════╝
-->

> **Current shipped line:** SidePilot `v0.5.x / v2`
>
> **This hub:** planning and design docs for the `SidePilot v3` project line inside the same repo.

---

## Document Registry

| File | Reader | Purpose |
| ---- | ------ | ------- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | **AI agent** | v3 product thesis, architecture layers, milestones, and repo strategy |
| [PAGE_CONTEXT_MODEL.md](PAGE_CONTEXT_MODEL.md) | **AI agent** | Proposed live page-context packet, inputs, boundaries, and freshness model |
| [page-context schema](../../v3/shared/schemas/page-context.v1.schema.json) | **AI agent / engineer** | Machine-readable JSON Schema for the v3 live page-context packet |
| [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) | **AI agent** | Bounded browser action surface, evidence contract, and approval expectations |
| [DEV_MODE.md](DEV_MODE.md) | **AI agent** | Dev-only diagnose/fix/verify workflow, policy boundaries, and audit model |
| [MVP_TASKS.md](MVP_TASKS.md) | **AI agent** | Initial milestone-oriented execution plan for the v3 MVP |
| [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) | **AI agent / engineer** | Repo incubation policy, split checkpoint, and baseline-operational trigger for opening a dedicated v3 repository |
| [AGENT_CHECKPOINTS.md](AGENT_CHECKPOINTS.md) | **AI agent / engineer** | Operational milestone checklist for validating real v3 progress and determining split readiness |
| [REPO_SPLIT_HANDOFF_TEMPLATE.md](REPO_SPLIT_HANDOFF_TEMPLATE.md) | **AI agent / engineer** | Standard handoff template to use once v3 is validated and ready for a dedicated repository |
| [REFERENCE_NOTES.md](REFERENCE_NOTES.md) | **AI agent / engineer** | External project notes from `agent-browser` and `tandem-browser` mapped to SidePilot v3 |

---

## How To Read This Set

`docs/v3/` is intentionally forward-looking. It should help an agent or contributor understand what SidePilot v3 is trying to become without rewriting the current `v0.5.x / v2` product docs.

If you need the shipped extension behavior, go back to:

- [../DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md)
- [../FEATURES.md](../FEATURES.md)
- [../USAGE.md](../USAGE.md)
- [../guide/README.md](../guide/README.md)

---

## Recommended Read Order

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for the v3 thesis and system shape
2. Read [PAGE_CONTEXT_MODEL.md](PAGE_CONTEXT_MODEL.md) for the live context packet and privacy model
3. Read [page-context schema](../../v3/shared/schemas/page-context.v1.schema.json) for the exact machine-readable packet contract
4. Read [BROWSER_CONTROL_API.md](BROWSER_CONTROL_API.md) for the browser action boundary and evidence contract
5. Read [DEV_MODE.md](DEV_MODE.md) for the self-iteration workflow and permission model
6. Read [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) for the repo split checkpoint and the definition of "baseline operational"
7. Read [AGENT_CHECKPOINTS.md](AGENT_CHECKPOINTS.md) for the practical milestone-by-milestone validation checklist
8. Read [REPO_SPLIT_HANDOFF_TEMPLATE.md](REPO_SPLIT_HANDOFF_TEMPLATE.md) for the standard split-time handoff package format
9. Read [MVP_TASKS.md](MVP_TASKS.md) for the implementation sequence and acceptance signals
10. Read [REFERENCE_NOTES.md](REFERENCE_NOTES.md) for external design patterns worth borrowing or avoiding

---

## Documentation Intent

| Track | Meaning |
| ----- | ------- |
| `v0.5.x / v2` docs | Current implementation, setup, and runtime behavior |
| `v3` docs | New project line, architecture direction, and staged planning |

The product and repository name both remain `SidePilot`. The version split here is architectural, not a repo rename.
