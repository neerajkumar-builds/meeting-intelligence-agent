# Architecture Vision: Section-Based Dashboard

**Source:** Luke C's architecture sheet (shared Apr 17 in #product_team), Stephen's video (Apr 9), Neeraj's clarification (May 4)
**Last Updated:** 2026-05-04

---

## Core Concept

The dashboard evolves from a flat navigation to a **section-based architecture** where each section represents a meeting analysis module. Each section contains the same 5 pages (Scorecard, Meetings, Companies, Reps, Ask Blarney) filtered to its meeting types.

```
Sidebar
├── Sales Call Analysis              ← discovery_scoping + follow_up
│   ├── Scorecard (landing page)
│   ├── Meetings (feed → individual)
│   ├── Companies (feed → individual)
│   ├── Reps (feed → individual)
│   └── Ask Blarney (scoped to section data)
│
├── Customer Success Analysis        ← onboarding + check_in (future)
│   ├── Scorecard
│   ├── Meetings
│   ├── Companies
│   ├── Reps
│   └── Ask Blarney
│
├── Internal Call Analysis           ← internal (future)
│   └── ...same structure
```

## Key Design Principles

1. **Component reuse:** Same Scorecard, Meetings, Companies, Reps, Ask Blarney components — filtered differently per section
2. **Section = preset filter:** Each section maps to a set of `scoring_stage_type` values
3. **Role-based access (future):** Salespeople → Sales Call Analysis only. CS → Customer Success only. PMs → Internal. Leadership → all sections.
4. **Ask Blarney scoped per section:** RAG search should be filtered to the section's meeting types for more focused, relevant answers
5. **Modular for selling:** Sections can be sold separately or collectively to clients

## Page-Level Specifications (from Luke's sheet)

### Scorecard (Section Landing Page)
- KPI Cards: Meetings | Avg ICP Score | Avg Rep Score | Hot Deals
- Weekly Briefing & Alerts
- Performance Chart: 3 lines — ICP Score (Weekly Avg), Rep Score (Weekly Avg), Meeting Outcome (Weekly Avg)
- Team Performance table
- Intelligence: Tools & Vendor Mentions, Objection Mentions, Alignment Mentions
- Note: "We should be able to filter the above data"

### Individual Meeting Detail
- Score Average | Deal Sentiment
- Meeting Outcome | Rep Performance | ICP Fit (scores)
- Meeting Outcome Reason | Rep Performance Reason | ICP Fit Reason (score explanations)
- Watch Recording (NOT DOWNLOAD VIDEO)
- Call Summary (summarized, broken down into BANT)
- Coaching: Summarized (3 Strengths, 3 Improvements, 3 Coaching Recommendations, Summary of objection handling)
- Link to Company & Company Intelligence

### Individual Company Detail
- Total Meetings | First & Last Meeting | ICP Fit Score + Score Summary | Deal Sentiment
- Current Status (Needs Follow-Up, Evaluating, Open Opportunity)
- BANT Summary
- Company Intelligence: Stakeholders, Deal Sentiment, Tools & Vendor Mentions, Objection Mentions, Alignment Mentions, Competitors

### Individual Rep Performance
- Avg Meeting Score | vs Team Avg | Avg Rep Score | Avg Meeting Outcome | Avg ICP Fit | Best & Worst Call
- Avg Rep Score Line Graph | ICP Fit Pie Chart
- Coaching Insight: Summarized (3 Strengths, 3 Improvements, 3 Coaching Recommendations, Summary of objection handling)
- Companies in current status (Needs Follow-Up, Evaluating, Open Opportunity) - List Companies
- List of Meetings (same filter functionality as meetings feed)

### Feeds (Meetings, Companies, Reps)
- "Can stay as is, obviously just specific to Disco & Follow-Up" for Sales Call Analysis

## Routing Strategy (Recommended)

Use Next.js route groups for section isolation:
```
src/app/
  (sales)/           ← Sales Call Analysis section
    layout.tsx       ← injects section context (stage_types filter)
    page.tsx         ← Scorecard
    meetings/
    companies/
    reps/
    search/          ← Ask Blarney (scoped)
  (cs)/              ← Customer Success section (future)
    layout.tsx
    ...same pages
```

URLs become: `/sales/`, `/sales/meetings`, `/cs/`, `/cs/meetings`
Shareable, bookmarkable, and gateable for role-based access.

## Relationship to CRs

CRs 002-009 build the individual features that will live inside this architecture:
- CR-004: Internal meeting exclusion → foundation for section filtering
- CR-005: Score reasons → "Meeting Outcome Reason | Rep Performance Reason | ICP Fit Reason"
- CR-009: Meeting detail declutter → matches the streamlined individual meeting spec
- CR-006: Watch recording → "NOT DOWNLOAD VIDEO"
- CR-002: Rep summarized coaching → "3 Strengths, 3 Improvements, 3 Coaching Recommendations"
- CR-003: Date range on rep page → filter functionality
- CR-007: Intel panel visibility → "Link to Company & Company Intelligence"
- CR-008: MEDDIC/BANT customization → "BANT Summary" on company page
- CR-001: Section segmentation → the sidebar restructuring itself (last, needs n8n)

## Ask Blarney: Scoped Per Section

Per Neeraj's direction: Ask Blarney should be scoped to each section's meeting types. This means:
- Sales section Ask Blarney only has RAG context from discovery + follow_up meetings
- CS section only from onboarding + check_in
- Leadership can access a global Ask Blarney (all sections)

This improves answer quality (more focused context) and respects data boundaries for role-based access.
