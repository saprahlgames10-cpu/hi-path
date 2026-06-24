import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/openrouter";
import type { GeneratedRoadmap } from "@/types";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goal, skillLevel, hoursPerWeek, durationWeeks, learningStyle } = await req.json();

    if (!goal) return NextResponse.json({ error: "Goal is required" }, { status: 400 });

    const systemPrompt = "You are an expert curriculum designer and learning coach. Generate a complete, structured learning roadmap as valid JSON only. No markdown, no explanation outside the JSON. The roadmap must be realistic, progressive, and tailored to the user's input.";

    const prompt = `Create a complete learning roadmap for: ${goal}
Skill level: ${skillLevel}
Hours per week: ${hoursPerWeek}
Duration: ${durationWeeks} weeks
Learning style: ${learningStyle}

Return ONLY a JSON object with this exact structure:
{
  title: string,
  summary: string,
  phases: [
    {
      phase_number: number,
      title: string,
      description: string,
      duration_weeks: number,
      nodes: [
        {
          title: string,
          description: string,
          node_type: "concept"|"project"|"quiz"|"resource"|"milestone",
          difficulty: "easy"|"medium"|"hard",
          estimated_hours: number,
          xp_reward: number,
          resources: [{title: string, url: string, type: "video"|"article"|"book"|"course", is_free: boolean}],
          ai_explanation: string
        }
      ]
    }
  ]
}`;

    const roadmapData = await parseJSONFromAI<GeneratedRoadmap>(prompt, systemPrompt);

    const serviceClient = getServiceClient();

    const { data: existing } = await serviceClient
      .from("roadmaps")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      await serviceClient.from("roadmaps").update({ status: "archived" }).eq("id", existing.id);
    }

    const totalNodes = roadmapData.phases.reduce((sum, p) => sum + p.nodes.length, 0);

    const { data: roadmap, error: roadmapError } = await serviceClient
      .from("roadmaps")
      .insert({
        user_id: user.id,
        title: roadmapData.title,
        goal_description: goal,
        duration_weeks: durationWeeks,
        skill_level: skillLevel,
        learning_style: learningStyle,
        hours_per_week: hoursPerWeek,
        status: "active",
        ai_summary: roadmapData.summary,
        total_nodes: totalNodes,
        completed_nodes: 0,
        overall_progress: 0,
      })
      .select()
      .single();

    if (roadmapError || !roadmap) throw new Error("Failed to create roadmap");

    let nodeIndex = 0;
    for (const phase of roadmapData.phases) {
      const { data: phaseRecord, error: phaseError } = await serviceClient
        .from("roadmap_phases")
        .insert({
          roadmap_id: roadmap.id,
          phase_number: phase.phase_number,
          title: phase.title,
          description: phase.description,
          duration_weeks: phase.duration_weeks,
          order_index: phase.phase_number - 1,
          status: phase.phase_number === 1 ? "active" : "locked",
        })
        .select()
        .single();

      if (phaseError || !phaseRecord) throw new Error("Failed to create phase");

      for (const node of phase.nodes) {
        const nodeStatus = phase.phase_number === 1 && nodeIndex < 3 ? "active" : (phase.phase_number === 1 ? "active" : "locked");

        const { error: nodeError } = await serviceClient
          .from("roadmap_nodes")
          .insert({
            phase_id: phaseRecord.id,
            roadmap_id: roadmap.id,
            user_id: user.id,
            title: node.title,
            description: node.description,
            node_type: node.node_type,
            difficulty: node.difficulty,
            estimated_hours: node.estimated_hours,
            order_index: nodeIndex,
            status: nodeIndex < 3 ? "active" : "locked",
            xp_reward: node.xp_reward || 50,
            resources: node.resources || [],
            prerequisites: [],
          });

        if (nodeError) throw new Error("Failed to create node");
        nodeIndex++;
      }
    }

    return NextResponse.json({ roadmapId: roadmap.id, title: roadmapData.title, summary: roadmapData.summary, phases: roadmapData.phases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
  }
}
