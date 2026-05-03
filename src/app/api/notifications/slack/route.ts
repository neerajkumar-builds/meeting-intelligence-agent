import { NextRequest } from "next/server";

interface SlackPayload {
  title: string;
  body: string;
  meetingUrl?: string;
  channelId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!botToken && !webhookUrl) {
      return Response.json(
        { error: "Slack not configured. Add SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL to environment variables." },
        { status: 503 }
      );
    }

    const payload: SlackPayload = await request.json();

    if (!payload.title || !payload.body) {
      return Response.json({ error: "title and body are required" }, { status: 400 });
    }

    // Build Slack Block Kit blocks - split long content into multiple sections (max 3000 chars each)
    const blocks: Record<string, unknown>[] = [
      {
        type: "header",
        text: { type: "plain_text", text: payload.title.slice(0, 150), emoji: true },
      },
    ];

    const BLOCK_LIMIT = 2800;
    const body = payload.body;
    for (let i = 0; i < body.length && blocks.length < 48; i += BLOCK_LIMIT) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: body.slice(i, i + BLOCK_LIMIT) },
      });
    }

    if (payload.meetingUrl) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in Dashboard", emoji: true },
            url: payload.meetingUrl,
            style: "primary",
          },
        ],
      });
    }

    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Sent from _Meeting Intelligence Dashboard_ at ${new Date().toLocaleString()}` },
      ],
    });

    const fallbackText = `${payload.title}: ${payload.body.slice(0, 200)}`;

    // Prefer bot token (supports channel selection), fall back to webhook
    if (botToken && payload.channelId) {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: payload.channelId,
          blocks,
          text: fallbackText,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        console.error("Slack chat.postMessage error:", data.error);
        return Response.json({ error: `Slack error: ${data.error}` }, { status: 502 });
      }

      return Response.json({ success: true, channel: data.channel });
    }

    // Fallback: webhook (posts to default channel)
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, text: fallbackText }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Slack webhook error:", text);
        return Response.json({ error: "Failed to send to Slack" }, { status: 502 });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: "No valid Slack credentials" }, { status: 503 });
  } catch (error) {
    console.error("Slack notification error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
