# Luke's Feedback - Revision 1.1

**Source:** Video clip (05/05/2026) + Architecture sheet reference
**Recorded at:** https://us06web.zoom.us/clips/share/Xa3lNWQ7QK-YKQWXIE04qg
**Transcript:** `change_requests/revision_1/revision 1.1/Luke Criticos's Clip 05_05_2026.vtt`
**Sheet:** FullFunnel - Agent Meeting Score - Architecture & Skeleton.xlsx
**Compiled:** 2026-05-05

---

## Feedback by Page (Sales Section)

### Scorecard

| Item | Luke's Spec | Current State | Data Available |
|------|------------|---------------|----------------|
| KPI Card 1 | Meetings | Meetings | Yes - same |
| KPI Card 2 | Avg ICP Fit Score | Avg Score (overall) | Yes - `icp_score.icp_fit_score` (discovery only, 43/43) |
| KPI Card 3 | Avg Rep Score | Avg Health | Yes - `rep_score.rep_performance_score` (85/85) |
| KPI Card 4 | Hot Deals | At-Risk Accounts | Partial - needs definition (lead_score + deal_sentiment?) |
| Weekly Briefing | Keep, but sales-specific | Generic | Need to filter by section |
| Alerts | Sales-specific only | Shows all (e.g. client health alerts) | Need to filter by section |
| Performance Chart | 3 lines: ICP Score, Rep Score, Meeting Outcome (weekly avg) | Single Score Trend line | Yes for discovery, partial for follow-up |
| Layout | Performance chart ABOVE team section | Charts below team | Reorder |
| Vendor Mentions | From sales meetings only | Should be section-filtered | Verify |
| NEW: Objection Mentions | Alongside vendor mentions | Not implemented | Paragraph in `handling_analysis`, not structured counts |
| NEW: Alignment Mentions | Alongside vendor mentions | Not implemented | No structured data - needs n8n |

**Luke's exact words:**
- "This needs to be meetings, average ICP fit, then average rep score, and then hot deals."
- "Average health... because this is more so for CS. Not something we want to be looking at from this lens in the sales scorecard."
- "Performance, which would be a line graph with 3 lines: ICP fit score, rep score, and meeting outcome score."

### Meetings Feed

| Item | Luke's Spec | Current State |
|------|------------|---------------|
| Content | Only disco + follow-up calls | Should be section-filtered - verify |

**Luke's exact words:**
- "It looks like these are still pulling in client meetings. Under sales meetings, it needs to be just specific to sales."

### Individual Meeting Detail

| Item | Luke's Spec | Current State | Data Available |
|------|------------|---------------|----------------|
| Deal Sentiment | Visible in header area | In Summary tab only | Yes - `meeting_score.deal_sentiment` (discovery only) |
| Score gauges | Meeting Outcome, Rep Performance, ICP Fit | Already correct | Yes |
| Score reasons | Already there | Already implemented (CR-005) | Yes |
| Watch Recording | Keep, note password issue | Already improved (CR-006) | Yes |
| Call Summary | Broken down by BANT | Plain text summary | No - needs n8n to generate BANT breakdown |
| Coaching | 3 strengths, 3 improvements, 3 coaching recs | Shows all in tabs | Yes - just limit display count |
| Objection Handling | Summary of objection handling | Hidden | Yes - `rep_score.handling_analysis` |
| Company Intel | Link discussion | Already has sidebar | Discussion item |

**Luke's exact words:**
- "Score average, and then deal sentiment... it has the score average but it doesn't have deal sentiment. Ideally we have the deal sentiment listed here as well."
- "This deal sentiment should ideally move up to here."
- "Ideally we just summarize these pretty significantly to just be 3 points. 3 strengths, 3 improvements, 3 coaching recommendations."
- "Call summary, ideally this would be broken down by BANT in the summary itself."

### Company Feed

| Item | Luke's Spec | Current State |
|------|------------|---------------|
| Content | Only sales calls | Should be section-filtered - verify |

**Luke's exact words:**
- "IQVIA or existing client calls, so we ideally need to have this limited to only sales calls."

### Individual Company Detail

