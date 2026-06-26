import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/anthropic";
import type { WeaknessReport } from "@/types";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roadmapId } = await req.json();
    if (!roadmapId) return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: progress } = await serviceClient
      .from("user_progress")
      .select("*, roadmap_nodes:node_id(*)")
      .eq("roadmap_id", roadmapId)
      .eq("user_id", user.id);

    const { data: quizzes } = await serviceClient
      .from("quiz_sessions")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .eq("user_id", user.id)
      .lt("score", 70);

    const performanceData = {
      totalProgress: progress?.length || 0,
      struggled: progress?.filter((p: any) => p.status === "struggled") || [],
      lowScoreQuizzes: quizzes || [],
      completed: progress?.filter((p: any) => p.status === "completed") || [],
    };

    const report = await parseJSONFromAI<any>(
      `Analyze this learner's performance data and identify weaknesses. Data: ${JSON.stringify(performanceData)}. Return ONLY JSON: { weak_topics: [{topic: string, score: number, reason: string, suggested_nodes: string[]}], strong_topics: [{topic: string, score: number}], analysis: string, recommendations: [{action: string, priority: "high"|"medium"|"low", node_title: string}] }`,
      "You are an educational analyst. Identify knowledge gaps and recommend improvements."
    );

    const { data: savedReport, error } = await serviceClient
      .from("weakness_reports")
      .insert({
        user_id: user.id,
        roadmap_id: roadmapId,
        weak_topics: report.weak_topics || [],
        strong_topics: report.strong_topics || [],
        ai_analysis: report.analysis || "",
        recommendations: report.recommendations || [],
      })
      .select()
      .single();

    if (error) throw error;

    await serviceClient.from("notifications").insert({
      user_id: user.id,
      type: "weakness_detected",
      title: "Weakness Analysis Complete",
      message: `We found ${(report.weak_topics || []).length} areas to improve. Check your weaknesses dashboard.`,
      action_url: "/dashboard/weaknesses",
    });

    return NextResponse.json(savedReport);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to analyze weaknesses" }, { status: 500 });
  }
}
