import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roadmapId } = await req.json();
    if (!roadmapId) return NextResponse.json({ error: "roadmapId required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: roadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const { data: nextNodes } = await serviceClient
      .from("roadmap_nodes")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .eq("status", "active")
      .order("order_index")
      .limit(3);

    const { data: inProgress } = await serviceClient
      .from("roadmap_nodes")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .eq("status", "in_progress")
      .order("order_index")
      .limit(3);

    const { data: completedNodes } = await serviceClient
      .from("roadmap_nodes")
      .select("title, xp_reward")
      .eq("roadmap_id", roadmapId)
      .eq("status", "completed")
      .order("order_index");

    const { data: recentQuizzes } = await serviceClient
      .from("quiz_sessions")
      .select("score")
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmapId)
      .order("created_at", { ascending: false })
      .limit(5);

    const weakAreas = recentQuizzes && recentQuizzes.length > 0
      ? recentQuizzes.filter((q: any) => (q.score || 0) < 60).length
      : 0;

    const planner = await parseJSONFromAI<{
      date: string;
      focus: string;
      motivation: string;
      blocks: {
        time: string;
        duration_minutes: number;
        activity: string;
        node_title: string;
        type: "learn" | "practice" | "quiz" | "project" | "review";
        description: string;
        tips: string;
      }[];
      total_minutes: number;
      xp_estimate: number;
    }>(
      `Create a detailed daily study plan for a learner with these constraints:
      
ROADMAP: "${roadmap.title}"
GOAL: "${roadmap.goal_description}"
SKILL LEVEL: ${roadmap.skill_level}
LEARNING STYLE: ${roadmap.learning_style}
HOURS PER WEEK: ${roadmap.hours_per_week}
      
NEXT TOPICS TO STUDY: ${JSON.stringify(nextNodes?.map((n: any) => ({ title: n.title, difficulty: n.difficulty, type: n.node_type })) || [])}
IN PROGRESS: ${JSON.stringify(inProgress?.map((n: any) => n.title) || [])}
ALREADY COMPLETED: ${JSON.stringify(completedNodes?.map((n: any) => n.title) || [])}
${weakAreas > 0 ? `WARNING: ${weakAreas} recent quizzes had low scores — include review/remediation.` : ""}

TODAY: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}

Create a study plan that:
1. Starts with a quick review (5-10 min) of previously learned material
2. Introduces the next topic from the roadmap
3. Includes hands-on practice
4. Ends with a quick quiz or recap
5. Fits within ${roadmap.hours_per_week / 7}h available today
6. Includes specific resource suggestions (what to read, watch, or build)
7. Removes decision fatigue — every block is fully specified

Return ONLY valid JSON.`,
      "You are a study planner that creates structured daily learning plans. Remove all decision fatigue — specify exactly what to do in each block."
    );

    const today = new Date().toISOString().split("T")[0];

    await serviceClient.from("daily_goals").upsert({
      user_id: user.id,
      roadmap_id: roadmapId,
      date: today,
      goal_description: planner.focus,
      target_nodes: planner.blocks.filter((b) => b.node_title).map((b) => b.node_title),
      completed: false,
      xp_earned: 0,
    }, { onConflict: "user_id,date,roadmap_id" });

    return NextResponse.json(planner);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate daily plan" }, { status: 500 });
  }
}