| Item | Luke's Spec | Current State | Data Available |
|------|------------|---------------|----------------|
| Total Meetings | Keep | Already there | Yes |
| First & Last Meeting | Keep | Already there | Yes |
| ICP Fit Score + Score Summary | Replace Avg Health | Shows Avg Health | Yes - from discovery meetings |
| Deal Sentiment | Add to KPIs | Not in KPIs | Yes - from discovery meetings |
| NEW: Current Status | Needs Follow-Up / Evaluating / Open Opportunity | Not implemented | No field - needs derivation or n8n |
| BANT Summary | On company detail page (not just sidebar) | Only in sidebar | Yes - already computed, just needs display |
| Company Intelligence | Keep - stakeholders, deal sentiment, tools, vendors | Already there | Yes |
| NEW: Objection Mentions | In company intelligence | Not implemented | Paragraph text only |
| NEW: Alignment Mentions | In company intelligence | Not implemented | No structured data |

**Luke's exact words:**
- "Instead of average health, we'd also put deal sentiment."
- "Current status would be good to be representative of: needs follow-up? Is it evaluating? Is it an open opportunity? Analyzing past calls and identifying what stage of the buying journey they are in."
- "Ideally we have the BANT summary on the actual client section."

### Individual Rep Performance

| Item | Luke's Spec | Current State | Data Available |
|------|------------|---------------|----------------|
| Avg Meeting Score | Keep | Already there | Yes |
| vs Team Avg | Keep | Already there | Yes |
| Avg Health | REMOVE (CS metric) | Shows Avg Health | Remove |
| Best/Worst Call | Keep, sales-specific | Already there | Yes |
| NEW: Avg Rep Score | Separate KPI | Not separate | Yes - `rep_performance_score` |
| NEW: Avg Meeting Outcome | Separate KPI | Not separate | Yes - `lead_score` / `engagement_score` |
| NEW: Avg ICP Fit | Separate KPI | Not shown | Yes - discovery only |
| Score Trend | Keep | Already there | Yes |
| Meeting Types Donut | Replace with ICP Fit Pie Chart | Meeting Types donut | Yes - but definition unclear |
| Coaching | 3+3+3 + objection handling | Shows 5+5 | Yes |
| NEW: Companies by Status | Follow-Up / Evaluating / Open Opportunity | Not implemented | Blocked by pipeline status |
| Meetings List | Keep with filters | Already there | Yes |

**Luke's exact words:**
- "We don't need average health, because health is specific to existing clients."
- "We need to have average rep score, average meeting score, average ICP fit score."
- "Average rep score line graph, ICP fit pie chart... ideally we have an ICP fit pie chart here, instead of meeting types."
- "Coaching insights needs to be summarized again: 3 strengths, 3 improvements, 3 coaching recommendations, and then summary of objection handling."
- "It would be good to have a list of companies in terms of the status they're in, and have the ability to filter by those companies."

### General Suggestion

**Luke's exact words:**
- "I don't know if we want to hide these two sections (CS, Internal) and the All section and just keep it specific to sales meeting intelligence."
- "We can probably discuss that on the call later today."

---

## Questions for Call (Need Clarity)

1. **Hot Deals criteria** - what makes a deal "hot"? High lead_score + positive sentiment + closure date?
2. **ICP Fit averaging** - discovery meetings only (43) or include follow-ups with no ICP data?
3. **3-line chart "Meeting Outcome"** - combine lead_score (discovery) with engagement_score (follow-up)?
4. **Pipeline status** - derive from existing data with rules, or add to n8n scoring prompt?
5. **Per-meeting BANT summary** - priority? Needs n8n pipeline change.
6. **Hide CS/Internal sections** - remove entirely or just de-emphasize?
7. **ICP Fit pie chart** - score bands (high/medium/low) or sub-scores (title/industry/size)?
8. **Objection/alignment mentions** - need structured counts from n8n, or extract from text?

---

## What Can Be Implemented Immediately (No Ambiguity)

1. Move deal sentiment to meeting detail header
2. Coaching 3+3+3 on meeting detail
3. Add objection handling summary to meeting detail
4. Remove Avg Health from rep page and scorecard (Sales section)
5. Verify section filtering on all pages
6. BANT summary on company detail page (already computed, just display)
