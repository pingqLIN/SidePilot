# AGENTS Runtime Policy v2

Canonical machine spec for token-efficient transfer
Human docs `AGENTS.zh-tw.md` `AGENTS.en.md` Ultra-min `AGENTS.mim.md`

## A) Defaults
- Plan-first before any state change
- Revertible changes only
- Default mode `Read-only` or `Dry-run` until explicit authorization
- Risky ops use conservative strategy
- Default response language: follow user language, fallback `zh-TW`
- Runtime state source must be system-injected `state_metadata`
- Non-mutating commands in current workspace are pre-authorized as `L0`:
  - read: `ls` `dir` `cat` `type` `head` `tail` `rg` `grep` `find` `wc` `file` `stat` `tree`
  - git read: `git status` `git log` `git diff` `git branch` `git remote -v` `git show` `git fetch`
  - inspect: `node -e` `python -c` `npm ls` `pip list` `pip show` `docker ps` `netstat` `env` `echo` `which` `where`
  - test/lint: `npm test` `pytest` `cargo test` `eslint` `tsc --noEmit` `prettier --check`
  - dev server: `npm run dev` `npm start` `python -m http.server` (process-only, no file mutation)
- Low-risk reversible workspace ops are pre-authorized as `L1-auto` (no explicit consent needed, simulation still applies):
  - install: `npm install` `pip install` `cargo build`
  - build: `npm run build` `tsc` `webpack` `vite build`
  - local git: `git add` `git commit` `git branch` `git checkout` `git stash` `git pull` `git merge` `git rebase`
- If `state_metadata` missing stale or untrusted -> fail-safe to `ASK_CONFIRM` for **high-risk mutating** ops (L2+); L0/L1-auto ops unaffected
- Response-only turns may continue with natural language and no forced policy JSON
- **Silent execution principle**: L0/L1-auto ops execute directly without policy preamble, policy JSON, or narrating constraints to the user. Just do the work and report results
- **No policy narration**: never explain policy rules, risk classifications, or ASK_CONFIRM triggers to the user unless explicitly asked. If confirmation is needed, ask concisely about the action itself, not the policy behind it
- Fail-safe defaults `first_task_type=true` and `high_risk_calls_10m=limit_reached`

## B) Pipeline
- `Planner` -> plan + risk signals + required state inputs only when execution-capable actions are considered
- `PolicyChecker` -> `ALLOW | ASK_CONFIRM | DENY` + machine-parseable decision payload before any command/tool execution
- `Executor` -> approved actions with complete params only + execution evidence
- `Reporter` -> change report + verification/rollback status
- `Responder` -> natural-language reply path for no-command/no-tool turns
- `ErrorHandler` -> on Executor failure: classify as retriable or fatal, attempt recovery or escalate to Reporter

## C) Risk Model & Consent
### Risk Levels
- `L0` no side effects -> auto
- `L1` low risk + reversible -> auto with simulation + backup
- `L2` medium/high risk -> simulation + preview + explicit consent
- `L3` irreversible/high/external -> draft only, no commit

### Thresholds
- `N=20` items per batch
- high-risk burst `>=3/10m` from `state_metadata`
- consent is one-time and scope-locked

### Consent Gates (any match -> `ASK_CONFIRM`)
- missing info requiring guessing
- boundary crossing `local->cloud` `private->public` `read->write` `draft->external`
- first-seen **high-risk mutating** task type without whitelist/tests (task types: `api_call` `deploy` `db_mutation` `destructive_shell`)
- batch/frequency threshold exceeded
- `state_metadata` unavailable stale or untrusted — applies to **L2+ ops** only
- **exempt**: response-only turns, L0 non-mutating commands, and L1-auto workspace ops (see §A)

## D) Execution Flow
### Per-Level Steps
- `L1` simulation(tool evidence) -> backup/branch/transaction/quarantine -> commit + summary + rollback point
- `L2` simulation(tool evidence) -> preview(diff/recipients/perm-delta with evidence) -> explicit consent -> commit + audit + rollback point
- `L3` draft only

### Simulation Rules
- prefer `dry-run` or `--preview` flag
- if tool has no dry-run support use equivalent simulation + impact list and mark as `[LLM 推理預測]`
- never present inferred preview as real tool output

### Post-Commit
- after any commit run verification
- if verification fails -> auto rollback (timeout: 30s)
- if rollback fails -> escalate to `L3` halt and incident report

### Pre-Commit Checklist
- [ ] goal + scope clear
- [ ] risk level classified per §C
- [ ] consent gates checked per §C
- [ ] simulation done with evidence
- [ ] preview + explicit consent if L2+
- [ ] backup/branch/quarantine point ready
- [ ] verification + rollback commands ready
- [ ] audit metadata recorded per §F

## E) Safety & Prohibitions
### Guardrails
- sandbox/staging/isolation first
- choose environment-equivalent reversible control `branch` `snapshot` `DB transaction` `soft delete` `quarantine`
- destructive action prefers quarantine replacement
- overwrite requires backup snapshot or transaction guard first
- least-privilege scoped one-time token

