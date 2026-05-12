"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, GraduationCap, ListChecks, Gavel, Users, Lightbulb, CircleHelp, Scale } from "lucide-react";
import type { ScoringStageType } from "@/lib/constants";
import type {
  DiscoveryMeetingScore,
  FollowUpMeetingScore,
  OnboardingMeetingScore,
  InternalSummary,
} from "@/types/scores";
import { MeetingNotes, useMeetingNotes } from "./meeting-notes";

interface IntelligenceTabsProps {
  stageType: ScoringStageType | null;
  meetingId: string;
  meetingSummary: string | null;
  meetingScore: unknown;
  repScore: unknown;
  internalSummary: unknown;
}

// Sentiment keywords to color mapping
const SENTIMENT_COLORS: Record<string, string> = {
  accelerating: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  positive: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  healthy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  neutral: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  passive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "needs attention": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  declining: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "at risk": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  stalled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function getSentimentClass(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const [key, cls] of Object.entries(SENTIMENT_COLORS)) {
    if (lower.includes(key)) return cls;
  }
  return null;
}

// Colored left accent borders for coaching + internal cards
const ACCENT_BORDERS: Record<string, string> = {
  emerald: "border-l-4 border-l-emerald-400 dark:border-l-emerald-600",
  amber: "border-l-4 border-l-amber-400 dark:border-l-amber-600",
  red: "border-l-4 border-l-red-400 dark:border-l-red-600",
  blue: "border-l-4 border-l-blue-400 dark:border-l-blue-600",
  purple: "border-l-4 border-l-purple-400 dark:border-l-purple-600",
  indigo: "border-l-4 border-l-indigo-400 dark:border-l-indigo-600",
};

/** Replace em dashes with spaced hyphens - display only, never modifies source data */
function cleanText(text: string): string {
  return text.replace(/\u2014/g, " - ").replace(/ -/g, " - ");
}

// Detect numbered lists like "1. First 2. Second" (with or without newlines)
function isNumberedList(text: string): boolean {
  // Must start with "1." or "1)" and have at least a "2." or "2)" somewhere
  return /^\s*1[\.\)]\s/.test(text) && /2[\.\)]\s/.test(text);
}

function parseNumberedList(text: string): string[] {
  return text
    .split(/\s*(?=\d+[\.\)]\s)/)
    .filter((s) => s.trim().length > 0)
    .map((s) => s.replace(/^\d+[\.\)]\s+/, "").trim());
}

function TextBlock({ label, text, icon, sentiment, accent }: { label: string; text: string | null | undefined; icon?: React.ReactNode; sentiment?: boolean; accent?: "emerald" | "amber" | "red" | "blue" | "purple" | "indigo" }) {
  if (!text) return null;
  const clean = cleanText(text);
  const sentimentClass = sentiment ? getSentimentClass(clean) : null;
  const accentClass = accent ? ACCENT_BORDERS[accent] ?? "" : "";

  return (
    <div className={`rounded-lg border bg-card p-4 ${accentClass}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-semibold">{label}</h4>
        {sentimentClass && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sentimentClass}`}>
            {clean}
          </span>
        )}
      </div>
      {!sentimentClass && (
        isNumberedList(clean)
          ? <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              {parseNumberedList(clean).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          : <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{clean}</p>
      )}
    </div>
  );
}

