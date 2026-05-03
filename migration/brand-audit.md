# Brand Audit: Dashboard vs FullFunnel Guidelines

**Audited:** 2026-05-04
**Brand Guide:** `knowledge_base/FullFunnel_Brand Guidelines (1).pdf` (April 2025)

---

## Brand Guidelines Reference

| Element | Specification |
|---------|--------------|
| **Headline font** | Montserrat SemiBold, Sentence or Title Case |
| **Body font** | Montserrat Regular, Sentence Case |
| **Black** | #0A0A0A |
| **White** | #FFFFFF |
| **Light Grey** | #F9F9F9 |
| **Electric Blue** | #146DFA |
| **Logo** | Funnel mark + "FullFunnel" wordmark (min 150px digital) |
| **Imagery** | Minimal icons, bold minimalistic shapes |
| **Personality** | Engaging, Strategic, Efficient, Predictive |

---

## Aligned (No Changes Needed)

| Area | File(s) | Notes |
|------|---------|-------|
| Font family | `layout.tsx`, `globals.css` | Montserrat loaded from Google Fonts, weights 400/500/600/700 |
| Primary color #146DFA | `globals.css` lines 49-52 | Defined as `--color-ff-blue`, used in buttons, sidebar active state, focus borders |
| Black #0A0A0A | `globals.css` | Sidebar, login gradient, dark surfaces |
| Light Grey #F9F9F9 | `globals.css` | Defined as `--color-ff-grey`, light theme backgrounds |
| Logo on login | `login/page.tsx` lines 64-70 | White SVG, 180x30 |
| Logo in sidebar | `app-shell.tsx` lines 47-60, 68-75 | Favicon in header, faded full logo in footer |
| Dark mode | `providers.tsx` | Full system-aware support via next-themes |
| Chart primary | `score-trend-chart.tsx`, `score-distribution-chart.tsx` | Uses #146DFA for main data lines/bars |
| Minimal icons | `sidebar-nav.tsx` | 6 Lucide icons, clean layout |

---

## Gaps (Changes Recommended)

### GAP 1: Stage Type Badges Use Off-Brand Colors
**Severity:** Medium | **File:** `src/lib/constants.ts` lines 12-34

| Stage | Current Color | Brand Compliant? |
|-------|--------------|-----------------|
| Discovery | Tailwind `blue-100/800` | Partial — blue but not #146DFA |
| Follow-Up | Tailwind `purple-100/800` | No — purple is not in brand palette |
| Onboarding | Tailwind `green-100/800` | No — green is not in brand palette |
| Internal | Tailwind `gray-100/800` | Acceptable — close to brand grey |

**Recommendation:** Replace with brand-derived palette:
- Discovery: Electric Blue tint (`bg-[#146DFA]/10 text-[#146DFA]`)
- Follow-Up: Black/dark tint (`bg-[#0A0A0A]/10 text-[#0A0A0A]`)
- Onboarding: Light grey with blue accent
- Internal: Grey (keep as-is)

### GAP 2: Score Indicators Use Semantic Colors
**Severity:** Low | **Files:** `summary-cards.tsx`, `score-badge.tsx`, `insights-panel.tsx`

Uses emerald/yellow/red for high/medium/low scores. These are data visualization colors — industry standard for traffic-light scoring. Acceptable to keep, but could consider:
- High: Electric Blue #146DFA (brand) instead of emerald
- Medium: Light Blue #93b4f5 instead of amber
- Low: Keep red (universal danger signal)

### GAP 3: Chart Off-Brand Colors
**Severity:** Low | **Files:** `health-trend-chart.tsx`, `score-distribution-chart.tsx`

| Chart | Color | Issue |
|-------|-------|-------|
| Health trend line | `#10b981` (emerald) | Not brand color — used semantically for "health" |
| Distribution "needs work" | `#f87171` (red) | Not brand color — used semantically for "low" |
| Distribution "average" | `#93b4f5` (light blue) | Acceptable — derived from brand blue |

**Recommendation:** Consider a blue-based gradient scale instead of traffic light: dark blue → medium blue → light grey. Keeps brand consistency while still showing relative performance.

### GAP 4: Section Labels Use UPPERCASE
**Severity:** Low | **Files:** Various components

Brand guide says "Sentence or Title Case." Dashboard uses `uppercase tracking-wider` for section labels (e.g., "MEETINGS", "AVG SCORE"). This is common in dashboard design and may be intentional for scannability. Worth discussing but not a hard violation.

### GAP 5: No Brand Mark in Favicon
**Severity:** Low | **File:** `public/` directory

Should verify the browser favicon uses the FullFunnel funnel mark, not a generic icon.

---

## Summary

| Category | Status |
|----------|--------|
| Typography (Montserrat) | Fully aligned |
| Primary brand colors | Fully aligned |
| Logo usage | Fully aligned |
| Dark mode | Fully aligned |
| Charts (primary) | Mostly aligned |
| Stage badges | Needs adjustment (purple especially) |
| Score indicators | Acceptable (semantic colors) |
| Text case | Minor deviation |

**Overall:** The dashboard is 85-90% brand compliant. The main actionable gap is replacing the purple Follow-Up badge color with a brand-palette color. The semantic colors (emerald/red for scores) are industry standard and acceptable.
