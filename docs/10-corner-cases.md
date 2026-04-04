# 10 - Corner Cases, Limitations, and Safety Rules

Everything that can go wrong, break, or behave unexpectedly. Read this before modifying production code.

---

## Production Safety Rules

### n8n Tables -- DO NOT TOUCH

The following Supabase tables are owned and managed by the n8n ingestion pipeline. The dashboard reads from them but must **never** write to, update, or delete from them:

- `meetings`
- `scored_meetings`
- `meeting_chunks`
- `scoring_run_log`
- `zoom_users`

Modifying these tables will corrupt the ingestion pipeline and require a full re-processing of all meetings.

### Analytics Writes Are Fire-and-Forget

All analytics INSERT operations (chat queries, feedback, note creation) use `.catch(() => {})` and never `await` the result in the request path. This is intentional:

- Analytics failures must **never** block user-facing actions
- If Supabase is slow or temporarily unreachable, the user still gets their AI response
- Trade-off: some analytics rows may silently fail to insert under load

### "Clear Chat" Retains Analytics

When a user clicks "Clear chat" and confirms the dialog:

- Conversation is removed from the UI (localStorage cleared)
- **Analytics data is permanently retained** in the `chat_analytics` table
- This is a soft delete by design -- query history is preserved for usage analysis
- There is no mechanism to hard-delete analytics rows from the dashboard

### Rate Limits Fail Open

If the rate limit check itself throws an error (e.g., Supabase connection timeout during the count query):

- The query **proceeds as if the user has not hit any limit**
- This prevents rate-limit infrastructure failures from blocking all users
- Trade-off: under Supabase outage conditions, rate limits are effectively disabled

---

## Known Limitations

### No Pagination on Meetings List

All meetings are fetched in a single query and loaded into memory on the client side. Current dataset has ~76 meetings and performs fine.

**Risk:** At 500+ meetings, expect noticeable load times and potential memory pressure on lower-end devices. The meeting feed, filters, and search all operate on the full in-memory array.

### No Error Boundaries

React error boundaries are not implemented. If any component throws during render:

- The entire page crashes to a white screen
- No fallback UI is displayed
- User must manually refresh
- Particularly risky for components that parse JSONB data from Supabase (malformed data = crash)

### Mobile Layout Untested

The dashboard was built for desktop viewports. On phones and small tablets:

- Sidebar may overflow or not collapse properly
- Charts (Recharts) may not resize correctly
- Meeting detail tabs may stack in unexpected ways
- Data tables will likely require horizontal scrolling
- No responsive breakpoints have been tested below 1024px

### localStorage Dependencies

The following features rely on `localStorage` and are therefore browser-specific and ephemeral:

| Feature | localStorage Key | Impact if Cleared |
|---------|-----------------|-------------------|
| Ask Blarney conversation history | Conversation messages | Chat history lost, must start new conversation |
| Slack channel preference | Selected channel ID | Reverts to default channel |
| Notification read state | Read notification IDs | All notifications appear as unread |

**Consequences:**

- Conversation history does not sync across devices or browsers
- Clearing browser cache/data resets all three states
- Private/incognito browsing starts with a blank slate every session

### Chart Download Fragility

The PNG export feature locates chart elements using DOM queries (class-based selectors). If the Recharts library updates its internal DOM structure or class names:

- Export may capture an empty/partial image
- No error is thrown -- the user gets a broken PNG silently
- Must manually verify export output after any Recharts version bump

### Pipeline Funnel -- Backlogged

The pipeline funnel visualization was created in V1.2 but then backlogged because the underlying data does not support cross-stage company progression tracking. The funnel currently shows static stage counts, not actual movement between stages.

### MEDDIC Analysis -- Discovery Only

MEDDIC gap analysis is limited to meetings tagged as `discovery` type. Follow-up, onboarding, and internal meetings do not receive MEDDIC scoring, even when the transcript contains relevant signals.

### Competitor Tracking -- 26 Hardcoded Vendors

Competitor detection matches against a fixed list of 26 vendor names. Adding new competitors requires a code change. There is no admin UI for managing the vendor list. Fuzzy matching is not implemented -- only exact (case-insensitive) name matches are detected.

### No Role-Based Access Control

All authenticated users see all data. There is no concept of:

