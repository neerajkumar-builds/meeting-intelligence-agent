"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { SuggestedPrompts } from "./suggested-prompts";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { logChatEvent } from "@/lib/analytics";

const STORAGE_PREFIX = "meeting-intel-chat";
const SESSION_PREFIX = "meeting-intel-session";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function storageKey(email: string | null): string {
  return email ? `${STORAGE_PREFIX}-${email}` : STORAGE_PREFIX;
}

function loadMessages(email: string | null): Message[] {
  try {
    const stored = localStorage.getItem(storageKey(email));
    if (!stored) return [];
    return JSON.parse(stored) as Message[];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[], email: string | null) {
  try {
    const key = storageKey(email);
    if (messages.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(messages));
    }
  } catch {
    // Storage full or unavailable - ignore
  }
}

function getSessionId(email: string | null): string {
  const key = email ? `${SESSION_PREFIX}-${email}` : SESSION_PREFIX;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function ChatInterface({ initialQuery, suggestedPrompts, sectionLabel }: { initialQuery?: string; suggestedPrompts?: string[]; sectionLabel?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emailLoaded = useRef(false);

  const initialSent = useRef(false);

  // Load user email, then restore chat history for that user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      setUserEmail(email);
      emailLoaded.current = true;

      if (initialQuery) {
        const stored = loadMessages(email);
        const firstUserMsg = stored.find(m => m.role === "user");
        if (firstUserMsg && firstUserMsg.content === initialQuery) {
          setMessages(stored);
        }
      } else {
        setMessages(loadMessages(email));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist messages whenever they change (and not mid-stream)
  useEffect(() => {
    if (!isStreaming && emailLoaded.current) {
      saveMessages(messages, userEmail);
    }
  }, [messages, isStreaming, userEmail]);

  useEffect(() => {
    if (initialQuery && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      sendMessage(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once when initialQuery arrives, guarded by initialSent ref
  }, [initialQuery]);

  // Scroll to bottom on mount if restoring conversation
  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  async function sendMessage(content: string) {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history, sessionId: getSessionId(userEmail), userEmail, sectionLabel }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ?? `HTTP ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Anthropic's toReadableStream() outputs newline-delimited JSON
        // Each line is a complete JSON object (no SSE "data:" prefix)
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // Keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Handle both raw JSON and SSE format
          const jsonStr = trimmed.startsWith("data: ")
            ? trimmed.slice(6)
            : trimmed;
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta" &&
              parsed.delta.text
            ) {
              fullText += parsed.delta.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: fullText }
                    : m
                )
              );
              scrollToBottom();
            }
          } catch {
            // Partial JSON, will be completed in next chunk
          }
        }
      }

      // Ensure final state is set
      if (!fullText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content:
                    "No response received. Please try again or contact your admin if this persists.",
                }
              : m
          )
        );
      }
    } catch (error) {
      const msg = (error as Error).message;
      // Show user-friendly message - never expose API key names or internal config
      const userMessage = msg.includes("429") || msg.includes("limit")
        ? msg  // Rate limit messages are already user-friendly
        : "Something went wrong. Please try again or contact your admin if this persists.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: userMessage }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  }

  function resetConversation() {
    if (!window.confirm("Clear this conversation?")) return;
    logChatEvent({ sessionId: getSessionId(userEmail), eventType: "clear", userEmail: userEmail ?? undefined });
    setMessages([]);
    saveMessages([], userEmail);
    const sessionKey = userEmail ? `${SESSION_PREFIX}-${userEmail}` : SESSION_PREFIX;
    sessionStorage.removeItem(sessionKey);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={sendMessage} prompts={suggestedPrompts} />
        ) : (
          <div className="h-full overflow-y-auto" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 pb-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={
                    isStreaming &&
                    message.role === "assistant" &&
                    message.id === messages[messages.length - 1]?.id
                  }
                  onFollowUp={!isStreaming ? sendMessage : undefined}
                  sessionId={getSessionId(userEmail)}
                  userEmail={userEmail ?? undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          {messages.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetConversation}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="h-3 w-3" />
                Clear chat
              </Button>
              {(() => {
                const turns = Math.floor(messages.length / 2);
                if (turns >= 15) {
                  return (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      {turns} turns - older messages aren&apos;t sent to AI. Clear for best accuracy.
                    </span>
                  );
                }
                if (turns >= 11) {
                  return <span className="text-xs text-muted-foreground">{turns} turns</span>;
                }
                return null;
              })()}
            </div>
          )}
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
