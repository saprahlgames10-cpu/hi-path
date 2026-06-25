import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = getServiceClient();
    const { data: roadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!roadmap) return NextResponse.json({ completed: false });

    const progressArr = (await serviceClient
      .from("user_progress")
      .select("*")
      .eq("roadmap_id", roadmap.id)).data || [];

    const quizArr = (await serviceClient
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmap.id)).data || [];

    const completedCount = progressArr.filter((p: any) => p.status === "completed").length;
    const totalNodes = roadmap.total_nodes || 1;
    const progressPct = completedCount / totalNodes;

    const quizScores = quizArr.map((q: any) => q.score || 0);
    const avgQuizScore = quizScores.length > 0
      ? quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length
      : 0;

    const pacePerDay = progressPct > 0 && roadmap.created_at
      ? completedCount / Math.max(1, Math.ceil((Date.now() - new Date(roadmap.created_at).getTime()) / 86400000))
      : 0;

    const remainingNodes = totalNodes - completedCount;
    const estimatedDaysRemaining = pacePerDay > 0 ? Math.ceil(remainingNodes / pacePerDay) : roadmap.duration_weeks * 7 || 90;

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + estimatedDaysRemaining);

    const targetDate = new Date(roadmap.created_at);
    targetDate.setDate(targetDate.getDate() + (roadmap.duration_weeks || 12) * 7);
    const onTrack = predictedDate <= targetDate;

    const timeEfficiency = progressArr.length > 0
      ? progressArr.filter((p: any) => p.time_spent_minutes > 0).reduce((sum: number, p: any) => sum + (p.estimated_minutes || 30) / Math.max(1, p.time_spent_minutes), 0) / Math.max(1, progressArr.filter((p: any) => p.time_spent_minutes > 0).length)
      : 1;

    const comprehensionScore = avgQuizScore / 100;
    const completionRate = progressPct;
    const resourceEfficiency = Math.min(1, progressArr.length / Math.max(1, totalNodes) + 0.5);
    const efficiencyScore = Math.round(((timeEfficiency * 0.3 + comprehensionScore * 0.3 + completionRate * 0.2 + resourceEfficiency * 0.2)) * 100);

    const lastActivityDate = progressArr.length > 0
      ? progressArr.map((p: any) => new Date(p.created_at)).sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
      : null;
    const daysSinceLastActive = lastActivityDate
      ? Math.ceil((Date.now() - lastActivityDate.getTime()) / 86400000)
      : 30;
    const loginRisk = daysSinceLastActive > 7 ? 0.3 : 0;
    const paceRisk = pacePerDay < 0.05 ? 0.3 : 0;
    const quizRisk = avgQuizScore < 50 ? 0.2 : 0;
    const streakBroken = !progressArr.some((p: any) => {
      const d = new Date(p.created_at);
      const now = new Date();
      return Math.ceil((now.getTime() - d.getTime()) / 86400000) <= 1;
    }) ? 0.2 : 0;
    const dropoutRisk = Math.round(Math.min(1, loginRisk + paceRisk + quizRisk + streakBroken) * 100);

    return NextResponse.json({
      predictedCompletionDate: predictedDate.toISOString().split("T")[0],
      targetDate: targetDate.toISOString().split("T")[0],
      estimatedDaysRemaining,
      onTrack,
      efficiencyScore,
      avgQuizScore: Math.round(avgQuizScore),
      pacePerDay: Math.round(pacePerDay * 100) / 100,
      completedCount,
      totalNodes,
      dropoutRisk,
      daysSinceLastActive,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Prediction failed" }, { status: 500 });
  }
}
