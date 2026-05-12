"use client";

import { use, useEffect } from "react";
import Image from "next/image";
import { useMeetingDetail } from "@/lib/hooks/use-meeting-detail";
import { formatDateTime, formatDuration, formatScore } from "@/lib/utils/format";
import { getStageLabel } from "@/lib/utils/stage";
import {
  type InternalSummary,
} from "@/types/scores";

export default function PrintReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: meeting, isLoading } = useMeetingDetail(id);

  useEffect(() => {
    if (meeting && !isLoading) {
      // Small delay to allow render, then trigger print
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [meeting, isLoading]);

  if (isLoading || !meeting) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading report...</div>
    );
  }

  const ms = meeting.meeting_score as Record<string, unknown> | null;
  const rs = meeting.rep_score as Record<string, unknown> | null;
  const is = meeting.internal_summary as InternalSummary | null;

  return (
    <div className="max-w-3xl mx-auto p-8 print:p-0 bg-white text-black print:text-black">
      <style>{`
        @media print {
          nav, aside, header, footer, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#146DFA]">
        <div>
          <Image src="/fullfunnel-logo.svg" alt="FullFunnel" width={140} height={22} />
          <p className="text-xs text-gray-500 mt-1">Meeting Intelligence Report</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Generated {new Date().toLocaleDateString()}</p>
          <p>v1.0.0</p>
        </div>
      </div>

      {/* Meeting Info */}
      <h1 className="text-xl font-semibold mb-2">{meeting.topic ?? "Untitled Meeting"}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
        <span>Rep: {meeting.host_name ?? "Unknown"}</span>
        {meeting.company_name && <span>Company: {meeting.company_name}</span>}
        {meeting.primary_participant_name && (
          <span>Contact: {meeting.primary_participant_name}</span>
        )}
        <span>{formatDateTime(meeting.start_time)}</span>
        {meeting.duration_minutes && (
          <span>{formatDuration(meeting.duration_minutes)}</span>
        )}
      </div>

      {/* Scores */}
      <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-3xl font-bold text-[#146DFA]">
            {formatScore(meeting.overall_score)}
          </p>
          <p className="text-xs text-gray-500">Overall Score</p>
        </div>
        <div className="border-l border-gray-200" />
        <div className="text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Stage</p>
          <p className="text-sm font-semibold">
            {getStageLabel(meeting.scoring_stage_type)}
          </p>
        </div>
        {ms && (
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Primary Score</p>
            <p className="text-sm font-semibold">
              {formatScore(
                (ms as Record<string, unknown>).lead_score as number ??
                (ms as Record<string, unknown>).engagement_score as number ??
                (ms as Record<string, unknown>).delivery_score as number ??
                (ms as Record<string, unknown>).meeting_quality_score as number ??
                null
              )}
            </p>
          </div>
        )}
        {rs && (
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Rep Score</p>
            <p className="text-sm font-semibold">
              {formatScore((rs.rep_performance_score as number) ?? null)}
            </p>
          </div>
        )}
        {meeting.client_health_score !== null && (
          <div className="text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Health</p>
            <p className="text-sm font-semibold">
              {formatScore(meeting.client_health_score)}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2 pb-1 border-b">Summary</h2>
        <p className="text-sm leading-relaxed">
          {meeting.meeting_summary ?? "No summary available."}
        </p>
      </section>

      {/* Coaching (if available) */}
      {rs && meeting.scoring_stage_type !== "internal" && meeting.scoring_stage_type !== "internal_client_meeting" && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2 pb-1 border-b">Coaching</h2>
          {(rs.strengths as string) && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500">Strengths</p>
              <p className="text-sm leading-relaxed">{rs.strengths as string}</p>
            </div>
          )}
          {(rs.areas_for_improvement as string) && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500">Areas for Improvement</p>
              <p className="text-sm leading-relaxed">{rs.areas_for_improvement as string}</p>
            </div>
          )}
          {(rs.coaching_recommendations as string) && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500">Coaching Recommendations</p>
              <p className="text-sm leading-relaxed">{rs.coaching_recommendations as string}</p>
            </div>
          )}
        </section>
      )}

      {/* Action Items (internal) */}
      {is?.action_items && is.action_items.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2 pb-1 border-b">Action Items</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="pb-1 pr-3">Action</th>
                <th className="pb-1 pr-3">Owner</th>
                <th className="pb-1 pr-3">Priority</th>
                <th className="pb-1">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {is.action_items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3 text-sm">{item.action}</td>
                  <td className="py-1.5 pr-3 text-sm font-medium">{item.owner}</td>
                  <td className="py-1.5 pr-3 text-xs">{item.priority ?? "-"}</td>
                  <td className="py-1.5 text-xs">{item.deadline ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-xs text-gray-400 flex justify-between">
        <span>FullFunnel Meeting Intelligence</span>
        <span>Confidential - Internal Use Only</span>
      </div>

      {/* Back button (hidden in print) */}
      <div className="mt-6 no-print">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-[#146DFA] hover:underline"
        >
          Back to meeting
        </button>
      </div>
    </div>
  );
}
