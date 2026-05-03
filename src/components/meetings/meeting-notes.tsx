"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { MessageSquarePlus, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  meeting_id: string;
  section: string;
  user_email: string;
  user_name: string | null;
  content: string;
  created_at: string;
}

interface MeetingNotesProps {
  meetingId: string;
  section: string;
  /** All notes for this meeting - filtered by section client-side */
  allNotes: Note[];
  onNoteAdded: () => void;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function getTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

export function MeetingNotes({ meetingId, section, allNotes, onNoteAdded }: MeetingNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setUserName(data.user?.user_metadata?.full_name ?? data.user?.email?.split("@")[0] ?? null);
    });
  }, []);

  const notes = allNotes.filter((n) => n.section === section);

  const handleSave = useCallback(async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          userEmail,
          userName,
          content: content.trim(),
        }),
      });
      if (res.ok) {
        setContent("");
        setIsAdding(false);
        onNoteAdded();
      }
    } finally {
      setSaving(false);
    }
  }, [content, saving, meetingId, section, userEmail, userName, onNoteAdded]);

  return (
    <div className="mt-3">
      {/* Existing notes */}
      {notes.length > 0 && (
        <div className="space-y-2 mb-2">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-2.5 rounded-lg border border-dashed border-border/60 bg-muted/30 px-3 py-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-semibold text-primary">
                  {getInitials(note.user_name, note.user_email)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{note.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {note.user_name ?? note.user_email} · {getTimeAgo(note.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note toggle */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquarePlus className="h-3 w-3" />
          {notes.length > 0 ? "Add another note" : "Add a note"}
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add context, feedback, or corrections..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
            rows={2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
              if (e.key === "Escape") { setIsAdding(false); setContent(""); }
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3 w-3" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => { setIsAdding(false); setContent(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <span className="text-[10px] text-muted-foreground ml-auto">Cmd+Enter to save · Esc to cancel</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to fetch all notes for a meeting (single query, filter by section client-side)
 */
export function useMeetingNotes(meetingId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, refetch: fetchNotes };
}
