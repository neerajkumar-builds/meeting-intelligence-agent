# n8n Changes Guide - Session 5 (2026-05-22)

## Overview

8 meetings have score 0 due to MI|3 "Score CS" LLM chain returning non-JSON text.
Two changes fix this: (1) harden the prompt, (2) add JSON repair fallback in Process Scores.
After fixing, re-score the 8 failed meetings.

Also: rename Slack bot from "Meeting Intelligence" to "Prism".

---

## STATUS: ALL CHANGES APPLIED AND PUBLISHED (2026-05-22)

- Score CS prompt hardened (DONE)
- Process Scores JSON fallback added (DONE)
- Max tokens set to 8192 on ALL model nodes (DONE - was the key fix)
- Slack bot renamed to Prism (DONE)
- MI|3 published as active version (DONE)
- 6 of 8 original failures re-scored successfully (6.5-7.6 range)
- 2 persistently failing (ISW 46K transcript + Lathan McKee) - hidden from digests by status filter

---

## Change 1 of 3: Harden Score CS Prompt

**Workflow**: MI | 3 - Score Meetings (4-LLM)
**Node**: Score CS (the LLM chain node, NOT Process Scores)
**What**: Add a strict JSON instruction block at the TOP of the prompt

### Steps

1. Open MI|3 workflow in n8n
2. Double-click the **"Score CS"** node (it's a chain/LLM node, connected after Route by Stage output 4)
3. Find the prompt text area
4. Place your cursor at the **very beginning** of the prompt (before the existing first line)
5. Paste this block EXACTLY as shown below (including the blank line at the end):

```
RESPONSE FORMAT RULES (MANDATORY):
1. Output ONLY a raw JSON object. Start with { and end with }.
2. No markdown code fences. No backticks. No ```json blocks.
3. No preamble text before the JSON. No explanation after the JSON.
4. If you include ANY text outside the JSON object, the response will be rejected and the meeting will fail scoring.
5. Do not wrap the JSON in any other structure.

```

6. Leave the rest of the existing prompt exactly as-is below this block
7. Save the node (click outside or press the checkmark)

### Why

The LLM sometimes wraps its JSON response in markdown fences or adds explanatory text before/after.
This instruction block makes it explicit that ONLY raw JSON is acceptable.

---

## Change 2 of 3: Add JSON Repair Fallback in Process Scores

**Workflow**: MI | 3 - Score Meetings (4-LLM)
**Node**: Process Scores (the Code node that runs after all LLM chains)
**What**: Replace the JSON extraction error block with a smarter fallback

### Steps

1. In MI|3 workflow, double-click the **"Process Scores"** node (Code node)
2. Use Ctrl+F / Cmd+F to search for this exact text: `No valid JSON object found in LLM response`
3. You should find it inside an if/else block that looks like this:

```javascript
if (jsonEnd > jsonStart) {
  parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
} else {
  throw new Error('No valid JSON object found in LLM response');
}
```

4. Select and DELETE that entire if/else block (all 5 lines above)
5. Paste this replacement code in its place:

```javascript
    if (jsonEnd > jsonStart) {
        parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
    } else {
        // Fallback: try regex extraction for known scoring keys
        const csMatch = clean.match(/\{[\s\S]*"category_scores"[\s\S]*\}/);
        const salesMatch = clean.match(/\{[\s\S]*"meddic_scores"[\s\S]*\}/);
        const internalMatch = clean.match(/\{[\s\S]*"meeting_quality_score"[\s\S]*\}/);
        const fallbackMatch = csMatch || salesMatch || internalMatch;

        if (fallbackMatch) {
            try {
                parsed = JSON.parse(fallbackMatch[0]);
            } catch (e2) {
                throw new Error('No valid JSON object found in LLM response');
            }
        } else {
            throw new Error('No valid JSON object found in LLM response');
        }
    }
```

6. Save the node

### Why

When the balanced-brace JSON extractor fails (can't find matching { }), the current code
immediately throws an error and sets score = 0. The new code tries 3 regex patterns to
find JSON by looking for known keys (category_scores for CS, meddic_scores for Sales,
meeting_quality_score for Internal). This catches cases where the LLM wraps valid JSON
in explanatory text.

### Important

- The indentation uses 4 spaces per level - this matches n8n's code editor
- The regex patterns are non-greedy enough to work but greedy enough to capture the full JSON
- If the fallback also fails, it still throws the same error (no silent failures)
- This does NOT change how any other stage type is scored (Discovery, Follow-Up, etc.)

---

## Change 3 of 3: Rename Slack Bot

**Where**: Slack App Settings (not n8n)

1. Go to https://api.slack.com/apps
2. Find the "Meeting Intelligence" app
3. Go to **Settings > Basic Information > Display Information**
4. Change **App Name** from "Meeting Intelligence" to "Prism"
5. Optionally update the short description to match
6. Save Changes

This changes the bot name that appears as the sender on all future Slack messages.
Historical messages will still show the old name.

---

## After Changes 1 + 2: Re-score 8 Failed Meetings

**DO NOT PUBLISH** the workflow as active yet. Test first.

### Test Procedure

1. Save both changes (Score CS prompt + Process Scores code)
2. In MI|3, click "Manual Test" trigger
3. Set up a test with ONE of the failed meeting IDs
4. Run the workflow
5. Check the "Process Scores" node output:
   - Did it parse the JSON successfully? (no parse_error)
   - Is overall_score > 0?
   - Is client_health_score > 0?
6. Check Supabase: did the meeting's status change from scoring_failed to completed?

### Meetings to Re-score (8 total)

| Meeting ID | Topic | Host |
|------------|-------|------|
| bf89b26b-d80d-4ded-bcae-c1902e4545d7 | Lathan McKee - FF: Check-In | Madison Aziz |
| 29ba3f10-8358-4649-8707-7c61cb446ab2 | Altus - FF Check-In | Hunter Brayton |
| 3129f25c-8aa2-466d-a217-7daf1dd2f2fd | ISW - Weekly Check-In | Madison Aziz |
| aff9251f-f30d-4b3f-ba40-86221e450e0a | Serval - Weekly Check-In | Allison Troy |
| 55cbe2f9-a52d-45fe-8df1-1b7cf78059b6 | DH - FullFunnel: Weekly Check-In | Madison Aziz |
| 2cda5b8d-c013-47f6-901b-c18a5a5a70a4 | Voxel - Weekly Check-In | Madison Aziz |
| b86b00bc-3981-4697-bf3f-53e10171f57f | Madison Aziz's Personal Room (Suntra) | Madison Aziz |
| 9e136e04-485f-4cef-b1e0-9d6b1adf1744 | Google Calendar Meeting (Laurel) | Hunter Brayton |

### Re-score Steps

1. Test on ONE meeting first (pick any from the list)
2. If successful, run MI|3 on remaining 7
3. Verify in Supabase: all 8 should now have status = 'completed' with real scores
4. Only THEN: Publish MI|3 as active version
5. Monitor next 8h automated cycle for any new failures

### How to Trigger MI|3 for Specific Meetings

Option A: Manually filter in "Read Enriched Meetings" to only fetch these IDs
Option B: Set the meetings back to status = 'enriched' in Supabase, then run MI|3 normally:

```sql
-- Run this in Supabase SQL Editor (PROD: cxrjlmquzhfueqrudiuy)
UPDATE scored_meetings
SET status = 'enriched'
WHERE id IN (
    'bf89b26b-d80d-4ded-bcae-c1902e4545d7',
    '29ba3f10-8358-4649-8707-7c61cb446ab2',
    '3129f25c-8aa2-466d-a217-7daf1dd2f2fd',
    'aff9251f-f30d-4b3f-ba40-86221e450e0a',
    '55cbe2f9-a52d-45fe-8df1-1b7cf78059b6',
    '2cda5b8d-c013-47f6-901b-c18a5a5a70a4',
    'b86b00bc-3981-4697-bf3f-53e10171f57f',
    '9e136e04-485f-4cef-b1e0-9d6b1adf1744'
);
```

Then run MI|3 manually. It will pick up these 8 meetings and re-score them.
After confirming they scored correctly, publish MI|3.

---

## Verification After All Changes

Check in Supabase (PROD):
```sql
-- Should return 0 rows (all re-scored)
SELECT id, topic, status, overall_score
FROM scored_meetings
WHERE status = 'scoring_failed';

-- Should return 8 rows with real scores
SELECT id, topic, overall_score, client_health_score
FROM scored_meetings
WHERE id IN (
    'bf89b26b-d80d-4ded-bcae-c1902e4545d7',
    '29ba3f10-8358-4649-8707-7c61cb446ab2',
    '3129f25c-8aa2-466d-a217-7daf1dd2f2fd',
    'aff9251f-f30d-4b3f-ba40-86221e450e0a',
    '55cbe2f9-a52d-45fe-8df1-1b7cf78059b6',
    '2cda5b8d-c013-47f6-901b-c18a5a5a70a4',
    'b86b00bc-3981-4697-bf3f-53e10171f57f',
    '9e136e04-485f-4cef-b1e0-9d6b1adf1744'
);
```

---

## What NOT to Change

- Do NOT change any other LLM chain prompts (Score Discovery, Score Follow-Up, Score Onboarding, Summarize Internal, Score Internal Enhanced) - they have 0% failure rate
- Do NOT change the Supabase HTTP Request headers yet (anon key swap is parked for later)
- Do NOT change any URLs in n8n nodes
- Do NOT publish MI|3 until test succeeds on at least 1 meeting
