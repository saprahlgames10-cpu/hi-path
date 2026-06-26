import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI, parseJSONFromAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nodeId } = await req.json();
    if (!nodeId) return NextResponse.json({ error: "nodeId is required" }, { status: 400 });

    const serviceClient = getServiceClient();
    const { data: node } = await serviceClient
      .from("roadmap_nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

    const explanation = await callAI(
      `Explain this topic in a beginner-friendly way: "${node.title}". Topic description: "${node.description}". Include analogies and simple examples. Write 2-3 paragraphs.`,
      "You are a patient and knowledgeable tutor. Explain concepts clearly and simply."
    );

    const exercisesResult = await parseJSONFromAI<{ exercises: { question: string; answer: string }[] }>(
      `Create 3 practice exercises for this topic: "${node.title}". Return ONLY JSON: { exercises: [{ question: string, answer: string }] }`,
      "Generate practical exercises to test understanding."
    );

    await serviceClient
      .from("roadmap_nodes")
      .update({ ai_explanation: explanation })
      .eq("id", nodeId);

    return NextResponse.json({ explanation, exercises: exercisesResult.exercises });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate explanation" }, { status: 500 });
  }
}
