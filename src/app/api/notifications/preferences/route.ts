import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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

async function getAuthEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? null;
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const email = await getAuthEmail();
    if (!email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createServiceClient();
    const { data, error } = await db
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
    const email = await getAuthEmail();
    if (!email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { section, channel, frequency, slack_channel_id, is_active, thresholds } = body;

    if (!section || !channel) {
      return Response.json({ error: "section and channel are required" }, { status: 400 });
    }

    const db = createServiceClient();
    const { data, error } = await db
      .from("notification_preferences")
      .upsert(
        {
          user_email: email,
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
