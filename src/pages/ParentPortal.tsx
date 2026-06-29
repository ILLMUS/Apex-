import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import MessageThread from "@/components/MessageThread";
import { LogOut, FileText, MessageCircle } from "lucide-react";

type Application = {
  id: string;
  student_name: string;
  last_grade: string;
  status: string;
  created_at: string;
};

const ParentPortal = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [apps, setApps] = useState<Application[]>([]);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        navigate("/parent/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email || "");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/parent/auth", { replace: true });
      else {
        setUserId(data.session.user.id);
        setEmail(data.session.user.email || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("applications")
      .select("id,student_name,last_grade,status,created_at")
      .eq("parent_user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setApps(data as Application[]);
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/parent/auth", { replace: true });
  };

  const statusStyles: Record<string, string> = {
    pending: "bg-primary/10 text-primary",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-destructive",
  };

  return (
    <Layout>
      <section className="bg-blue-gradient py-10">
        <div className="container-narrow mx-auto px-4 sm:px-6 lg:px-8 text-primary-foreground flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Parent Portal</h1>
            <p className="text-primary-foreground/70 text-sm">{email}</p>
          </div>
          <button onClick={signOut} className="px-3 py-2 text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/30">
            <LogOut className="h-4 w-4 inline mr-1" /> Sign out
          </button>
        </div>
      </section>

      <section className="section-padding bg-background !py-8">
        <div className="container-narrow mx-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading...</p>
          ) : apps.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-xl font-bold mb-2">No applications yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Submit an application to start a conversation with admissions.</p>
              <a href="/apply" className="btn-primary-school text-sm">Start Application</a>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-background border border-border p-4 md:p-5 card-elevated">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold">Message Admin</h2>
                </div>
                {userId && apps[0] && (
                  <MessageThread applicationId={apps[0].id} currentUserId={userId} asRole="parent" />
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Your Applications</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {apps.map((a) => (
                    <div key={a.id} className="p-3 border border-border bg-muted">
                      <p className="font-semibold text-sm text-foreground">{a.student_name}</p>
                      <p className="text-xs text-muted-foreground">{a.last_grade} · {new Date(a.created_at).toLocaleDateString()}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium uppercase ${statusStyles[a.status] || "bg-muted"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ParentPortal;
