import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, roadmapId } = await req.json();
    const serviceClient = getServiceClient();
    const now = new Date();

    const { data: profile } = await serviceClient
      .from("users_profile")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: roadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const { data: progress } = await serviceClient
      .from("user_progress")
      .select("*, roadmap_nodes:node_id(*)")
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmapId)
      .order("created_at", { ascending: false })
      .limit(10);

    const completedCount = progress?.filter((p: any) => p.status === "completed").length || 0;

    let title = "";
    let message = "";

    if (type === "pace_drop") {
      const daysSinceLast = profile?.last_active_at
        ? Math.ceil((now.getTime() - new Date(profile.last_active_at).getTime()) / 86400000)
        : 0;
      title = "Your pace has slowed";
      message = `It's been ${daysSinceLast} days since your last study session. "${roadmap.title}" is waiting for you. Even 15 minutes today builds momentum. What's one small step you can take right now?`;
    } else if (type === "milestone_complete") {
      const lastNode = progress?.[0]?.roadmap_nodes;
      title = "Milestone achieved!";
      message = `You crushed "${lastNode?.title || "your latest"}". That's ${completedCount}/${roadmap.total_nodes} nodes done. Take a moment to appreciate your progress — then let's tackle the next one.`;
    } else if (type === "low_comprehension") {
      const { data: quizzes } = await serviceClient
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId)
        .order("created_at", { ascending: false })
        .limit(5);
      const avg = quizzes?.length
        ? quizzes.reduce((s: number, q: any) => s + (q.score || 0), 0) / quizzes.length
        : 0;
      title = "Let's reinforce your understanding";
      message = `Your recent quiz average is ${Math.round(avg)}%. That tells me some concepts haven't fully clicked yet. Want to revisit those topics with a different approach? I can suggest resources tailored to your learning style.`;
    } else if (type === "weekly_review") {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekProgress = progress?.filter((p: any) => new Date(p.created_at) >= weekStart) || [];
      const weekHours = weekProgress.reduce((s: number, p: any) => s + (p.time_spent_minutes || 0), 0) / 60;

      const aiMessage = await callAI(
        `User "${profile?.full_name || "Learner"}" is learning "${roadmap.title}". 
        This week: completed ${weekProgress.length} nodes, studied ${Math.round(weekHours)} hours, ${completedCount}/${roadmap.total_nodes} total done.
        Write a short weekly review message: summarize their week, give one specific suggestion for next week based on their pace, and end with a motivational line. Keep it warm and personal (2-3 sentences).`,
        "You are PathForge AI, a personal learning coach. Write warm, specific weekly reviews."
      );

      title = "Your Weekly Review";
      message = aiMessage;
    } else {
      return NextResponse.json({ error: "Unknown intervention type" }, { status: 400 });
    }

    await serviceClient.from("notifications").insert({
      user_id: user.id,
      roadmap_id: roadmapId,
      type: type === "weekly_review" ? "coach_weekly" : "coach_intervention",
      title,
      message,
      action_url: `/dashboard/roadmap/${roadmapId}`,
    });

    return NextResponse.json({ sent: true, title, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Intervention failed" }, { status: 500 });
  }
}
