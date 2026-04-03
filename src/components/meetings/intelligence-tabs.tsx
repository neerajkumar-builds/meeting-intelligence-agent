"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { ScoringStageType } from "@/lib/constants";
import type {
  DiscoveryMeetingScore,
  DiscoveryRepScore,
  FollowUpMeetingScore,
  FollowUpRepScore,
  OnboardingMeetingScore,
  OnboardingRepScore,
  InternalSummary,
} from "@/types/scores";

interface IntelligenceTabsProps {
  stageType: ScoringStageType | null;
  meetingSummary: string | null;
  meetingScore: unknown;
  repScore: unknown;
  internalSummary: unknown;
}

function TextBlock({ label, text, icon }: { label: string; text: string | null | undefined; icon?: React.ReactNode }) {
  if (!text) return null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-semibold">{label}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function ListBlock({ label, items, icon }: { label: string; items: string[] | undefined; icon?: React.ReactNode }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-semibold">{label}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IntelligenceTabs({
  stageType,
  meetingSummary,
  meetingScore,
  repScore,
  internalSummary,
}: IntelligenceTabsProps) {
  const tabs = getTabs(stageType);

  return (
    <Tabs defaultValue="summary">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
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
            {stageType === "onboarding" && (
              <OnboardingSummaryDetails
                ms={meetingScore as OnboardingMeetingScore | null}
              />
            )}
            {stageType === "internal" && (
              <InternalSummaryDetails
                is={internalSummary as InternalSummary | null}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="coaching">
        <Card>
          <CardContent className="p-4">
            <CoachingContent stageType={stageType} repScore={repScore} />
          </CardContent>
        </Card>
      </TabsContent>

      {stageType === "internal" && (
        <>
          <TabsContent value="actions">
            <Card>
              <CardContent className="p-4">
                <ActionItemsList
                  items={(internalSummary as InternalSummary | null)?.action_items}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="decisions">
            <Card>
              <CardContent className="p-4">
                <DecisionsList
                  decisions={(internalSummary as InternalSummary | null)?.decisions_made}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clients">
            <Card>
              <CardContent className="p-4">
                <ClientRefsList
                  refs={(internalSummary as InternalSummary | null)?.client_references}
                />
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
    { value: "summary", label: "Summary" },
    { value: "coaching", label: "Coaching" },
  ];
  if (stageType === "internal") {
    return [
      ...base,
      { value: "actions", label: "Action Items" },
      { value: "decisions", label: "Decisions" },
      { value: "clients", label: "Client Refs" },
    ];
  }
  return base;
}

function DiscoverySummaryDetails({ ms }: { ms: DiscoveryMeetingScore | null }) {
  if (!ms) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Deal Sentiment" text={ms.deal_sentiment} />
      <TextBlock label="Next Steps" text={ms.next_actionables} />
      <TextBlock label="Reasoning" text={ms.reasoning_summary} />
    </div>
  );
}

function FollowUpSummaryDetails({ ms }: { ms: FollowUpMeetingScore | null }) {
  if (!ms) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Relationship Health" text={ms.relationship_health} />
      <ListBlock label="Expansion Signals" items={ms.expansion_signals} />
      <ListBlock label="Churn Risk Signals" items={ms.churn_risk_signals} />
      <TextBlock label="Reasoning" text={ms.reasoning_summary} />
    </div>
  );
}

function OnboardingSummaryDetails({ ms }: { ms: OnboardingMeetingScore | null }) {
  if (!ms) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Delivery Status" text={ms.delivery_status} />
      <TextBlock label="Current Phase" text={ms.current_phase} />
      <TextBlock label="Progress" text={ms.project_progress} />
      <ListBlock label="Blockers" items={ms.blockers} />
      <ListBlock label="Milestones" items={ms.milestones_discussed} />
    </div>
  );
}

function InternalSummaryDetails({ is: intSummary }: { is: InternalSummary | null }) {
  if (!intSummary) return null;
  return (
    <div className="mt-4 space-y-2">
      <TextBlock label="Headline" text={intSummary.summary?.headline} />
      <TextBlock label="Key Insight" text={intSummary.quality?.key_insight} />
      <ListBlock label="Key Topics" items={intSummary.summary?.key_topics} />
      <ListBlock label="Open Questions" items={intSummary.open_questions} />
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
  if (!repScore || stageType === "internal") {
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
        icon={<span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">+</span>}
      />
      <TextBlock
        label="Areas for Improvement"
        text={rs.areas_for_improvement}
        icon={<span className="h-5 w-5 rounded bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>}
      />
      {rs.blind_spots && (
        <TextBlock
          label="Blind Spots"
          text={rs.blind_spots}
          icon={<span className="h-5 w-5 rounded bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold">?</span>}
        />
      )}
      <TextBlock
        label="Coaching Recommendations"
        text={rs.coaching_recommendations}
        icon={<span className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">C</span>}
      />
      {rs.handling_analysis && (
        <TextBlock label="Objection Handling" text={rs.handling_analysis} />
      )}
      {rs.deal_progression_assessment && (
        <TextBlock label="Deal Progression" text={rs.deal_progression_assessment} />
      )}
    </div>
  );
}

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
        <div key={i} className="rounded-lg border p-3">
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
        <div key={i} className="rounded-lg border p-3">
          <p className="text-sm font-medium">{d.decision}</p>
          {d.rationale && (
            <p className="text-xs text-muted-foreground mt-1">
              Rationale: {d.rationale}
            </p>
          )}
          {d.impact && (
            <p className="text-xs text-muted-foreground mt-1">
              Impact: {d.impact}
            </p>
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

  return (
    <div className="space-y-3">
      {refs.map((ref, i) => (
        <div key={i} className="rounded-lg border p-3">
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
