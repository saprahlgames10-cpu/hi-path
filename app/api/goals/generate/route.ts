import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/anthropic";
import type { AIDailyGoal } from "@/types";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roadmapId } = await req.json();
    if (!roadmapId) return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: roadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .single();

    const { data: nextNodes } = await serviceClient
      .from("roadmap_nodes")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .in("status", ["active", "in_progress"])
      .order("order_index")
      .limit(3);

    const dailyGoal = await parseJSONFromAI<AIDailyGoal>(
      `Given this learner's roadmap and current position, generate one focused daily learning goal. Context: Roadmap: "${roadmap?.title}". Next nodes: ${JSON.stringify(nextNodes?.map((n: any) => n.title) || [])}`,
      "Return ONLY JSON: { goal_description: string, target_nodes: string[], estimated_time_minutes: number, motivation_message: string }"
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: existingGoal } = await serviceClient
      .from("daily_goals")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("roadmap_id", roadmapId)
      .maybeSingle();

    if (existingGoal) {
      await serviceClient.from("daily_goals").update({
        goal_description: dailyGoal.goal_description,
        target_nodes: dailyGoal.target_nodes || [],
      }).eq("id", existingGoal.id);

      return NextResponse.json({ ...dailyGoal, existing: true });
    }

    const { data: saved, error } = await serviceClient
      .from("daily_goals")
      .insert({
        user_id: user.id,
        roadmap_id: roadmapId,
        date: today,
        goal_description: dailyGoal.goal_description,
        target_nodes: dailyGoal.target_nodes || [],
        completed: false,
        xp_earned: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...dailyGoal, id: saved.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate daily goal" }, { status: 500 });
  }
}
