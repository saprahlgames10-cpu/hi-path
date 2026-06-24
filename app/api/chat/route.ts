import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAIStreaming } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, roadmapId } = await req.json();
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const serviceClient = getServiceClient();
    let context = "No active roadmap.";

    if (roadmapId) {
      const { data: roadmap } = await serviceClient
        .from("roadmaps")
        .select("*")
        .eq("id", roadmapId)
        .single();

      const { data: nodes } = await serviceClient
        .from("roadmap_nodes")
        .select("*")
        .eq("roadmap_id", roadmapId)
        .order("order_index");

      const { data: progress } = await serviceClient
        .from("user_progress")
        .select("*")
        .eq("roadmap_id", roadmapId)
        .eq("user_id", user.id);

      context = JSON.stringify({
        roadmap: roadmap ? { title: roadmap.title, progress: roadmap.overall_progress, completed: roadmap.completed_nodes, total: roadmap.total_nodes } : null,
        nodes: nodes?.map((n: any) => ({ title: n.title, status: n.status, type: n.node_type })) || [],
        progress: progress?.length || 0,
      });
    }

    const systemPrompt = `You are PathForge AI, a personal learning coach. You have full context of the user's learning journey. Be encouraging, specific, and practical. Only answer questions related to the user's learning path. If asked something unrelated, redirect to their roadmap. Context: ${context}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        await callAIStreaming(
          message,
          systemPrompt,
          (token: string) => {
            controller.enqueue(encoder.encode(token));
          }
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Chat failed" }, { status: 500 });
  }
}
