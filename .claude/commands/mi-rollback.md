---
name: mi-rollback
description: Guided rollback to a previously created checkpoint in Meeting Intelligence. Finds the checkpoint tag, shows what will be lost, stashes uncommitted work as a safety net, and resets to the checkpoint. Use when a change went wrong and you need to revert. Trigger on "rollback", "revert to checkpoint", "undo changes", "go back to".
---

# Guided Rollback to Checkpoint

Arguments: `<checkpoint-label>` (e.g., `pre-cr-004`). Safely reverts to a previously created checkpoint.

## Steps

### 1. Find the checkpoint tag

```bash
cd dashboard
git tag -l "checkpoint/<label>*"
```

If no match found, list all available checkpoints and ask the user to pick one:
```bash
git tag -l 'checkpoint/*' --sort=-creatordate
```

If multiple matches (e.g., `checkpoint/pre-cr-004-2026-05-05` and `checkpoint/pre-cr-004-2026-05-05-2`), show all and ask which one.

### 2. Show what will be lost

```bash
git log checkpoint/<tag>..HEAD --oneline
```

Count the commits. Display them and ask: "This will discard N commits. Are you sure?"

Also show any uncommitted changes:
```bash
git status --porcelain
```

### 3. Safety net

If there are uncommitted changes, stash them:
```bash
git stash push -m "pre-rollback-stash-$(date +%Y%m%d-%H%M)"
```

### 4. Reset to checkpoint

```bash
git reset --hard <tag>
```

This is a destructive operation. Only proceed after user confirms.

### 5. Post-rollback

Print:
```
Rolled back to checkpoint "<label>" (<sha-short>)

If you stashed changes, recover them with: git stash list / git stash pop
If env vars or Supabase state changed since the checkpoint, verify manually.
Run /mi-env-check to confirm environment health.
```
