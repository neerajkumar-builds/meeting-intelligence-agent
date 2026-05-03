---
name: mi-cr-complete
description: Complete a Meeting Intelligence change request. Verifies you're on the correct branch, runs tests + build, creates a post-CR checkpoint, merges to main (squash or regular), and logs implementation details. Use when a CR is fully implemented and ready for review. Trigger on "complete CR", "finish CR", "CR done", "merge CR", "ready to merge".
---

# Complete Change Request Implementation

Arguments: `<CR-ID>` (e.g., `CR-004`). Wraps up a CR with testing, merging, and documentation.

## Steps

### 1. Verify correct branch

```bash
cd dashboard
git rev-parse --abbrev-ref HEAD
```

Must be on a branch matching `cr-<id>-*`. If on `main` or wrong CR branch, abort with guidance.

### 2. Run tests

```bash
npm test
```

Abort if any test fails. Report which tests failed and suggest fixes.

### 3. Run build

```bash
npm run build
```

Abort if build fails.

### 4. E2E tests (optional)

Ask user: "Run E2E tests? (slower but more thorough) [y/n]"

If yes:
```bash
npm run test:e2e
```

### 5. Dev verification

Ask: "Have you verified this feature on the dev URL? (y/n)"

If no: remind them to run `npm run dev`, test the feature, then come back.

### 6. Create post-CR checkpoint

Create git tag `checkpoint/post-<cr-id>-<date>` and record state to `.checkpoints.log`.

### 7. Rebase check

```bash
git log main..HEAD --oneline
```

Show the commits on this branch. Check if main has moved ahead:
```bash
git log HEAD..main --oneline
```

If main has new commits, suggest: "Main has moved ahead. Rebase first: `git rebase main`"

### 8. Show diff summary

```bash
git diff main --stat
```

Display files changed, insertions, deletions.

### 9. Merge to main

Ask: "Merge strategy?"
1. **Squash merge** (recommended) -- cleaner history, single commit on main
2. **Regular merge** -- preserves individual commits

For squash:
```bash
git checkout main
git merge --squash cr-<id>-<slug>
git commit -m "<CR-ID>: <title>"
```

For regular:
```bash
git checkout main
git merge cr-<id>-<slug>
```

### 10. Log to change log

Append to `migration/changelog-revision-1.md` (create if it doesn't exist):

```markdown
## <CR-ID>: <title>
- **Date completed:** <YYYY-MM-DD>
- **Priority:** <priority>
- **Submitted by:** <submitter>
- **Files modified:** <list from git diff --name-only>
- **How to verify:** <verification field from change-requests.json>
- **Rollback:** `git revert <merge-commit-sha>`
```

### 11. Update project tracker

Write completion to `project_tracker` in dev Supabase (`burcfsxsxgabknmodsrd`):
```sql
INSERT INTO project_tracker (type, reference_id, status, title, details)
VALUES ('cr_status', '<CR-ID>', 'completed', '<title>', 
  '{"completed_at":"<date>","files_modified":[<list>],"merge_sha":"<sha>"}');
```

### 12. Update session handover

Update `migration/session-handover.md` with this CR's completion details.

### 13. Next steps

```
<CR-ID> merged to main.

Next:
- Run /mi-promote to deploy to production
- Or continue to the next CR: /mi-cr-start <next-CR-ID>
```

Read `change-requests.json` to suggest the next CR in implementation order.
