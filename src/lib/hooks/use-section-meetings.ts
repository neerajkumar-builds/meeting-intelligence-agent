"use client";

import { useSection } from "@/lib/section-context";
import { useMeetingsList, type MeetingsListParams } from "./use-meetings-list";

export function useSectionMeetings(params: Omit<MeetingsListParams, "stageTypes" | "excludeInternal"> = {}) {
  const { stageTypes } = useSection();
  return useMeetingsList({ ...params, stageTypes, excludeInternal: false });
}
