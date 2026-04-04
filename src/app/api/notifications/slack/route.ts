import { NextRequest } from "next/server";

interface SlackPayload {
  title: string;
  body: string;
  meetingUrl?: string;
  channel?: string;
}

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json(
        { error: "Slack webhook URL not configured. Add SLACK_WEBHOOK_URL to environment variables." },
        { status: 503 }
      );
    }

    const payload: SlackPayload = await request.json();

    if (!payload.title || !payload.body) {
      return Response.json({ error: "title and body are required" }, { status: 400 });
    }

    // Build Slack Block Kit message
    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: payload.title.slice(0, 150), emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: payload.body.slice(0, 2800) },
      },
    ];

    // Add "View in Dashboard" button if URL provided
    if (payload.meetingUrl) {
      blocks.push({
        type: "actions" as "section",
        text: undefined as unknown as { type: "mrkdwn"; text: string },
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in Dashboard", emoji: true },
            url: payload.meetingUrl,
            style: "primary",
          },
        ],
      } as typeof blocks[number]);
    }

    blocks.push({
      type: "context",
      text: undefined as unknown as { type: "mrkdwn"; text: string },
      elements: [
        { type: "mrkdwn", text: `Sent from _Meeting Intelligence Dashboard_ at ${new Date().toLocaleString()}` },
      ],
    } as typeof blocks[number]);

    const slackBody: Record<string, unknown> = {
      blocks,
      text: `${payload.title}: ${payload.body.slice(0, 200)}`, // Fallback for notifications
    };

    if (payload.channel) {
      slackBody.channel = payload.channel;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackBody),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Slack API error:", text);
      return Response.json({ error: "Failed to send to Slack" }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Slack notification error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