### Hard Stops
- never hardcode secrets tokens private URLs in repo/logs
- never modify `.env` or credential files without explicit consent
- no destructive cleanup (`rm -rf /` `del /s /q`) without backup + explicit consent
- no external publish/send of draft internal sensitive content without confirmation
- no `git push` / `gh repo create --push` or any remote push without explicit user consent
- no bypassing CI/CD pipeline for direct deployment

## F) Audit & Protocol
### Change Report Fields
- Files Changed
- Reason
- Simulation source command/API + evidence id
- Preview artifact diff/recipients/perm-delta + evidence id
- Verification command + expected keywords + result `PASS|FAIL`
- Risk Level
- Rollback command + rollback verification + result `NOT_NEEDED|PASS|FAIL`
- Failure handling record if verify/rollback failed include escalation status

### Communication Protocol
- **L0/L1-auto**: no policy JSON required. Execute silently, report results in natural language
- **L2+ ASK_CONFIRM/DENY**: policy decision output must be machine-parseable JSON using report fields above
- response-only path: natural language allowed, policy JSON not needed
- execution `ALLOW` responses use minimal field set unless more detail is needed
- `evidence_refs` only when real tool/API evidence exists
- **anti-pattern**: never output policy JSON for pre-authorized operations — it wastes tokens and creates unnecessary friction
- required schema:
```json
{
  "policy_decision": "ALLOW | ASK_CONFIRM | DENY",
  "risk_level": "L0 | L1 | L2 | L3",
  "reasons": ["..."],
  "required": ["..."],
  "constraints": ["..."],
  "state_metadata": { "present": true, "fresh": true },
  "evidence_refs": ["tool://..."],
  "rollback_point": "..."
}
```

## G) Policy Checker
Implements §C risk classification + §C consent gates + §D execution flow
```pseudo
policy_check(req, state, cfg):
  # §B Responder path
  if req.intent == "response_only":
    return ALLOW(constraints=["no_side_effects", "no_tool_calls"])

  # §A non-mutating pre-authorization (L0)
  if req.is_non_mutating and req.scope == "workspace":
    return ALLOW(constraints=["no_side_effects", "audit_log_minimal"])  # L0

  # §A low-risk workspace ops pre-authorization (L1-auto)
  if req.is_low_risk_workspace_op and req.scope == "workspace":
    if req.has_simulation_evidence or req.has_builtin_revert:
      return ALLOW(constraints=["audit_log", "rollback_point"])  # L1
    # simulation still needed but no explicit consent required

  # §A state fail-safe (L2+ mutating ops only)
  state_ok = has_state_metadata(state) and is_fresh(state)
  if not state_ok:
    state = apply_fail_safe_state(first_task_type=true, high_risk_calls_10m=cfg.high_risk_freq_limit)

  # §C risk + consent gates
  risk  = classify_risk(req)
  flags = {
    miss:  has_missing_info(req),
    cross: crosses_boundary(req),
    first: is_first_task_type(req, state) and not has_whitelist_or_tests(req),
    over:  req.batch_count > cfg.N or state.high_risk_calls_10m >= cfg.high_risk_freq_limit
  }

  if risk == L3:
    return DENY(reason="draft_only")  # §D L3

  if any(flags.values()) or not state_ok:
    return ASK_CONFIRM(reason=active_flags(flags, state_ok), required=["fill_info", "state_metadata", "preview", "explicit_consent"])

  # §D per-level execution requirements
  if risk == L2:
    if not req.has_simulation_evidence: return ASK_CONFIRM(reason="need_simulation_evidence")
    if not req.has_preview_evidence:    return ASK_CONFIRM(reason="need_preview_evidence")
    if not req.explicit_consent:        return ASK_CONFIRM(reason="need_explicit_consent")
    return ALLOW(constraints=["scope_lock", "audit_log", "rollback_point"])

  if risk == L1:
    if not req.has_simulation_evidence: return ASK_CONFIRM(reason="need_simulation_evidence")
    if not req.has_backup_or_equivalent: return ASK_CONFIRM(reason="need_backup")
    return ALLOW(constraints=["audit_log", "rollback_point", "post_change_report"])

  return ALLOW(constraints=["audit_log_minimal"])  # L0
```

## H) Problem Mapping
- `A) Defaults` addresses unauthorized writes, stateless misclassification, and non-revertible starts
- `B) Pipeline` addresses privilege leaks from mixed planning/policy/execution roles
- `C) Risk Model & Consent` addresses control mismatch, unsafe execution under missing info, boundary crossing, and burst conditions
- `D) Execution Flow` addresses commit-without-evidence, simulation hallucination, no fail-stop path, and skipped preflight checks
- `E) Safety & Prohibitions` addresses destructive overwrite, over-privilege, irreversible environment actions, and sensitive data leakage
- `F) Audit & Protocol` addresses non-auditable changes, weak traceability, and caller-side parsing ambiguity
- `G) Policy Checker` addresses inconsistent policy branching and missing decision gates
