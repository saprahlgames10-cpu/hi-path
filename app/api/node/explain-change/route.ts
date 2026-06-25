import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { callAI } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { changeLog, version, roadmapTitle, totalNodes, completedNodes } = await req.json();

    if (!changeLog || changeLog.length === 0) {
      return NextResponse.json({ explanation: "This is the first version of your roadmap." });
    }

    const summary = changeLog.map((c: any) => `- ${c.reason}: ${(c.changes || []).join(", ")}`).join("\n");

    const explanation = await callAI(
      `The user's learning roadmap "${roadmapTitle}" (v${version}) was recently updated. ${completedNodes}/${totalNodes} nodes are completed.
      Changes made this version:
      ${summary}
      Explain in 2-3 sentences why these changes were made to help the user understand the adaptation. Focus on how it improves their learning path.
      Make it personal and encouraging.`,
      "You are PathForge AI, a learning roadmap assistant. Explain roadmap adaptations clearly and encouragingly."
    );

    return NextResponse.json({ explanation, version });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to explain changes" }, { status: 500 });
  }
}
