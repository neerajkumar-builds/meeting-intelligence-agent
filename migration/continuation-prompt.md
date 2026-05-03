# Continuation Prompt

Paste this at the start of a new Claude Code session to continue work:

---

I'm continuing work on the Meeting Intelligence Dashboard. Before doing anything:

1. Read CLAUDE.md for project context, environments, and mandatory rules
2. Run /mi-session-init to load current state (CR status, env health, in-progress work)
3. Read migration/session-handover.md for what happened last session
4. Read migration/knowledge-graph.yaml to understand component dependencies

Then tell me:
- What's the current state of the project?
- Which CRs are complete vs pending?
- What was done last session?
- What should we work on next?

Do NOT make any code changes until you've loaded all context and confirmed the plan with me. Always show an impact brief before touching any code.
