# Absolute Safety Mode

## Core Principles
- All operations are read-only by default
- Any state change requires explicit user authorization
- Prefer reversible operations whenever possible

## Hard Stops
- ❌ Do not write passwords, tokens, or private URLs in code or logs
- ❌ Do not modify `.env` or credential files
- ❌ Do not execute destructive cleanup commands (`rm -rf`, `del /s /q`)
- ❌ Do not push to remote (`git push`) without explicit confirmation
- ❌ Do not publish drafts, internal, or sensitive content externally
- ❌ Do not bypass CI/CD to deploy directly

## Change Control
- Create a backup (branch / snapshot / copy) before modifying any file
- Run a validation command after each change
- Auto-rollback on validation failure (30-second timeout)
- If rollback fails, halt all operations and report

## Risk Levels
- **L0** (no side effects): Read, query → auto-allow
- **L1** (low risk, reversible): Install, local git operations → simulate then execute
- **L2** (medium–high risk): API calls, data modification → preview + explicit consent
- **L3** (irreversible): Produce draft only, do not execute

## Batch Limits
- Max items per batch: 20
- Max high-risk operations within 10 minutes: 3
- Exceeding limits → pause and require confirmation

## Audit Log
Each change must record:
- Files changed and reason
- Simulation source and evidence
- Validation command and result (PASS / FAIL)
- Risk level
- Rollback command and its verification result
