import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/anthropic";
import type { GeneratedRoadmap } from "@/types";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roadmapId } = await req.json();
    if (!roadmapId) return NextResponse.json({ error: "roadmapId required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: oldRoadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (!oldRoadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const { data: oldNodes } = await serviceClient
      .from("roadmap_nodes")
      .select("title, status")
      .eq("roadmap_id", roadmapId)
      .order("order_index");

    const completedNodes = oldNodes?.filter((n: any) => n.status === "completed").map((n: any) => n.title) || [];
    const remainingNodes = oldNodes?.filter((n: any) => n.status !== "completed").map((n: any) => n.title) || [];

    const newRoadmap = await parseJSONFromAI<GeneratedRoadmap>(
      `Regenerate this learning roadmap with updated content based on the learner's progress.
      Original goal: "${oldRoadmap.goal_description}"
      Current skill level: ${oldRoadmap.skill_level}
      Hours per week: ${oldRoadmap.hours_per_week}
      Learning style: ${oldRoadmap.learning_style}
      
      Nodes already completed (skip these): ${completedNodes.join(", ") || "none"}
      Nodes remaining (may revise): ${remainingNodes.join(", ") || "none"}
      
      Create an updated roadmap with the same total duration (${oldRoadmap.duration_weeks} weeks) but adjust content to reflect progress.
      Return JSON: { title: string, summary: string, phases: [{ phase_number: number, title: string, description: string, duration_weeks: number, nodes: [{ title: string, description: string, node_type: string, difficulty: string, estimated_hours: number, xp_reward: number, resources: [{ title: string, url: string, type: string, is_free: boolean }], ai_explanation: string }] }] }`,
      "You are a learning path optimizer. Regenerate roadmaps based on learner progress, keeping completed nodes, adjusting remaining ones."
    );

    const { data: oldPhases } = await serviceClient
      .from("roadmap_phases")
      .select("id, title, phase_number")
      .eq("roadmap_id", roadmapId)
      .order("order_index");

    const oldPhaseTitles = oldPhases?.map((p: any) => p.title) || [];

    const changes: string[] = [];
    const newPhaseTitles = newRoadmap.phases.map((p: any) => p.title);
    newPhaseTitles.forEach((t: string) => { if (!oldPhaseTitles.includes(t)) changes.push(`Added phase "${t}"`); });
    oldPhaseTitles.forEach((t: string) => { if (!newPhaseTitles.includes(t)) changes.push(`Removed phase "${t}"`); });

    const newVersion = (oldRoadmap.version || 1) + 1;
    const changeLog = [
      ...(Array.isArray(oldRoadmap.change_log) ? oldRoadmap.change_log : []),
      {
        version: newVersion,
        changed_at: new Date().toISOString(),
        changes,
        reason: "Roadmap regenerated based on your progress and updated goals.",
      },
    ];

    const { data: updatedRoadmap, error: updateErr } = await serviceClient
      .from("roadmaps")
      .update({
        title: newRoadmap.title,
        ai_summary: newRoadmap.summary,
        version: newVersion,
        previous_version_id: roadmapId,
        change_log: changeLog,
        status: "active",
        goal_description: oldRoadmap.goal_description,
      })
      .eq("id", roadmapId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await serviceClient.from("roadmap_phases").delete().eq("roadmap_id", roadmapId);
    await serviceClient.from("roadmap_nodes").delete().eq("roadmap_id", roadmapId);

    for (const phase of newRoadmap.phases) {
      const { data: newPhase } = await serviceClient.from("roadmap_phases").insert({
        roadmap_id: roadmapId,
        phase_number: phase.phase_number,
        title: phase.title,
        description: phase.description || "",
        duration_weeks: phase.duration_weeks,
        order_index: phase.phase_number - 1,
        status: phase.phase_number === 1 ? "active" : "locked",
      }).select().single();

      if (newPhase) {
        for (let i = 0; i < phase.nodes.length; i++) {
          const node = phase.nodes[i];
          await serviceClient.from("roadmap_nodes").insert({
            user_id: user.id,
            phase_id: newPhase.id,
            roadmap_id: roadmapId,
            title: node.title,
            description: node.description || "",
            node_type: node.node_type || "concept",
            difficulty: node.difficulty || "medium",
            estimated_hours: node.estimated_hours || 1,
            order_index: i,
            status: "active",
            xp_reward: node.xp_reward || 50,
            ai_explanation: node.ai_explanation || "",
            resources: node.resources || [],
            prerequisites: [],
          });
        }
      }
    }

    const totalNewNodes = newRoadmap.phases.reduce((sum: number, p: any) => sum + p.nodes.length, 0);
    await serviceClient.from("roadmaps").update({
      total_nodes: totalNewNodes,
      completed_nodes: 0,
      overall_progress: 0,
    }).eq("id", roadmapId);

    return NextResponse.json({ roadmap: updatedRoadmap, changes, version: newVersion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Regeneration failed" }, { status: 500 });
  }
}
