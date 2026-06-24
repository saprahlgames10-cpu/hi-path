import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function isConfigured() {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== "";
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    serviceRoleKey || "placeholder",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getAuthenticatedUser() {
  if (!isConfigured()) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export { isConfigured };
