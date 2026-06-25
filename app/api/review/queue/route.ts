import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nodeId, roadmapId } = await req.json();
    if (!nodeId || !roadmapId) return NextResponse.json({ error: "nodeId and roadmapId required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const existing = await serviceClient
      .from("review_queue")
      .select("*")
      .eq("user_id", user.id)
      .eq("node_id", nodeId)
      .single();

    if (existing.data) {
      return NextResponse.json({ message: "Already in review queue", item: existing.data });
    }

    const { data, error } = await serviceClient.from("review_queue").insert({
      user_id: user.id,
      node_id: nodeId,
      roadmap_id: roadmapId,
      due_at: new Date().toISOString(),
      interval_days: 3,
      ease_factor: 2.5,
      repetitions: 0,
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ message: "Added to review queue", item: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add to queue" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = getServiceClient();

    const { data, error } = await serviceClient
      .from("review_queue")
      .select("*, roadmap_nodes:node_id(*)")
      .eq("user_id", user.id)
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items: data || [], count: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch queue" }, { status: 500 });
  }
}
