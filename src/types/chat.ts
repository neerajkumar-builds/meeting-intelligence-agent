export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

export interface ChatSource {
  meeting_id: string;
  topic: string | null;
  host_name: string | null;
  company_name: string | null;
  start_time: string | null;
  overall_score: number | null;
  similarity: number;
}

export interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}
