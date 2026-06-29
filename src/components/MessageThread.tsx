import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Check, CheckCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  application_id: string;
  sender_id: string;
  sender_role: "parent" | "admin";
  body: string;
  created_at: string;
  read_at: string | null;
};

type Props = {
  applicationId: string;
  currentUserId: string;
  asRole: "parent" | "admin";
};

const MessageThread = ({ applicationId, currentUserId, asRole }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  // Load + subscribe per application
  useEffect(() => {
    let active = true;
    setLoading(true);
    setAccessDenied(false);
    markedRef.current = new Set();

    (async () => {
      // Verify the user can access this application at all
      const { data: appCheck, error: appErr } = await supabase
        .from("applications")
        .select("id")
        .eq("id", applicationId)
        .maybeSingle();

      if (!active) return;
      if (appErr || !appCheck) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("application_messages")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        setAccessDenied(true);
        toast({ title: "Failed to load messages", description: error.message, variant: "destructive" });
      } else if (data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    })();

    const ch = supabase
      .channel(`app-msgs-${applicationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "application_messages", filter: `application_id=eq.${applicationId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "application_messages", filter: `application_id=eq.${applicationId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [applicationId, toast]);

  // Auto-scroll and mark incoming messages as read (deduped)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

    const otherRole = asRole === "parent" ? "admin" : "parent";
    const toMark = messages
      .filter((m) => m.sender_role === otherRole && !m.read_at && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (toMark.length === 0) return;

    toMark.forEach((id) => markedRef.current.add(id));
    const stamp = new Date().toISOString();
    supabase
      .from("application_messages")
      .update({ read_at: stamp })
      .in("id", toMark)
      .then(({ error }) => {
        if (error) {
          // Allow retry if it failed
          toMark.forEach((id) => markedRef.current.delete(id));
        } else {
          setMessages((prev) =>
            prev.map((m) => (toMark.includes(m.id) && !m.read_at ? { ...m, read_at: stamp } : m)),
          );
        }
      });
  }, [messages, asRole]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("application_messages")
      .insert({
        application_id: applicationId,
        sender_id: currentUserId,
        sender_role: asRole,
        body: text,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setBody("");
      if (data) {
        // Optimistically include — realtime will dedupe by id
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
      }
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted border border-border p-3 space-y-2 max-h-[380px]">
        {accessDenied ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Lock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Access Denied</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              You do not have permission to view this conversation.
              If you believe this is a mistake, please contact support.
            </p>
          </div>
        ) : loading ? (
          <p className="text-center text-sm text-muted-foreground py-6">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No messages yet. {asRole === "admin" ? "Send the first message to the parent." : "Send a message to the admissions team."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === asRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-3 py-2 text-sm border ${
                    mine
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <span>
                      {m.sender_role === "admin" ? "Admissions" : "Parent"} · {new Date(m.created_at).toLocaleString()}
                    </span>
                    {mine && (m.read_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {!accessDenied && (
        <div className="flex gap-2 mt-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message... (Ctrl+Enter to send)"
            rows={2}
            className="flex-1 border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className="btn-primary-school text-sm px-4 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageThread;
