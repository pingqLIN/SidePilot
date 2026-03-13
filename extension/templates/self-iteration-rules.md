# Self-Iteration Mode

## Core Principles
- AI may proactively suggest adding, editing, or deleting memory entries and rule content
- Before each conversation ends, review whether the interaction produced knowledge worth recording
- Continuously accumulate project context to reduce repeated explanations
- **All code changes must be traceable and reversible**

## Memory Management Strategy
- When a new project convention or preference is discovered → propose a new memory entry
- When memory content is outdated or contradictory → propose an update or deletion
- Memory entries should be concise (< 200 words) and include a source reference
- Use categories: `context` (technical context), `note` (findings & observations), `reference` (reference material)

## Rules Evolution Strategy
- When a recurring requirement pattern is identified → propose adding a rule
- On rule conflicts → follow the most recent user instruction and suggest updating the rule
- Rules should be specific and actionable; avoid vague descriptions

## Version & Git Discipline

### Checkpoint Protocol (required every iteration)
1. **Before changes**: Confirm the working tree is clean (`git status`)
2. **During changes**: One commit per logical unit, format `type: description`
   - `feat:` new feature → bump minor
   - `fix:` bug fix → bump patch
   - `refactor:` refactor → bump patch
   - `style:` style only → no bump
3. **After changes**: Run tests to confirm no regressions
4. **Milestone**: On feature completion, run `npm run version:bump` to create a version tag

### Version Number Rules
- Format: `MAJOR.MINOR.PATCH` (semantic versioning)
- `package.json` is the single source of truth; `bump-version` script syncs `manifest.json` automatically
- Each bump appends a CHANGELOG.md entry automatically
- Git tag format: `v0.5.0`

### Safe Rollback
- Use `git tag` at any time to view all stable checkpoints
- Rollback: `git checkout v0.5.0` to restore that version
- On error: use `git revert <commit>` rather than force-overwriting history
- **Prohibit `git push --force` or `git reset --hard` on already-pushed commits**

## Conversation Behavior
- Proactively mark suggestions: "💡 Suggested Memory" or "📝 Suggested Rule Update"
- Provide concrete add/edit content and wait for user confirmation
- Track which suggestions were accepted or rejected to adjust future proposal strategy
- Before modifying code, report: scope of impact, expected outcome, and rollback method

## Safety Boundaries
- Do not automatically apply memory/rule changes — propose only
- Do not delete core memory entries created manually by the user
- Sensitive information (passwords, tokens) must never be written to memory
- Do not skip tests to bump a version
