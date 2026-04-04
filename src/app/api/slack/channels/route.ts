let cachedChannels: { id: string; name: string }[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Only show channels matching these patterns — prevents accidental posts to client/unrelated channels
// Set SLACK_ALLOWED_CHANNELS env var as comma-separated channel names to override
const DEFAULT_ALLOWED = ["general", "meeting-intel", "fullfunnel"];

function getAllowedPatterns(): string[] {
  const envList = process.env.SLACK_ALLOWED_CHANNELS;
  if (envList) return envList.split(",").map((s) => s.trim().toLowerCase());
  return DEFAULT_ALLOWED;
}

export async function GET() {
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    return Response.json({ channels: [], error: "SLACK_BOT_TOKEN not configured" }, { status: 200 });
  }

  // Return cached if fresh
  if (cachedChannels && Date.now() - cachedAt < CACHE_TTL) {
    return Response.json({ channels: cachedChannels });
  }

  try {
    const res = await fetch("https://slack.com/api/conversations.list", {
      headers: { Authorization: `Bearer ${botToken}` },
      method: "POST",
      body: new URLSearchParams({
        types: "public_channel",
        exclude_archived: "true",
        limit: "200",
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Slack conversations.list error:", data.error);
      return Response.json({ channels: [], error: data.error }, { status: 200 });
    }

    const allowedPatterns = getAllowedPatterns();

    const channels = (data.channels ?? [])
      .map((ch: { id: string; name: string }) => ({ id: ch.id, name: ch.name }))
      .filter((ch: { name: string }) =>
        allowedPatterns.some((pattern) => ch.name.toLowerCase().includes(pattern))
      )
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    cachedChannels = channels;
    cachedAt = Date.now();

    return Response.json({ channels });
  } catch (error) {
    console.error("Slack channels fetch error:", error);
    return Response.json({ channels: [], error: "Failed to fetch channels" }, { status: 200 });
  }
}
