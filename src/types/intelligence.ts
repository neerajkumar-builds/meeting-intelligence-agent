export interface CompanyIntelligence {
  companyName: string;
  generatedAt: string;

  healthPulse: HealthPulse;
  stakeholders: Stakeholder[];
  dealStatus: DealStatus | null;
  csInsights: CSInsights | null;
  riskSignals: RiskSignals;
  openActionItems: ActionItem[];
  competitorMentions: CompetitorMention[];
  meddicGaps: MeddicAnalysis;
}

export interface HealthPulse {
  currentScore: number | null;
  previousScore: number | null;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  dataPoints: { date: string; score: number }[];
}

export interface Stakeholder {
  name: string;
  role: "participant" | "host";
  meetingCount: number;
  lastSeenDate: string;
  firstSeenDate: string;
}

export interface DealStatus {
  latestSentiment: string | null;
  tentativeClosureDate: string | null;
  latestLeadScore: number | null;
  nextActionables: string | null;
  fromMeetingTopic: string | null;
  fromMeetingDate: string | null;
}

export interface RiskSignals {
  churnSignals: RiskSignalItem[];
  expansionSignals: RiskSignalItem[];
}

export interface RiskSignalItem {
  signal: string;
  meetingTopic: string;
  meetingDate: string;
  meetingId: string;
}

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string | null;
  priority: "high" | "medium" | "low" | null;
  context: string | null;
  fromMeetingTopic: string;
  fromMeetingDate: string;
  meetingId: string;
}

export interface CompetitorMention {
  vendor: string;
  count: number;
  meetings: {
    meetingId: string;
    topic: string;
    date: string;
    snippet: string;
  }[];
}

export interface CSInsights {
  latestHealthScore: number | null;
  sentimentScore: number | null;
  expansionLikelihood: string | null;
  escalationRisk: string | null;
  strategicSignals: {
    expansionOpportunity: boolean;
    renewalRisk: boolean;
    stakeholderMisalignment: boolean;
    adoptionConcerns: boolean;
  } | null;
  fromMeetingTopic: string;
  fromMeetingDate: string;
}

export interface MeddicAnalysis {
  dimensions: MeddicDimension[];
  overallCoverage: number;
}

export interface MeddicDimension {
  key: "metrics" | "economic_buyer" | "decision_criteria" | "decision_process" | "identify_pain" | "champion";
  label: string;
  status: "known" | "partial" | "missing";
  evidence: string | null;
  sourceMeetingId: string | null;
  sourceMeetingTopic: string | null;
}
