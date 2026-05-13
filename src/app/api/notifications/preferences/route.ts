import { createServerSupabase } from "@/lib/supabase/server";

export interface NotificationPreference {
  id: number;
  user_email: string;
  section: "sales" | "cs" | "internal" | "all";
  channel: "slack" | "email";
  frequency: "realtime" | "hourly" | "daily" | "weekly";
  slack_channel_id: string | null;
  is_active: boolean;
  thresholds: { low_score: number; health_drop: number };
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get("email") || user.email;

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_email", email)
      .order("section");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ preferences: data ?? [] });
  } catch (error) {
    console.error("Notification preferences GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { section, channel, frequency, slack_channel_id, is_active, thresholds } = body;

    if (!section || !channel) {
      return Response.json({ error: "section and channel are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_email: user.email,
          section,
          channel,
          frequency: frequency ?? "daily",
          slack_channel_id: slack_channel_id ?? null,
          is_active: is_active ?? true,
          thresholds: thresholds ?? { low_score: 5, health_drop: 2 },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email,section,channel" }
      )
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ preference: data });
  } catch (error) {
    console.error("Notification preferences PUT error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
