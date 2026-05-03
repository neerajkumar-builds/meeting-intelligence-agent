# Product Team Feedback — Meeting Intelligence

**Sources:** #product_team Slack (April 13-17, 2026), Stephen Barone video clip (April 9, 2026)
**Compiled:** 2026-05-04
**Key People:** Stephen Barone (COO), Luke C (Product), matthewiovanni (CEO), Tyler Williams (Rep/User), Neeraj Kumar (Engineering)

---

## Feedback → CR Mapping

### CR-004: Remove internal meetings (Critical)
| Source | Quote |
|--------|-------|
| Stephen video (00:28) | "Strip everything out of here that isn't disco call related, isn't acquisition related. Take everything that says onboarding, or kickoff, or the other different call types right out of here." |
| Stephen video (00:52) | "I do know that we're gonna have to do some cleanup work on naming conventions." |

### CR-005: Score reason summaries (High)
| Source | Quote |
|--------|-------|
| Stephen video (01:21) | "There's no validation or no reason anywhere on this view that would say, this is an 8 out of 10 ICP fit, and here's why." |
| Stephen video (01:38) | "Tying that connective tissue in here with some high-level information would be helpful. I know we're passing a lot of that on to Slack and into HubSpot, so having at least a snapshot of it in here would be helpful." |
| Stephen video (02:00) | "Anyone looking at this can kind of easily validate, oh, here's the score, and here's why. I think that's more important for this objective than the summary and the coaching." |

### CR-006: Watch recording UX (Medium)
| Source | Quote |
|--------|-------|
| Stephen video (02:27) | "Right now, this watch recording does require that you download the actual Zoom, which I don't think is a great user experience. If we could have this watch recording actually click and open up the Zoom link you can watch in your browser." |
| matthewiovanni Slack (Apr 14) | "Also the Zoom Video in the meetings (like you want to watch the zoom recording) goes to Zoom site and if you are not owner its gated." |

### CR-007: Company Intel panel enhancements (Medium)
| Source | Quote |
|--------|-------|
| Stephen video (03:19) | "This Intel tab, I kind of like this, I just think we would need to refine this a little bit. We might need to provide some more input into this intelligence layer." |
| Stephen video (03:34) | "Put some high-level information on the company. If there were any more information we could put on these stakeholders — title, first name, last name." |
| Stephen video (04:26) | "I do like the side panel, but I also wonder if some of this intel would be better right on the main view, so that people don't accidentally miss it." |

### CR-008: Framework customization MEDDIC/BANT (Medium)
| Source | Quote |
|--------|-------|
| Stephen video (04:00) | "We use BANT, for example, but I think a lot of the clients might have their own little tweaks... the ability to customize the framework — BANT, MEDDIC, whatever it is — I think would be helpful." |

### CR-009: Meeting detail page refinement (High)
| Source | Quote |
|--------|-------|
| Stephen video (04:39) | "I think it's a lot more valuable than these next steps. I think all that stuff will be handled in other apps. The purpose for this is to really determine — was it a good ICP fit? Did the rep do a good job? Was there a positive meeting outcome?" |
| Stephen video (05:01) | "Kind of just rejiggering what you see here on this view, I think, would be helpful." |

### CR-001: Section segmentation — Sales/CSM (Critical)
| Source | Quote |
|--------|-------|
| Stephen video (00:10) | "Types of meetings we're having — meetings that relate to client acquisition, meetings that are CS-related, retention, expansion, service delivery focused." |
| Luke Slack (Apr 17 20:25) | "HubSpot should not be a blocker to adoption. The only functional input from HubSpot is whether a call was with a client or a prospect. We need to rely on naming conventions to identify meeting types anyway. Meeting name should be the primary data point for classification." |
| Luke Slack (Apr 14 23:05) | Shared naming conventions doc "to help differentiate between meetings... this should help us refine the segmentation of meetings moving forward." |

### CR-002: Summarized strengths on rep page (High)
- No direct quote in Slack/video — originated from Luke's compiled change log sheet.

### CR-003: Date range on rep dashboard (Low)
- No direct quote in Slack/video — originated from Luke's compiled change log sheet.

---

## Feedback NOT Mapped to Current CRs

| # | Feedback | Who | Source | Notes |
|---|----------|-----|--------|-------|
| 1 | "Give Dave, Tyler and Jake logins to try and massage this problem" | matthewiovanni | Slack Apr 14 | Need to add more UAT users |
| 2 | Tyler: "call synthesis is directionally cool but struggling with context at times... symptom of building out guidelines of call types" | Tyler Williams | Slack Apr 14 (quoted) | Improves with CR-001 (better meeting type classification) |
| 3 | Tyler: "where is most productive for me to provide call by call feedback of where I think its coming up short?" | Tyler Williams | Slack Apr 14 (quoted) | Needs in-app feedback mechanism — future feature |
| 4 | "If client has HubSpot, send ICP Fit, Rep, Meeting Outcome Scores & Reason back to HubSpot for reference" | Luke | Slack Apr 17 20:52 | Future HubSpot writeback feature |
| 5 | Stephen: "I'm gonna keep playing around with it, hopefully a lot of that core infrastructure is in place and we can easily swap out different things in the UI" | Stephen | Video 05:02 | Confirms UI flexibility is expected |
| 6 | matthewiovanni: "ive been geeking out i love this thing" | matthewiovanni | Slack Apr 14 | Positive adoption signal |

---

## Timeline

- **Apr 9** — Stephen records 5-min video feedback (primary source for CRs 004-009)
- **Apr 13** — Neeraj asks Luke to compile CRs; matthewiovanni suggests adding more UAT users
- **Apr 14** — Luke shares naming conventions doc; consolidates feedback into Change Log sheet; Tyler provides user feedback via matthewiovanni
- **Apr 16** — Stephen filters Change Log to Critical/High priorities and shares ordered list
- **Apr 17** — Luke shares architecture sheet for "Sales Call Analysis Agent"; clarifies HubSpot is not a blocker
- **May 3** — Neeraj sets up dev/prod split, SOP, knowledge system, 10 skills
- **May 4** — CR-004 implementation started
