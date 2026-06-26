import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI } from "@/lib/anthropic";

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

      const { data: quizzes } = await serviceClient
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId)
        .order("created_at", { ascending: false })
        .limit(5);

      const nextNode = nodes?.find((n: any) => n.status === "active" || n.status === "in_progress");
      const completedNodes = nodes?.filter((n: any) => n.status === "completed").length || 0;
      const weakQuizzes = quizzes?.filter((q: any) => (q.score || 0) < 60).length || 0;

      context = JSON.stringify({
        title: roadmap?.title,
        progress: roadmap?.overall_progress,
        completed: completedNodes,
        total: roadmap?.total_nodes,
        nextTopic: nextNode?.title || "All done!",
        nextTopicType: nextNode?.node_type || "",
        nextTopicDifficulty: nextNode?.difficulty || "",
        weakQuizCount: weakQuizzes,
        totalQuizzes: quizzes?.length || 0,
        goalDescription: roadmap?.goal_description,
        skillLevel: roadmap?.skill_level,
        learningStyle: roadmap?.learning_style,
      });
    }

    const systemPrompt = `You are PathForge AI, a personal learning coach inside HiPath, an AI-powered learning roadmap SaaS.
You have full context of the user's learning journey. Be encouraging, specific, and practical.

CONTEXT:
${context}

RULES:
1. If asked "explain my next topic" — explain ${context ? "the next topic from their roadmap" : "what a learning roadmap is"} in simple terms, with examples.
2. If asked "what should I study today" — suggest a specific 30-60 minute study session with concrete topics.
3. If asked "where am I struggling" — analyze based on quiz scores and completed nodes.
4. If asked "quiz me" — generate 3 quick questions with answers.
5. If asked about career or motivation — relate their answer to their goal.
6. Keep responses concise (2-4 paragraphs max).
7. Always end with an encouraging note or a question to continue the conversation.`;

    const content = await callAI(message, systemPrompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(content));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    const encoder = new TextEncoder();
    const errorMsg = error.message?.includes("AI service unavailable")
      ? "I'm having trouble connecting right now. All AI models are temporarily unavailable. Please try again in a few minutes."
      : "I couldn't process that. Let me try again — please rephrase your question or ask something about your learning path.";

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