function ListBlock({ label, items, icon, variant }: { label: string; items: string[] | undefined; icon?: React.ReactNode; variant?: "risk" | "positive" | "questions" }) {
  if (!items || items.length === 0) return null;
  const borderClass =
    variant === "risk" ? "border-red-200 dark:border-red-900" :
    variant === "positive" ? "border-emerald-200 dark:border-emerald-900" :
    variant === "questions" ? "border-l-4 border-l-amber-400 dark:border-l-amber-600 border-amber-200 dark:border-amber-900" :
    "";
  const dotClass =
    variant === "risk" ? "bg-red-400" :
    variant === "positive" ? "bg-emerald-400" :
    variant === "questions" ? "bg-amber-400" :
    "bg-primary/60";
  const labelClass =
    variant === "risk" ? "text-red-600 dark:text-red-400" :
    variant === "positive" ? "text-emerald-600 dark:text-emerald-400" :
    variant === "questions" ? "text-amber-600 dark:text-amber-400" :
    "";

  return (
    <div className={`rounded-lg border bg-card p-4 ${borderClass}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className={`text-sm font-semibold ${labelClass}`}>{label}</h4>
        <span className="text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass} mt-1.5 shrink-0`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IntelligenceTabs({
  stageType,
  meetingId,
  meetingSummary,
  meetingScore,
  repScore,
  internalSummary,
}: IntelligenceTabsProps) {
  const tabs = getTabs(stageType);
  const { notes, refetch } = useMeetingNotes(meetingId);

  return (
    <Tabs defaultValue="summary">
      <TabsList>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="summary">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm whitespace-pre-wrap">
              {meetingSummary ?? "No summary available."}
            </p>
            {stageType === "discovery_scoping" && (
              <DiscoverySummaryDetails
                ms={meetingScore as DiscoveryMeetingScore | null}
              />
            )}
            {stageType === "follow_up" && (
              <FollowUpSummaryDetails
                ms={meetingScore as FollowUpMeetingScore | null}
              />
            )}
            {(stageType === "onboarding" || stageType === "client_meeting") && (
              <OnboardingSummaryDetails
                ms={meetingScore as OnboardingMeetingScore | null}
              />
            )}
            {(stageType === "internal" || stageType === "internal_client_meeting") && (
              <InternalSummaryDetails
                is={internalSummary as InternalSummary | null}
              />
            )}
            <MeetingNotes meetingId={meetingId} section="summary" allNotes={notes} onNoteAdded={refetch} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="coaching">
        <Card>
          <CardContent className="p-4">
            <CoachingContent stageType={stageType} repScore={repScore} />
            <MeetingNotes meetingId={meetingId} section="coaching" allNotes={notes} onNoteAdded={refetch} />
          </CardContent>
        </Card>
      </TabsContent>

      {(stageType === "internal" || stageType === "internal_client_meeting") && (
        <>
          <TabsContent value="actions">
            <Card>
              <CardContent className="p-4">
                <ActionItemsList
                  items={(internalSummary as InternalSummary | null)?.action_items}
                />
                <MeetingNotes meetingId={meetingId} section="actions" allNotes={notes} onNoteAdded={refetch} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="decisions">
            <Card>
              <CardContent className="p-4">
                <DecisionsList
                  decisions={(internalSummary as InternalSummary | null)?.decisions_made}
                />
                <MeetingNotes meetingId={meetingId} section="decisions" allNotes={notes} onNoteAdded={refetch} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clients">
            <Card>
              <CardContent className="p-4">
                <ClientRefsList
                  refs={(internalSummary as InternalSummary | null)?.client_references}
                />
                <MeetingNotes meetingId={meetingId} section="clients" allNotes={notes} onNoteAdded={refetch} />
              </CardContent>
            </Card>
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

function getTabs(stageType: ScoringStageType | null) {
  const base = [
    { value: "summary", label: "Summary", icon: FileText },
    { value: "coaching", label: "Coaching", icon: GraduationCap },
  ];
  if (stageType === "internal" || stageType === "internal_client_meeting") {
    return [
      ...base,
      { value: "actions", label: "Action Items", icon: ListChecks },
      { value: "decisions", label: "Decisions", icon: Gavel },
      { value: "clients", label: "Client Refs", icon: Users },
    ];
  }
  return base;
}

function DiscoverySummaryDetails({ ms }: { ms: DiscoveryMeetingScore | null }) {
  if (!ms) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Deal Sentiment" text={ms.deal_sentiment} sentiment />
      {ms.tentative_closure_date && (
        <TextBlock label="Tentative Close" text={ms.tentative_closure_date} />
      )}
    </div>
  );
}

function FollowUpSummaryDetails({ ms }: { ms: FollowUpMeetingScore | null }) {
  if (!ms) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Relationship Health" text={ms.relationship_health} sentiment />
      <ListBlock label="Expansion Signals" items={ms.expansion_signals} variant="positive" />
      <ListBlock label="Churn Risk Signals" items={ms.churn_risk_signals} variant="risk" />
    </div>
  );
}

function OnboardingSummaryDetails({ ms }: { ms: OnboardingMeetingScore | null }) {
  if (!ms) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Delivery Status" text={ms.delivery_status} sentiment />
      <TextBlock label="Current Phase" text={ms.current_phase} />
      <TextBlock label="Progress" text={ms.project_progress} />
      <ListBlock label="Blockers" items={ms.blockers} variant="risk" />
      <ListBlock label="Milestones" items={ms.milestones_discussed} variant="positive" />
    </div>
  );
}

function InternalSummaryDetails({ is: intSummary }: { is: InternalSummary | null }) {
  if (!intSummary) return null;
  return (
    <div className="mt-4 space-y-2">
      {intSummary.summary?.headline && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="text-base font-semibold leading-snug">{intSummary.summary.headline}</h4>
        </div>
      )}
      <TextBlock
        label="Key Insight"
        text={intSummary.quality?.key_insight}
        accent="indigo"
        icon={<Lightbulb className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />}
      />
      <ListBlock label="Key Topics" items={intSummary.summary?.key_topics} />
      <ListBlock
        label="Open Questions"
        items={intSummary.open_questions}
        variant="questions"
        icon={<CircleHelp className="h-4 w-4 text-amber-500 dark:text-amber-400" />}
      />
    </div>
  );
}

function CoachingContent({
  stageType,
  repScore,
}: {
  stageType: ScoringStageType | null;
  repScore: unknown;
}) {
  if (!repScore || stageType === "internal" || stageType === "internal_client_meeting") {
    return <p className="text-sm text-muted-foreground">No coaching data for this meeting type.</p>;
  }

  const rs = repScore as {
    strengths?: string;
    areas_for_improvement?: string;
    blind_spots?: string;
    coaching_recommendations?: string;
    handling_analysis?: string;
    deal_progression_assessment?: string;
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <TextBlock
        label="Strengths"
        text={rs.strengths}
        accent="emerald"
        icon={<span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">+</span>}
      />
      <TextBlock
        label="Areas for Improvement"
        text={rs.areas_for_improvement}
        accent="amber"
        icon={<span className="h-5 w-5 rounded bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>}
      />
      <TextBlock
        label="Coaching Recommendations"
        text={rs.coaching_recommendations}
        accent="blue"
        icon={<span className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">C</span>}
      />
      {rs.handling_analysis && (
        <TextBlock
          label="Objection Handling"
          text={rs.handling_analysis}
          accent="indigo"
          icon={<span className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">O</span>}
        />
      )}
    </div>
  );
}

const PRIORITY_BORDERS: Record<string, string> = {
  high: "border-l-4 border-l-red-400 dark:border-l-red-600",
  medium: "border-l-4 border-l-amber-400 dark:border-l-amber-600",
  low: "border-l-4 border-l-gray-300 dark:border-l-gray-600",
};

function ActionItemsList({
  items,
}: {
  items: InternalSummary["action_items"];
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No action items recorded.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className={`rounded-lg border p-3 ${item.priority ? PRIORITY_BORDERS[item.priority] ?? "" : ""}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {item.owner}
            </span>
            {item.priority && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  item.priority === "high"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    : item.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {item.priority}
              </span>
            )}
            {item.deadline && (
              <span className="text-xs text-muted-foreground">
                Due: {item.deadline}
              </span>
            )}
          </div>
          <p className="text-sm">{item.action}</p>
          {item.context && (
            <p className="text-xs text-muted-foreground mt-1">{item.context}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DecisionsList({
  decisions,
}: {
  decisions: InternalSummary["decisions_made"];
}) {
  if (!decisions || decisions.length === 0) {
    return <p className="text-sm text-muted-foreground">No decisions recorded.</p>;
  }
  return (
    <div className="space-y-3">
      {decisions.map((d, i) => (
        <div key={i} className="rounded-lg border p-3 border-l-4 border-l-indigo-400 dark:border-l-indigo-600">
          <div className="flex items-start gap-2">
            <Scale className="h-4 w-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{d.decision}</p>
          </div>
          {d.rationale && (
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              {d.rationale}
            </p>
          )}
          {d.impact && (
            <span className="inline-block text-xs mt-2 ml-6 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
              Impact: {d.impact}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ClientRefsList({
  refs,
}: {
  refs: InternalSummary["client_references"];
}) {
  if (!refs || refs.length === 0) {
    return <p className="text-sm text-muted-foreground">No client references.</p>;
  }

  const sentimentColors: Record<string, string> = {
    positive: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    concern: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    at_risk: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const sentimentBorders: Record<string, string> = {
    positive: "border-l-4 border-l-emerald-400 dark:border-l-emerald-600",
    neutral: "border-l-4 border-l-gray-300 dark:border-l-gray-600",
    negative: "border-l-4 border-l-red-400 dark:border-l-red-600",
    concern: "border-l-4 border-l-yellow-400 dark:border-l-yellow-600",
    at_risk: "border-l-4 border-l-red-400 dark:border-l-red-600",
  };

  return (
    <div className="space-y-3">
      {refs.map((ref, i) => (
        <div key={i} className={`rounded-lg border p-3 ${ref.sentiment ? sentimentBorders[ref.sentiment] ?? "" : ""} ${ref.action_needed ? "bg-red-50/50 dark:bg-red-950/30" : ""}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{ref.client_name}</span>
            {ref.sentiment && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${sentimentColors[ref.sentiment] ?? sentimentColors.neutral}`}
              >
                {ref.sentiment}
              </span>
            )}
            {ref.action_needed && (
              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5 rounded">
                Action Needed
              </span>
            )}
          </div>
          {ref.context && (
            <p className="text-xs text-muted-foreground">{ref.context}</p>
          )}
        </div>
      ))}
    </div>
  );
}
