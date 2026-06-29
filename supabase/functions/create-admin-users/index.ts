import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const admins = [
    { email: "admin1@apexacademy.edu", password: "ApexAdmin2025!" },
    { email: "admin2@apexacademy.edu", password: "ApexAdmin2025!" },
    { email: "admin3@apexacademy.edu", password: "ApexAdmin2025!" },
    { email: "admin4@apexacademy.edu", password: "ApexAdmin2025!" },
    { email: "admin5@apexacademy.edu", password: "ApexAdmin2025!" },
  ];

  const results = [];
  for (const a of admins) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
    });
    if (error) { results.push({ email: a.email, error: error.message }); continue; }
    const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
    results.push({ email: a.email, success: true, roleError: roleErr?.message || null });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
