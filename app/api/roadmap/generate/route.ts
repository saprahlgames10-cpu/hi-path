import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/anthropic";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roadmapId } = await req.json();
    if (!roadmapId) return NextResponse.json({ error: "roadmapId required" }, { status: 400 });

    const serviceClient = getServiceClient();

    const { data: roadmap } = await serviceClient
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const generated = await parseJSONFromAI<{
      title: string;
      summary: string;
      phases: {
        phase_number: number;
        title: string;
        description: string;
        duration_weeks: number;
        milestone: string;
        nodes: {
          title: string;
          description: string;
          node_type: "concept" | "project" | "quiz" | "resource" | "milestone";
          difficulty: "easy" | "medium" | "hard";
          estimated_hours: number;
          xp_reward: number;
          prerequisites: string[];
          resources: { title: string; url: string; type: "video" | "article" | "book" | "course"; is_free: boolean }[];
          ai_explanation: string;
          project_suggestion?: string;
        }[];
      }[];
    }>(
      `Generate a detailed learning roadmap for someone who wants to: "${roadmap.goal_description}"

SKILL LEVEL: ${roadmap.skill_level}
LEARNING STYLE: ${roadmap.learning_style}
HOURS PER WEEK: ${roadmap.hours_per_week}
TOTAL DURATION: ${roadmap.duration_weeks} weeks

CRITICAL: Apply the Knowledge Dependency Engine — every node MUST list its prerequisites (titles of nodes that must be completed first). This ensures the user never learns a topic before its prerequisites.

For example, if the user wants to learn AI:
- "Python Basics" must be a prerequisite for "Functions & OOP"
- "Functions & OOP" must be a prerequisite for "APIs & Data Structures"  
- "APIs & Data Structures" must be a prerequisite for "Machine Learning"
- "Machine Learning" must be a prerequisite for "AI Agents"

The dependency chain must be VALID — no circular dependencies, every prerequisite must exist in an earlier phase.

For each node, include:
- node_type (concept/project/quiz/resource/milestone)
- difficulty (easy/medium/hard based on skill_level)
- estimated_hours (realistic for the skill level)
- xp_reward (10-100 based on difficulty)
- prerequisites (array of node titles that must come before)
- resources (2-3 actual resources: YouTube URLs, article URLs, documentation URLs — use real URLs like youtube.com/watch?v=..., developer.mozilla.org, docs.python.org, freecodecamp.org, etc.)
- ai_explanation (clear explanation of why this topic matters)
- project_suggestion (a small project to practice this specific topic)

Return ONLY valid JSON.`,
      "You are a senior curriculum designer building dependency-ordered learning roadmaps. Every node must have valid prerequisites."
    );

    // Build dependency validation
    const allNodeTitles = new Set<string>();
    generated.phases.forEach((p) => p.nodes.forEach((n) => allNodeTitles.add(n.title)));

    const errors: string[] = [];
    const orderMap = new Map<string, number>();

    generated.phases.forEach((p) => {
      p.nodes.forEach((n, i) => {
        const globalIndex = (p.phase_number - 1) * 100 + i;
        orderMap.set(n.title, globalIndex);
      });
    });

    for (const phase of generated.phases) {
      for (const node of phase.nodes) {
        if (node.prerequisites && node.prerequisites.length > 0) {
          for (const prereq of node.prerequisites) {
            if (!allNodeTitles.has(prereq)) {
              errors.push(`Prerequisite "${prereq}" for "${node.title}" does not exist in the roadmap.`);
            } else {
              const prereqIndex = orderMap.get(prereq) || 0;
              const nodeIndex = orderMap.get(node.title) || 0;
              if (prereqIndex >= nodeIndex) {
                errors.push(`Circular dependency: "${prereq}" must come before "${node.title}".`);
              }
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Dependency engine detected issues", details: errors }, { status: 400 });
    }

    const totalNodes = generated.phases.reduce((sum, p) => sum + p.nodes.length, 0);

    await serviceClient.from("roadmaps").update({
      title: generated.title,
      ai_summary: generated.summary,
      total_nodes: totalNodes,
      completed_nodes: 0,
      overall_progress: 0,
      status: "active",
    }).eq("id", roadmapId);

    await serviceClient.from("roadmap_phases").delete().eq("roadmap_id", roadmapId);
    await serviceClient.from("roadmap_nodes").delete().eq("roadmap_id", roadmapId);

    for (const phase of generated.phases) {
      const { data: newPhase } = await serviceClient.from("roadmap_phases").insert({
        roadmap_id: roadmapId,
        phase_number: phase.phase_number,
        title: phase.title,
        description: phase.description,
        duration_weeks: phase.duration_weeks,
        order_index: phase.phase_number - 1,
        status: phase.phase_number === 1 ? "active" : "locked",
      }).select().single();

      if (newPhase) {
        for (let i = 0; i < phase.nodes.length; i++) {
          const node = phase.nodes[i];
          await serviceClient.from("roadmap_nodes").insert({
            user_id: user.id,
            phase_id: newPhase.id,
            roadmap_id: roadmapId,
            title: node.title,
            description: JSON.stringify({
              content: node.description,
              aiExplanation: node.ai_explanation,
              projectSuggestion: node.project_suggestion || "",
              resources: node.resources || [],
            }),
            node_type: node.node_type,
            difficulty: node.difficulty,
            estimated_hours: node.estimated_hours,
            order_index: i,
            status: "active",
            xp_reward: node.xp_reward || 50,
            ai_explanation: node.ai_explanation || "",
            resources: node.resources || [],
            prerequisites: node.prerequisites || [],
          });
        }
      }
    }

    return NextResponse.json({
      roadmap: generated,
      totalNodes,
      phases: generated.phases.length,
      dependenciesValidated: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
  }
}
