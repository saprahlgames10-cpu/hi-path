import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roadmapId } = await req.json();
    if (!roadmapId) return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: report } = await serviceClient
      .from("weakness_reports")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (!report || !report.recommendations) {
      return NextResponse.json({ message: "No weakness report found" });
    }

    const highPriority = report.recommendations.filter((r: any) => r.priority === "high");

    for (const rec of highPriority) {
      const content = await callAI(
        `Create a detailed learning node for the topic: "${rec.action}". Provide: title, description, estimated_hours (number), resources array with 2-3 items. Return as simple JSON.`,
        "You are creating a reinforcement learning node for a student who is struggling. Keep it practical and focused."
      );

      let nodeData;
      try {
        const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        nodeData = JSON.parse(cleaned);
      } catch {
        nodeData = { title: rec.action, description: `Reinforcement learning for ${rec.action}`, estimated_hours: 2, resources: [] };
      }

      const { data: lastNode } = await serviceClient
        .from("roadmap_nodes")
        .select("order_index, phase_id")
        .eq("roadmap_id", roadmapId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      await serviceClient.from("roadmap_nodes").insert({
        phase_id: lastNode?.phase_id,
        roadmap_id: roadmapId,
        user_id: user.id,
        title: nodeData.title || rec.action,
        description: nodeData.description || `Reinforcement: ${rec.action}`,
        node_type: "concept",
        difficulty: "easy",
        estimated_hours: nodeData.estimated_hours || 2,
        order_index: (lastNode?.order_index || 0) + 1,
        status: "active",
        xp_reward: 30,
        resources: nodeData.resources || [],
        prerequisites: [],
      });
    }

    await serviceClient.from("notifications").insert({
      user_id: user.id,
      type: "roadmap_adjusted",
      title: "Roadmap Updated",
      message: `Your roadmap was updated based on your recent performance. ${highPriority.length} new reinforcement nodes added.`,
      action_url: `/dashboard/roadmap/${roadmapId}`,
    });

    return NextResponse.json({ adjusted: true, nodesAdded: highPriority.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to adjust roadmap" }, { status: 500 });
  }
}
