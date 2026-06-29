import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/lib/notificationSound";

type Props = { userId: string };

const MessageNotification = ({ userId }: Props) => {
  const [count, setCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current && count > prevCountRef.current) {
      playNotificationSound();
    }
    prevCountRef.current = count;
    initializedRef.current = true;
  }, [count]);

  useEffect(() => {
    let cancelled = false;
    let currentAdmin = false;

    const refresh = async (admin: boolean) => {
      if (admin) {
        const { count: c, error } = await supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);
        if (cancelled) return;
        setCount(!error && typeof c === "number" ? c : 0);
      } else {
        const { data: apps, error: appsErr } = await supabase
          .from("applications")
          .select("id")
          .eq("parent_user_id", userId);
        if (cancelled) return;
        const ids: string[] = Array.isArray(apps) && !appsErr
          ? apps.map((a) => (a as { id: string | null } | null)?.id).filter((x): x is string => !!x)
          : [];
        if (ids.length === 0) {
          setCount(0);
          return;
        }
        const { count: c, error } = await supabase
          .from("application_messages")
          .select("*", { count: "exact", head: true })
          .in("application_id", ids)
          .eq("sender_role", "admin")
          .is("read_at", null);
        if (cancelled) return;
        setCount(!error && typeof c === "number" ? c : 0);
      }
    };

    (async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (cancelled) return;
      const roleRows: Array<{ role: string | null }> =
        Array.isArray(roles) && !error ? (roles as Array<{ role: string | null }>) : [];
      const admin = roleRows.some((r) => r?.role === "admin" || r?.role === "super_admin");
      currentAdmin = admin;
      setIsAdmin(admin);
      await refresh(admin);
    })();

    const ch = supabase
      .channel(`msg-notif-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => {
        if (currentAdmin) refresh(true);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "application_messages" }, () => {
        if (!currentAdmin) refresh(false);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (isAdmin === null) return null;
  const to = isAdmin ? "/admin" : "/parent";

  return (
    <Link
      to={to}
      aria-label={`Messages${count > 0 ? ` (${count} unread)` : ""}`}
      title="Messages"
      className="relative inline-flex items-center justify-center p-2 text-foreground hover:text-primary transition-colors"
    >
      <MessageCircle className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
};

export default MessageNotification;
