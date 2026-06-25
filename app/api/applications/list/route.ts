import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("nodeId");
    const limit = parseInt(searchParams.get("limit") || "20");

    const serviceClient = getServiceClient();
    let query = serviceClient
      .from("real_world_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (nodeId) query = query.eq("node_id", nodeId);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ applications: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch applications" }, { status: 500 });
  }
}
