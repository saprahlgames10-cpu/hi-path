import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goal } = await req.json();
    if (!goal) return NextResponse.json({ error: "Goal is required" }, { status: 400 });

    const parsed = await parseJSONFromAI<{
      targetRole: string;
      seniority: string;
      industry: string;
      requiredSkills: string[];
      estimatedMonths: number;
      marketDemand: string;
      subGoals: string[];
    }>(
      `Parse this learning goal into structured data: "${goal}".
      Identify the target job role, seniority level (beginner/junior/mid/senior), relevant industry, required key skills for that role, estimated months to achieve competency, current market demand (high/medium/low), and sub-goals or milestones.
      Return ONLY valid JSON.`,
      "You are a career path analyst. Parse learning goals into structured career data."
    );

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to parse goal" }, { status: 500 });
  }
}
