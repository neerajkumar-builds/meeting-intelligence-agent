---
name: mi-checkpoint
description: Create a rollback-ready checkpoint before making changes to Meeting Intelligence. Creates a git tag, records environment state (branch, SHA, test results, Supabase row counts), and logs to checkpoint history. Use before starting any CR, migration step, or risky change. Trigger on "checkpoint", "snapshot", "save state", "before we start".
---

# Pre-Change Checkpoint

Creates a named checkpoint that captures the current state so you can rollback if something goes wrong. Arguments: `<label>` (e.g., `pre-cr-004`, `pre-migration`).

## Steps

### 1. Parse the label

The user provides a label like `pre-cr-004` or `pre-migration`. If no label given, ask for one.

### 2. Check for uncommitted changes

```bash
cd dashboard
git status --porcelain
```

If there are uncommitted changes, warn: "There are uncommitted changes. The checkpoint captures committed state only. Consider committing first."

### 3. Create git tag

```bash
git tag "checkpoint/<label>-$(date +%Y-%m-%d)"
```

If tag already exists, append a counter (e.g., `checkpoint/pre-cr-004-2026-05-05-2`).

### 4. Record state

Gather this information:
```bash
git rev-parse --abbrev-ref HEAD    # branch name
git rev-parse HEAD                  # commit SHA
npm test 2>&1 | tail -5             # test result summary
```

Also query dev Supabase for row counts (use Supabase MCP if available):
- `SELECT COUNT(*) FROM scored_meetings`
- `SELECT COUNT(*) FROM meeting_chunks`
- `SELECT COUNT(*) FROM zoom_users`

### 5. Log to .checkpoints.log

Append a line to `.migration/checkpoints.log`:

```
[YYYY-MM-DD HH:MM] checkpoint/<label>-<date> | branch: <branch> | sha: <sha-short> | tests: <pass>/<total> | meetings: <N> | chunks: <N> | users: <N>
```

### 6. Confirm to user

Print:
```
Checkpoint "<label>" created at <sha-short>
Tag: checkpoint/<label>-<date>

To rollback:  /mi-rollback <label>
To list all:  git tag -l 'checkpoint/*'
```
