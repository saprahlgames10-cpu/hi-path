import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = getServiceClient();
    const now = new Date();

    const { data: profile } = await serviceClient
      .from("users_profile")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: roadmaps } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    const triggers: any[] = [];

    for (const roadmap of roadmaps || []) {
      const { data: progress } = await serviceClient
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmap.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const completedCount = progress?.filter((p: any) => p.status === "completed").length || 0;
      const daysSinceLastActive = profile?.last_active_at
        ? Math.ceil((now.getTime() - new Date(profile.last_active_at).getTime()) / 86400000)
        : 999;

      if (daysSinceLastActive >= 3 && daysSinceLastActive < 7) {
        const existing = await serviceClient
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "pace_warning")
          .gte("created_at", new Date(Date.now() - 86400000 * 3).toISOString())
          .limit(1);
        if (!existing.data?.length) {
          triggers.push({ type: "pace_drop", roadmapId: roadmap.id, daysSinceLastActive });
        }
      }

      if (completedCount > 0 && completedCount % 5 === 0) {
        const existing = await serviceClient
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "milestone_auto")
          .eq("roadmap_id", roadmap.id)
          .gte("created_at", new Date(Date.now() - 86400000).toISOString())
          .limit(1);
        if (!existing.data?.length) {
          triggers.push({ type: "milestone_complete", roadmapId: roadmap.id, completedCount });
        }
      }

      const { data: quizzes } = await serviceClient
        .from("quiz_sessions")
        .select("score")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmap.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (quizzes && quizzes.length >= 3) {
        const lowScores = quizzes.filter((q: any) => (q.score || 0) < 50).length;
        const avgRecent = quizzes.reduce((s: number, q: any) => s + (q.score || 0), 0) / quizzes.length;

        if (lowScores >= 2 && avgRecent < 55) {
          const existing = await serviceClient
            .from("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "comprehension_warning")
            .gte("created_at", new Date(Date.now() - 86400000 * 2).toISOString())
            .limit(1);
          if (!existing.data?.length) {
            triggers.push({ type: "low_comprehension", roadmapId: roadmap.id, avgRecent });
          }
        }
      }

      if (daysSinceLastActive >= 7) {
        const aiMessage = await callAI(
          `The user "${profile?.full_name || "Learner"}" hasn't studied in ${daysSinceLastActive} days on "${roadmap.title}". 
           Write a short 2-sentence re-engagement message. Warm, not guilt-tripping. Suggest restarting with a small 10-minute win.`,
          "You are a supportive learning coach encouraging a lapsed learner."
        );

        await serviceClient.from("notifications").insert({
          user_id: user.id,
          roadmap_id: roadmap.id,
          type: "re_engagement",
          title: "We miss you!",
          message: aiMessage,
          action_url: `/dashboard/roadmap/${roadmap.id}`,
        });
        triggers.push({ type: "re_engagement", roadmapId: roadmap.id });
      }
    }

    return NextResponse.json({ triggers, count: triggers.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Check failed" }, { status: 500 });
  }
}