- Admin vs. viewer roles
- Team-scoped data access
- Rep-level data isolation (a rep can see other reps' scores)
- Manager-only views

### No Password Reset Flow

If a user forgets their password, there is no self-service reset. A Supabase admin must manually reset the password via the Supabase dashboard.

### No OAuth/SSO

Authentication is email/password only. No Google, Microsoft, Okta, or SAML integration exists.

### No Audit Logging

Sensitive actions are not logged to any audit trail:

- Who sent a draft email and to which channel
- Who re-summarized a meeting
- Who cleared their chat history
- Who created/viewed meeting notes

### Meeting Notes -- No Edit or Delete

Once a meeting note is created, it cannot be edited or deleted from the dashboard. The note is permanently stored in Supabase. Correction requires direct database access.

### Rate Limit Daily Reset

The daily rate limit counter resets at **UTC midnight**, not the user's local midnight. A user in PST who has used 49/50 queries at 4:00 PM local time gets a fresh 50 at 4:00 PM (midnight UTC). This is a minor UX inconsistency but not a functional issue.

---

## Edge Cases

### Empty JSONB Fields

`rep_score` and `meeting_score` columns in Supabase can be `null` or contain partial data. All components that read these fields use optional chaining (`?.`) to avoid crashes. However, some derived calculations (like averages or trend deltas) may produce `NaN` if not all expected fields are present.

### Missing Company Name

Internal meetings may not have a `company_name` value. When this happens:

- The Company Intelligence sidebar conditionally renders (hidden entirely)
- The meeting card in the feed shows "Internal Meeting" as the label
- Company-level aggregation pages exclude these meetings

### Timezone Handling

- All dates are stored as UTC timestamps in Supabase
- Display uses `date-fns` to convert to the user's local timezone
- The From/To date filter operates on the displayed (local) date, which can cause off-by-one issues near midnight UTC for users in negative-offset timezones

### Duplicate Meeting IDs

If the n8n pipeline processes the same Zoom meeting twice (e.g., due to a webhook retry or manual re-run):

- Both records appear in the meeting feed
- Both are scored independently
- Company-level aggregations may double-count metrics
- There is no deduplication logic in the dashboard -- deduplication must happen at the n8n level

### Very Long Transcripts

- The transcript viewer is constrained to `max-h-96` (384px) with overflow scroll
- Search highlights work across the full transcript text, not just the visible portion
- Extremely long transcripts (2+ hours) may cause noticeable lag when applying search highlights due to DOM node count

### Zero-Score Meetings

Meetings with a score of exactly 0 render correctly:

- `CircularGauge` shows an empty ring (not a broken or missing chart)
- Score displays as "0" not blank
- Color coding treats 0 as the lowest tier (red)

### Slack 503 / Service Down

If Slack returns a 503 or is otherwise unreachable:

- An error toast appears informing the user
- The dashboard continues functioning normally for all non-Slack features
- The Slack channel picker shows an error state instead of the channel list
- Previously selected channel preference (in localStorage) is preserved

---

## Environment Variable Dependencies

### ANTHROPIC_API_KEY

**If missing or invalid:**

- Ask Blarney (AI chat) returns an error on every query
- Draft email action fails
- Re-summarize action fails
- Meeting prep action fails
- All other dashboard features (scorecard, feed, filters, companies) continue working

### GEMINI_API_KEY

**If missing or invalid:**

- Vector search (embedding-based retrieval) is skipped entirely
- AI chat still works but uses only score data context (no semantic transcript search)
- Response quality degrades for questions that depend on specific transcript content
- No error is shown to the user -- the system silently falls back

### SLACK_BOT_TOKEN

**If missing:**

- Falls back to `SLACK_WEBHOOK_URL` for sending messages
- If webhook URL is also missing, Slack features show an error state
- Channel picker is non-functional without the Bot Token (conversations.list requires it)

### NEXT_PUBLIC_PIPELINE_INTERVAL_HOURS

**If wrong or missing:**

- The "Next sync" time estimate on the sync status page will be inaccurate
- No functional impact -- the actual sync interval is controlled by n8n, not this variable
- This is a display-only setting

---

## Quick Reference: What Breaks What

| Failure | Impact | Severity |
|---------|--------|----------|
| Supabase down | Entire dashboard non-functional | Critical |
| Anthropic API down | AI features broken, data views work | High |
| Gemini API down | Degraded AI quality, no visible error | Medium |
| Slack down | Toast error, dashboard continues | Low |
| localStorage cleared | Chat history + preferences reset | Low |
| n8n pipeline stopped | No new meetings ingested, existing data intact | Medium |
| Rate limit check fails | Limits bypassed, queries proceed | Low |
| Malformed JSONB in DB | Component crash (no error boundary) | High |
