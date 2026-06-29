import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Clock, Download, LogIn, LogOut, Filter, UserPlus, Shield, Users, Trash2, History, MessageSquare, Mail, MailOpen, BarChart3, FileCheck, Home, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import InsightsPanel from "@/components/admin/InsightsPanel";
import MessageThread from "@/components/MessageThread";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import AdminParentInbox from "@/components/admin/AdminParentInbox";
import { playNotificationSound } from "@/lib/notificationSound";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Application = {
  id: string;
  student_name: string;
  date_of_birth: string;
  previous_school: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  last_grade: string;
  report_url: string | null;
  birth_cert_url: string | null;
  parent_id_url: string | null;
  status: string;
  created_at: string;
  parent_user_id: string | null;
  assigned_admin_id: string | null;
};

type AdminMember = {
  user_id: string;
  email: string;
  roles: string[];
  created_at: string;
};

type ActivityLog = {
  id: string;
  user_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, any>;
  created_at: string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const AdminDashboard = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"applications" | "insights" | "team" | "logs" | "messages" | "parents">("applications");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);

  // Team state
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<AdminMember | null>(null);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(0);
  const [logTotal, setLogTotal] = useState(0);
  const LOG_PAGE_SIZE = 20;

  // Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkRoles(session.user.id);
      else { setIsAdmin(null); setIsSuperAdmin(false); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkRoles(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!session || !isAdmin) return;
    fetchUnreadCount();
    const channel = supabase
      .channel('contact-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, (payload) => {
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
        toast({ title: "New Message", description: `New contact message from ${(payload.new as any).name}` });
        if (activeTab === "messages") {
          setMessages((prev) => [payload.new as ContactMessage, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contact_messages' }, (payload) => {
        const updated = payload.new as ContactMessage;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        fetchUnreadCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, isAdmin, activeTab]);

  // Realtime subscription for new applications
  useEffect(() => {
    if (!session || !isAdmin) return;
    fetchPendingAppsCount();
    const channel = supabase
      .channel('applications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, (payload) => {
        const app = payload.new as Application;
        setPendingAppsCount((prev) => prev + 1);
        toast({ title: "New Application", description: `New application from ${app.student_name}` });
        if (activeTab === "applications") {
          setApps((prev) => [app, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, () => {
        fetchPendingAppsCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, isAdmin, activeTab]);

  const fetchPendingAppsCount = async () => {
    const { count } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingAppsCount(count || 0);
  };

  const checkRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error || !data || data.length === 0) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }
    const roles = data.map((r: any) => r.role);
    setIsSuperAdmin(roles.includes("super_admin"));
    setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
  };

  useEffect(() => {
    if (session && isAdmin && activeTab === "applications") fetchApps();
  }, [session, isAdmin, filter, activeTab]);

  useEffect(() => {
    if (session && isAdmin && activeTab === "team") fetchMembers();
  }, [session, isAdmin, activeTab]);

  useEffect(() => {
    if (session && isAdmin && activeTab === "messages") fetchMessages();
  }, [session, isAdmin, activeTab]);

  const fetchApps = async () => {
    setLoading(true);
    let query = supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setApps((data as Application[]) || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-admins`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s?.access_token}`,
        },
      });
      const result = await res.json();
      if (result.members) setMembers(result.members);
      else toast({ title: "Error", description: result.error || "Failed to load team", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to load team members", variant: "destructive" });
    }
    setLoadingMembers(false);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setMessages((data as ContactMessage[]) || []);
    setLoadingMessages(false);
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
    fetchUnreadCount();
  };

  const fetchLogs = async (page = 0) => {
    setLoadingLogs(true);
    const from = page * LOG_PAGE_SIZE;
    const to = from + LOG_PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data) setActivityLogs(data as ActivityLog[]);
    if (count !== null) setLogTotal(count);
    if (error) toast({ title: "Error", description: "Failed to load activity logs", variant: "destructive" });
    setLoadingLogs(false);
  };

  const removeMember = async (userId: string) => {
    setRemoving(userId);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s?.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Removed", description: "Admin member removed successfully" });
        fetchMembers();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    }
    setRemoving(null);
  };

  const updateStatus = async (id: string, status: string) => {
    const app = apps.find(a => a.id === id);
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Updated", description: `Application ${status}` });
      await supabase.from("activity_logs").insert({
        user_id: session.user.id,
        user_email: session.user.email,
        action: `application_${status}`,
        target_type: "application",
        target_id: id,
        details: { student_name: app?.student_name || "Unknown" },
      });
      fetchApps();
      if (selected?.id === id) setSelected({ ...selected, status });
    }
  };

  const assignToMe = async (id: string, unassign = false) => {
    if (!session?.user?.id) return;
    const newAdminId = unassign ? null : session.user.id;
    const { error } = await supabase.from("applications").update({ assigned_admin_id: newAdminId }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: unassign ? "Unassigned" : "Assigned", description: unassign ? "You are no longer assigned to this application." : "You are now assigned and can message the parent." });
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, assigned_admin_id: newAdminId } : a)));
    if (selected?.id === id) setSelected({ ...selected, assigned_admin_id: newAdminId });
  };

  const getDocUrl = async (path: string) => {
    const { data } = await supabase.storage.from("application-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: "Login Failed", description: error.message, variant: "destructive" });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession?.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail, password: invitePassword, role: inviteRole }),
      });
      const result = await res.json();
      if (result.error) {
        toast({ title: "Invite Failed", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Admin Invited", description: `${inviteEmail} added as ${inviteRole}` });
        setInviteEmail("");
        setInvitePassword("");
        setShowInvite(false);
        if (activeTab === "team") fetchMembers();
      }
    } catch {
      toast({ title: "Error", description: "Failed to invite admin", variant: "destructive" });
    }
    setInviting(false);
  };

  const userEmail = session?.user?.email;

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-muted border border-border p-8 card-elevated w-full max-w-sm space-y-4">
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">Admin Login</h1>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <button type="submit" className="btn-primary-school w-full">
            <LogIn className="mr-2 h-4 w-4" /> Sign In
          </button>
        </form>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-primary hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="bg-background border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-foreground">Admissions Dashboard</h1>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded">
                <Shield className="h-3 w-3" /> Super Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">Back to website</span>
            </Link>
            <span className="text-sm text-muted-foreground hidden md:block truncate max-w-[200px]">{userEmail}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-destructive hover:text-destructive/80 flex items-center gap-1 font-medium">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border -mb-4 pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "applications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Applications
            {pendingAppsCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                {pendingAppsCount > 99 ? "99+" : pendingAppsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "insights"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Insights
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "messages"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Messages
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("parents")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "parents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" /> Parents
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "team"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" /> Team Management
            </button>
          )}
          <button
            onClick={() => { setActiveTab("logs"); setLogPage(0); fetchLogs(0); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" /> Activity Log
          </button>
        </div>
      </header>

      {/* Breadcrumb */}
      <AdminBreadcrumb
        items={[
          {
            label:
              activeTab === "team"
                ? "Team Management"
                : activeTab === "logs"
                ? "Activity Log"
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
          },
        ]}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {activeTab === "insights" ? (
          <InsightsPanel />
        ) : activeTab === "messages" ? (
          /* ===== MESSAGES TAB ===== */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Contact Messages
                {unreadCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">({unreadCount} unread)</span>
                )}
              </h2>
            </div>

            {loadingMessages ? (
              <p className="text-muted-foreground text-center py-8">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      !msg.is_read
                        ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.is_read) markAsRead(msg.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex-shrink-0 mt-0.5">
                          {msg.is_read ? (
                            <MailOpen className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Mail className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${!msg.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                              {msg.name}
                            </p>
                            {!msg.is_read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{msg.email}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{msg.message}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "parents" ? (
          /* ===== PARENTS INBOX TAB ===== */
          <AdminParentInbox currentUserId={session.user.id} />
        ) : activeTab === "team" && isSuperAdmin ? (
          /* ===== TEAM MANAGEMENT TAB ===== */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" /> Admin Team
              </h2>
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded"
              >
                <UserPlus className="h-4 w-4" /> Invite Admin
              </button>
            </div>

            {showInvite && (
              <div className="bg-muted border border-border p-6 mb-6 rounded-lg">
                <h3 className="font-heading text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Invite New Admin
                </h3>
                <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input type="email" placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
                    className="border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded" />
                  <input type="password" placeholder="Temp password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} required minLength={6}
                    className="border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded" />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded">
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                  <button type="submit" disabled={inviting} className="btn-primary-school text-sm rounded">
                    {inviting ? "Inviting..." : "Send Invite"}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingMembers ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading team...</td></tr>
                    ) : members.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No team members found</td></tr>
                    ) : members.map((m) => (
                      <tr key={m.user_id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{m.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {m.roles.map((r) => (
                              <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded capitalize ${
                                r === "super_admin" ? "bg-primary/10 text-primary" : r === "admin" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                              }`}>
                                {r === "super_admin" && <Shield className="h-3 w-3" />}
                                {r.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {m.roles.includes("super_admin") ? (
                            <span className="text-xs text-muted-foreground italic">Protected</span>
                          ) : (
                            <button
                              onClick={() => setConfirmRemove(m)}
                              disabled={removing === m.user_id}
                              className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              {removing === m.user_id ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "logs" ? (
          /* ===== ACTIVITY LOG TAB ===== */
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2 mb-6">
              <History className="h-5 w-5" /> Activity Log
            </h2>
            {loadingLogs ? (
              <p className="text-muted-foreground text-center py-8">Loading logs...</p>
            ) : activityLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activity recorded yet.</p>
            ) : (
              <>
                <div className="bg-background border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-left">
                        <tr>
                          <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activityLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-foreground">{log.user_email || "System"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${
                                log.action.includes("approved") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                log.action.includes("rejected") ? "bg-destructive/10 text-destructive" :
                                log.action.includes("invited") ? "bg-primary/10 text-primary" :
                                log.action.includes("removed") ? "bg-destructive/10 text-destructive" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {log.details && Object.entries(log.details).map(([k, v]) => (
                                <span key={k} className="mr-2">{k.replace(/_/g, " ")}: <span className="text-foreground">{String(v)}</span></span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {logTotal > LOG_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {logPage * LOG_PAGE_SIZE + 1}–{Math.min((logPage + 1) * LOG_PAGE_SIZE, logTotal)} of {logTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={logPage === 0} onClick={() => { const p = logPage - 1; setLogPage(p); fetchLogs(p); }}>
                        Previous
                      </Button>
                      <Button size="sm" variant="outline" disabled={(logPage + 1) * LOG_PAGE_SIZE >= logTotal} onClick={() => { const p = logPage + 1; setLogPage(p); fetchLogs(p); }}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ===== APPLICATIONS TAB ===== */
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total", count: apps.length, color: "text-foreground" },
                { label: "Pending", count: apps.filter(a => a.status === "pending").length, color: "text-primary" },
                { label: "Approved", count: apps.filter(a => a.status === "approved").length, color: "text-green-600" },
                { label: "Rejected", count: apps.filter(a => a.status === "rejected").length, color: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="bg-muted border border-border p-4 card-elevated text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="bg-background border border-border card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Student</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Parent</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Grade</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Docs</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                    ) : apps.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No applications found</td></tr>
                    ) : apps.map((app) => (
                      <tr key={app.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{app.student_name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{app.parent_name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{app.last_grade}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <DocsBadge report={app.report_url} birth={app.birth_cert_url} parentId={app.parent_id_url} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelected(app)} className="p-1.5 hover:bg-muted" title="View">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {app.status === "pending" && (
                              <>
                                <button onClick={() => updateStatus(app.id, "approved")} className="p-1.5 hover:bg-green-50" title="Approve">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </button>
                                <button onClick={() => updateStatus(app.id, "rejected")} className="p-1.5 hover:bg-red-50" title="Reject">
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Application Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-background border border-border p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-foreground">Application Details</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <DetailRow label="Student Name" value={selected.student_name} />
                <DetailRow label="Date of Birth" value={selected.date_of_birth} />
                <DetailRow label="Previous School" value={selected.previous_school} />
                <DetailRow label="Last Grade" value={selected.last_grade} />
                <DetailRow label="Parent Name" value={selected.parent_name} />
                <DetailRow label="Parent Phone" value={selected.parent_phone} />
                <DetailRow label="Parent Email" value={selected.parent_email} />
                <DetailRow label="Applied" value={new Date(selected.created_at).toLocaleString()} />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Documents</p>
                <DocumentPreview label="School Report" path={selected.report_url} />
                <DocumentPreview label="Birth Certificate" path={selected.birth_cert_url} />
                <DocumentPreview label="Parent ID" path={selected.parent_id_url} />
              </div>
            </div>

            {session?.user?.id && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-heading text-lg font-bold text-foreground">Conversation with Parent</h3>
                  </div>
                  {selected.assigned_admin_id === session.user.id ? (
                    <button
                      onClick={() => assignToMe(selected.id, true)}
                      className="px-3 py-1.5 text-xs font-medium bg-muted border border-border hover:bg-muted/80 rounded"
                    >
                      Unassign me
                    </button>
                  ) : (
                    <button
                      onClick={() => assignToMe(selected.id)}
                      disabled={!!selected.assigned_admin_id && !isSuperAdmin}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded"
                    >
                      {selected.assigned_admin_id ? "Reassign to me" : "Assign to me"}
                    </button>
                  )}
                </div>
                {!selected.parent_user_id ? (
                  <p className="text-sm text-muted-foreground bg-muted border border-border p-3 rounded">
                    This application was submitted without a parent account, so there is no parent to message. Ask the parent to create an account and link their application.
                  </p>
                ) : selected.assigned_admin_id === session.user.id || isSuperAdmin ? (
                  <MessageThread applicationId={selected.id} currentUserId={session.user.id} asRole="admin" />
                ) : selected.assigned_admin_id ? (
                  <p className="text-sm text-muted-foreground bg-muted border border-border p-3 rounded">
                    This application is assigned to another admin. Only the assigned admin (or a super admin) can view and reply to messages.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted border border-border p-3 rounded">
                    Click <span className="font-semibold">Assign to me</span> to start messaging the parent.
                  </p>
                )}
              </div>
            )}
            {selected.status === "pending" && (
              <div className="flex gap-3 mt-6">
                <button onClick={() => updateStatus(selected.id, "approved")} className="btn-primary-school text-sm flex-1">
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </button>
                <button onClick={() => updateStatus(selected.id, "rejected")} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity rounded">
                  <XCircle className="mr-1 h-4 w-4 inline" /> Reject
                </button>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="w-full mt-3 px-4 py-2 text-sm text-muted-foreground bg-muted border border-border hover:bg-muted/80 rounded">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-background border border-border p-6 md:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-foreground">Message Details</h2>
              <span className="text-xs text-muted-foreground">{new Date(selectedMessage.created_at).toLocaleString()}</span>
            </div>
            <div className="space-y-3">
              <DetailRow label="Name" value={selectedMessage.name} />
              <DetailRow label="Email" value={selectedMessage.email} />
              <DetailRow label="Phone" value={selectedMessage.phone} />
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground mb-2">Message</p>
              <p className="text-sm text-muted-foreground bg-muted border border-border rounded p-4 whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: Your message to Apex Academy`}
                className="btn-primary-school text-sm flex-1 text-center"
              >
                <Mail className="mr-1 h-4 w-4 inline" /> Reply via Email
              </a>
              <button onClick={() => setSelectedMessage(null)} className="flex-1 px-4 py-2 text-sm text-muted-foreground bg-muted border border-border hover:bg-muted/80 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog for removing admin */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{confirmRemove?.email}</span> from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmRemove) {
                  removeMember(confirmRemove.user_id);
                  setConfirmRemove(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-primary/10 text-primary",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-destructive",
  };
  const icons: Record<string, any> = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
};
  const Icon = icons[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium capitalize rounded ${styles[status] || ""}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
};

const DocsBadge = ({ report, birth, parentId }: { report: string | null; birth: string | null; parentId: string | null }) => {
  const docs = [
    { label: "Report", present: !!report },
    { label: "Birth Cert", present: !!birth },
    { label: "Parent ID", present: !!parentId },
  ];
  const count = docs.filter(d => d.present).length;
  const complete = count === 3;
  return (
    <div className="flex items-center gap-1.5" title={docs.map(d => `${d.label}: ${d.present ? "✓" : "✗"}`).join("\n")}>
      <FileCheck className={`h-3.5 w-3.5 ${complete ? "text-green-600" : count === 0 ? "text-destructive" : "text-primary"}`} />
      <span className={`text-xs font-semibold ${complete ? "text-green-600" : count === 0 ? "text-destructive" : "text-foreground"}`}>
        {count}/3
      </span>
      <div className="flex gap-0.5 ml-1">
        {docs.map((d, i) => (
          <span key={i} className={`block w-1.5 h-3 ${d.present ? "bg-green-600" : "bg-muted-foreground/30"}`} />
        ))}
      </div>
    </div>
  );
};

const DocumentPreview = ({ label, path }: { label: string; path: string | null }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) return;
    setLoading(true);
    supabase.storage.from("application-documents").createSignedUrl(path, 3600).then(({ data }) => {
      setUrl(data?.signedUrl || null);
      setLoading(false);
    });
  }, [path]);

  if (!path) {
    return (
      <div className="border border-border rounded p-3 bg-muted/30">
        <p className="text-xs font-medium text-foreground mb-1">{label}</p>
        <p className="text-xs text-muted-foreground italic">Not uploaded</p>
      </div>
    );
  }

  const ext = path.split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";

  const handleDownload = async () => {
    if (!url) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${label.replace(/\s+/g, "-").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="border border-border rounded overflow-hidden bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <div className="flex gap-2">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Eye className="h-3 w-3" /> Open
            </a>
          )}
          <button onClick={handleDownload} disabled={!url} className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50">
            <Download className="h-3 w-3" /> Download
          </button>
        </div>
      </div>
      <div className="h-48 flex items-center justify-center bg-background">
        {loading || !url ? (
          <p className="text-xs text-muted-foreground">Loading preview...</p>
        ) : isImage ? (
          <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
        ) : isPdf ? (
          <iframe src={url} title={label} className="w-full h-full" />
        ) : (
          <p className="text-xs text-muted-foreground">Preview not available</p>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm border-b border-border pb-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground text-right">{value}</span>
  </div>
);

export default AdminDashboard;
