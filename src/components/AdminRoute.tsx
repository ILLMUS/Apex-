import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

/**
 * Route-level guard for admin-only pages.
 * - No session → redirect to /admin (which renders the admin sign-in form).
 * - Session but no admin/super_admin role → "Access Denied" screen.
 * - Admin → render children.
 *
 * Server-side, RLS on user_roles + has_role() is the source of truth.
 * This guard is a defense-in-depth UX layer.
 */
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "no-session" | "denied" | "ok">("loading");


  useEffect(() => {
    let active = true;

    const check = async (userId?: string) => {
      if (!userId) {
        if (active) setStatus("no-session");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!active) return;
      if (error) {
        setStatus("denied");
        return;
      }
      const roles = (data ?? []).map((r) => r.role);
      const isAdmin = roles.includes("admin") || roles.includes("super_admin");
      setStatus(isAdmin ? "ok" : "denied");
    };

    supabase.auth.getSession().then(({ data: { session } }) => check(session?.user?.id));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus("loading");
      check(session?.user?.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (status === "no-session") {
    // AdminDashboard renders its own admin sign-in form when there is no session.
    return <>{children}</>;
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="space-y-4 max-w-sm">
          <Shield className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You're signed in, but this area is restricted to staff. Contact your administrator if you believe this is a mistake.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-primary hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
