import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nodeId, roadmapId } = await req.json();
    const serviceClient = getServiceClient();

    const { data: progress } = await serviceClient
      .from("user_progress")
      .select("score, status, created_at")
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmapId)
      .neq("score", null)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: node } = await serviceClient
      .from("roadmap_nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

    const scores = progress?.map((p: any) => p.score) || [];
    const avgRecentScore = scores.length > 0
      ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      : 70;

    let difficulty = "medium";
    if (avgRecentScore < 45) difficulty = "easy";
    else if (avgRecentScore < 65) difficulty = "medium";
    else difficulty = "hard";

    const questionsJson = await callAI(
      `Generate 5 quiz questions for the topic "${node.title}" (difficulty: ${difficulty}).
      Context: ${node.content || ""}
      Return a JSON array of objects with fields: question (string), options (array of 4 strings), correctAnswer (0-3 index), explanation (string).
      Difficulty ${difficulty} means: ${difficulty === "easy" ? "basic recall, straightforward" : difficulty === "hard" ? "complex application, multi-step reasoning" : "balanced mix of recall and application"}
      Average recent user score: ${Math.round(avgRecentScore)}%. Tailor difficulty so the user can succeed but is challenged.
      Return ONLY the JSON array, no markdown formatting.`,
      "You create adaptive quiz questions that match the learner's current proficiency level."
    );

    let questions;
    try {
      const cleaned = questionsJson.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      questions = JSON.parse(questionsJson);
    }

    const sessionId = crypto.randomUUID();

    await serviceClient.from("quiz_sessions").insert({
      id: sessionId,
      user_id: user.id,
      roadmap_id: roadmapId,
      node_id: nodeId,
      difficulty,
      questions_count: 5,
      status: "in_progress",
    });

    return NextResponse.json({ sessionId, difficulty, questions, avgRecentScore: Math.round(avgRecentScore) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
