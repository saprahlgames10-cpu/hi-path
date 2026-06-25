import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nodeId, title, description, applicationType, skillsUsed } = await req.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data, error } = await serviceClient.from("real_world_applications").insert({
      user_id: user.id,
      node_id: nodeId || null,
      title,
      description: description || "",
      application_type: applicationType || "project",
      skills_used: skillsUsed || [],
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ message: "Application logged", application: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log application" }, { status: 500 });
  }
}
