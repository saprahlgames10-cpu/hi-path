"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackInner() {
  const [status, setStatus] = useState("Completing sign in...");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");

      if (!code) {
        setStatus("No authorization code found.");
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setStatus("Sign in failed.");
        setTimeout(() => router.push(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`), 2000);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Also set a cookie so middleware can detect the session
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
        window.location.href = "/dashboard";
      } else {
        setStatus("Session not established.");
        setTimeout(() => router.push("/auth/login"), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
