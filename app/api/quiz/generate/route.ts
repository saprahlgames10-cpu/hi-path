import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/anthropic";
import type { AIQuizResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nodeId, difficulty } = await req.json();
    if (!nodeId) return NextResponse.json({ error: "nodeId is required" }, { status: 400 });

    const serviceClient = getServiceClient();
    const { data: node } = await serviceClient
      .from("roadmap_nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

    const questions = await parseJSONFromAI<AIQuizResponse>(
      `Generate 5 multiple-choice quiz questions for the topic: "${node.title}". Description: "${node.description}". Difficulty: ${difficulty || "easy"}. Target: beginner learner. Return ONLY JSON: { questions: [{ id: string, question: string, options: [string, string, string, string], correct_answer: string, explanation: string }] }`,
      "You are creating a quiz to test understanding of a learning topic."
    );

    const { data: session, error } = await serviceClient
      .from("quiz_sessions")
      .insert({
        user_id: user.id,
        node_id: nodeId,
        roadmap_id: node.roadmap_id,
        questions: questions.questions,
        user_answers: [],
        score: 0,
        passed: false,
        time_taken_seconds: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ sessionId: session.id, questions: questions.questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  }
}
