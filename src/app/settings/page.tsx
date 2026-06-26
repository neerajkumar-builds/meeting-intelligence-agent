"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSection } from "@/lib/section-context";
import { SECTIONS, DIGESTS_PAUSED, type SectionKey } from "@/lib/constants";
import { Bell, BellOff, Hash, Mail, MessageSquare, Save, Check, PauseCircle } from "lucide-react";
import { toast } from "sonner";

interface NotificationPref {
  id?: number;
  section: SectionKey;
  channel: "slack" | "email";
  frequency: "realtime" | "hourly" | "daily" | "weekly" | "off";
  is_active: boolean;
  thresholds: { low_score: number; health_drop: number };
}

const CHANNEL_NAMES: Record<string, string> = {
  sales: "#mi-sales",
  cs: "#mi-cs",
  internal: "#mi-internal",
};

const FREQUENCY_OPTIONS = [
  { value: "realtime", label: "Real-time" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly summary" },
  { value: "off", label: "Off" },
];

const DEFAULT_PREFS: Record<string, NotificationPref> = {
  sales: { section: "sales", channel: "slack", frequency: "daily", is_active: true, thresholds: { low_score: 5, health_drop: 2 } },
  cs: { section: "cs", channel: "slack", frequency: "daily", is_active: true, thresholds: { low_score: 5, health_drop: 2 } },
  internal: { section: "internal", channel: "slack", frequency: "weekly", is_active: true, thresholds: { low_score: 5, health_drop: 2 } },
};

export default function SettingsPage() {
  const { isAdmin, isRoleLoaded, allowedSections } = useSection();
  const [prefs, setPrefs] = useState<Record<string, NotificationPref>>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) return;
      const data = await res.json();
      const loaded = { ...DEFAULT_PREFS };
      for (const p of data.preferences) {
        if (loaded[p.section]) {
          loaded[p.section] = {
            ...loaded[p.section],
            ...p,
            thresholds: p.thresholds ?? loaded[p.section].thresholds,
          };
        }
      }
      setPrefs(loaded);
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRoleLoaded) loadPrefs();
  }, [isRoleLoaded, loadPrefs]);

  async function savePref(section: string) {
    const pref = prefs[section];
    setSaving(section);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: pref.section,
          channel: pref.channel,
          frequency: pref.frequency === "off" ? "daily" : pref.frequency,
          is_active: pref.frequency !== "off",
          thresholds: pref.thresholds,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(section);
      toast.success(`${SECTIONS[section as SectionKey]?.shortLabel} notifications updated`);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(null);
    }
  }

  function updatePref(section: string, field: string, value: unknown) {
    setPrefs((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  function updateThreshold(section: string, field: string, value: number) {
    setPrefs((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        thresholds: { ...prev[section].thresholds, [field]: value },
      },
    }));
  }

  if (!isRoleLoaded) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const sections = (["sales", "cs", "internal"] as const).filter(
    (s) => allowedSections.includes(s) || allowedSections.includes("all")
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Control how Prism reaches you"
      />

      {DIGESTS_PAUSED && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <PauseCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Scheduled Slack digests are paused.</p>
            <p className="mt-0.5">
              Automatic digests to #mi-sales, #mi-cs, and #mi-internal are paused
              for cost efficiency. The preferences below are saved but will not
              send any notifications until digests resume.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)
        ) : (
          sections.map((section) => {
            const pref = prefs[section];
            const config = SECTIONS[section];
            const isOff = pref.frequency === "off" || !pref.is_active;
            const channelName = CHANNEL_NAMES[section];
            const isSaving = saving === section;
            const isSaved = saved === section;

            return (
              <Card key={section} className={isOff ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isOff ? "bg-muted" : "bg-[#146DFA]/10"
                      }`}>
                        {isOff ? (
                          <BellOff className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Bell className="h-5 w-5 text-[#146DFA]" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{config.label}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{channelName}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSaved ? "outline" : "default"}
                      onClick={() => savePref(section)}
                      disabled={isSaving}
                      className="min-w-[80px]"
                    >
                      {isSaved ? (
                        <><Check className="h-3.5 w-3.5 mr-1" /> Saved</>
                      ) : isSaving ? (
                        "Saving..."
                      ) : (
                        <><Save className="h-3.5 w-3.5 mr-1" /> Save</>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Frequency
                      </label>
                      <Select
                        value={isOff ? "off" : pref.frequency}
                        onValueChange={(v) => {
                          if (v === "off") {
                            updatePref(section, "frequency", "off");
                            updatePref(section, "is_active", false);
                          } else {
                            updatePref(section, "frequency", v);
                            updatePref(section, "is_active", true);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Alert when score below
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        value={pref.thresholds.low_score}
                        onChange={(e) => updateThreshold(section, "low_score", Number(e.target.value))}
                        className="h-9"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Alert on health drop &gt;
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        step={0.5}
                        value={pref.thresholds.health_drop}
                        onChange={(e) => updateThreshold(section, "health_drop", Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {!isOff && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Channel: {channelName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email: coming soon
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-2">Schedule Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border p-3">
                <p className="font-medium">Monday 8:00 AM</p>
                <p className="text-muted-foreground mt-0.5">Week priorities - at-risk accounts, pipeline focus</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Tue-Thu 8:00 AM</p>
                <p className="text-muted-foreground mt-0.5">Daily actions - new scores, alerts, follow-ups</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Friday 4:00 PM</p>
                <p className="text-muted-foreground mt-0.5">Week in review - trends, rep rankings, highlights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
