import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MessageThread from "@/components/MessageThread";
import { Users, MessageCircle } from "lucide-react";

type ParentRow = {
  parent_user_id: string;
  parent_name: string;
  parent_email: string;
  application_id: string;
  student_name: string;
  created_at: string;
  unread: number;
};

type Props = { currentUserId: string };

const AdminParentInbox = ({ currentUserId }: Props) => {
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ParentRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: apps } = await supabase
      .from("applications")
      .select("id,parent_user_id,parent_name,parent_email,student_name,created_at")
      .not("parent_user_id", "is", null)
      .order("created_at", { ascending: false });

    const rows: ParentRow[] = [];
    const seen = new Set<string>();
    for (const a of (apps ?? []) as Array<{
      id: string;
      parent_user_id: string | null;
      parent_name: string;
      parent_email: string;
      student_name: string;
      created_at: string;
    }>) {
      if (!a.parent_user_id || seen.has(a.parent_user_id)) continue;
      seen.add(a.parent_user_id);
      rows.push({
        parent_user_id: a.parent_user_id,
        parent_name: a.parent_name,
        parent_email: a.parent_email,
        application_id: a.id,
        student_name: a.student_name,
        created_at: a.created_at,
        unread: 0,
      });
    }

    // Compute unread per application (messages from parent that admin hasn't read)
    await Promise.all(
      rows.map(async (r) => {
        const { count } = await supabase
          .from("application_messages")
          .select("*", { count: "exact", head: true })
          .eq("application_id", r.application_id)
          .eq("sender_role", "parent")
          .is("read_at", null);
        r.unread = count ?? 0;
      }),
    );

    setParents(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-parent-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "application_messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5" />
        <h2 className="font-heading text-lg font-bold text-foreground">Parent Conversations</h2>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading parents...</p>
      ) : parents.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No parents have applied yet.</p>
      ) : (
        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {parents.map((p) => (
              <button
                key={p.parent_user_id}
                onClick={() => setSelected(p)}
                className={`w-full text-left p-3 border transition-colors ${
                  selected?.parent_user_id === p.parent_user_id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted hover:bg-muted/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{p.parent_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.parent_email}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Student: {p.student_name}</p>
                  </div>
                  {p.unread > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                      {p.unread > 99 ? "99+" : p.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-background border border-border p-4 md:p-5">
            {selected ? (
              <>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-base font-bold">
                    Chat with {selected.parent_name}
                  </h3>
                </div>
                <MessageThread
                  applicationId={selected.application_id}
                  currentUserId={currentUserId}
                  asRole="admin"
                />
              </>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">
                Select a parent to view the conversation.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParentInbox;
