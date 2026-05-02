---
name: mi-cr-start
description: Start implementing a Meeting Intelligence change request. Loads CR details from change-requests.json, checks dependencies, creates a feature branch, creates a pre-CR checkpoint, and displays implementation guidance. Use when beginning work on any CR (CR-001 through CR-009). Trigger on "start CR", "begin CR", "work on CR", "implement CR".
---

# Start Change Request Implementation

Arguments: `<CR-ID>` (e.g., `CR-004`). Sets up everything needed to begin implementing a change request.

## Steps

### 1. Load CR details

Read the CR data from `migration/change-requests.json`. Parse the file and find the entry matching the provided CR-ID.

Display to user:
- **Title**
- **Submitted by**
- **Priority** / **Impact** / **LOE**
- **Description**
- **Business justification**
- **Dashboard-only?** / **n8n changes required?**
- **Data exists?**

### 2. Dependency check

Read the `dependency_graph` from the same JSON file. Check if this CR has any `blocked_by` entries.

Also check `docs/15-change-log-revision-1.md` (if it exists) to see which CRs have already been completed. Warn if a dependency is unfinished.

For CR-001 specifically: warn that this requires n8n changes and should be done last.

### 3. Branch check

```bash
cd dashboard
git branch --list "cr-$(echo <CR-ID> | tr '[:upper:]' '[:lower:]')*"
```

If a branch already exists, ask: "A branch for this CR already exists. Resume work on it, or create a new branch?"

If resuming: `git checkout <existing-branch>`
If new: proceed to step 4.

### 4. Create feature branch

Generate a slug from the CR title (lowercase, hyphens, first 4-5 words):

```bash
git checkout -b cr-<id-number>-<slug>
```

Example: `cr-004-remove-internal-meetings`

### 5. Create pre-CR checkpoint

Run the equivalent of `/mi-checkpoint pre-<CR-ID>`:
- Create git tag `checkpoint/pre-<cr-id>-<date>`
- Record state to `.checkpoints.log`

### 6. Display implementation guidance

From the CR JSON, display:
- **Files to modify** (the `files_to_modify` array)
- **Verification criteria** (the `verification` field)

Also read the plan at `~/.claude/plans/there-are-a-couple-golden-moore.md` for additional implementation details specific to this CR (search for the CR-ID in the plan).

### 7. Ready message

```
Ready to implement <CR-ID>: <title>
Branch: cr-<id>-<slug>
Checkpoint: pre-<cr-id>

When implementation is complete, run: /mi-cr-complete <CR-ID>
```
