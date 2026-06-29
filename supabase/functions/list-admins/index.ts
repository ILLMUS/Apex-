import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller is at least admin
  const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id);
  const roles = roleData?.map((r: any) => r.role) || [];
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  // Get all user_roles
  const { data: allRoles, error } = await adminClient.from("user_roles").select("*");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  // Get user emails from auth
  const userIds = [...new Set(allRoles.map((r: any) => r.user_id))];
  const members = [];

  for (const uid of userIds) {
    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(uid as string);
    const userRoles = allRoles.filter((r: any) => r.user_id === uid);
    members.push({
      user_id: uid,
      email: authUser?.email || "Unknown",
      roles: userRoles.map((r: any) => r.role),
      created_at: authUser?.created_at,
    });
  }

  return new Response(JSON.stringify({ members }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
