import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get("roadmapId");
    if (!roadmapId) return NextResponse.json({ error: "roadmapId required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: roadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const { data: currentPhases } = await serviceClient
      .from("roadmap_phases")
      .select("*, roadmap_nodes:*")
      .eq("roadmap_id", roadmapId)
      .order("order_index");

    let previousRoadmap = null;
    let previousPhases = null;

    if (roadmap.previous_version_id) {
      const { data: prev } = await serviceClient
        .from("roadmaps")
        .select("*")
        .eq("id", roadmap.previous_version_id)
        .single();
      previousRoadmap = prev;

      if (prev) {
        const { data: prevPh } = await serviceClient
          .from("roadmap_phases")
          .select("*, roadmap_nodes:*")
          .eq("roadmap_id", prev.id)
          .order("order_index");
        previousPhases = prevPh;
      }
    }

    const current = currentPhases || [];
    const previous = previousPhases || [];

    const currentNodes = current.flatMap((p: any) => p.roadmap_nodes || []).map((n: any) => n.title);
    const previousNodes = previous.flatMap((p: any) => p.roadmap_nodes || []).map((n: any) => n.title);

    const newNodes = currentNodes.filter((t: string) => !previousNodes.includes(t));
    const removedNodes = previousNodes.filter((t: string) => !currentNodes.includes(t));
    const unchangedNodes = currentNodes.filter((t: string) => previousNodes.includes(t));

    return NextResponse.json({
      version: roadmap.version,
      changeLog: roadmap.change_log,
      summary: {
        totalCurrent: currentNodes.length,
        totalPrevious: previousNodes.length,
        newNodes,
        removedNodes,
        unchangedNodes,
        totalChanges: newNodes.length + removedNodes.length,
      },
      currentPhases: current,
      previousPhases: previous || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Compare failed" }, { status: 500 });
  }
}
