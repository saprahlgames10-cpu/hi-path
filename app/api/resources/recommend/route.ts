import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";
import { parseJSONFromAI } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic, skillLevel, learningStyle, maxResults } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const level = skillLevel || "beginner";
    const style = learningStyle || "mixed";
    const count = maxResults || 8;

    const resources = await parseJSONFromAI<{
      resources: {
        title: string;
        url: string;
        type: "video" | "article" | "book" | "course" | "documentation";
        platform: string;
        description: string;
        duration: string;
        quality: number;
        beginnerFriendly: number;
        popularity: number;
        is_free: boolean;
        why_recommended: string;
      }[];
    }>(
      `Find the best learning resources for "${topic}" at the ${level} level.
      
LEARNING STYLE PREFERENCE: ${style} (visual=prefer videos, reading=prefer articles/docs, hands-on=prefer projects/tutorials, mixed=balanced)

For each resource, provide:
- title: the resource title
- url: real URL (youtube.com, freecodecamp.org, developer.mozilla.org, docs.python.org, udemy.com, coursera.org, etc.)
- type: video/article/book/course/documentation
- platform: YouTube, freeCodeCamp, MDN, Python Docs, Coursera, Udemy, etc.
- description: what this resource covers
- duration: e.g. "20 min", "3 hours", "10 chapters"
- quality: 1-10 score (production value, instructor quality)
- beginnerFriendly: 1-10 score (how accessible for ${level}s)
- popularity: 1-10 score (how widely used/recommended)
- is_free: boolean
- why_recommended: 1 sentence why this is good for a ${level} learning ${topic}

Rank by quality × beginnerFriendliness. Only include real, well-known resources.
Return exactly ${count} resources. Return ONLY valid JSON.`,
      "You are a learning resource curator. Find the highest-quality, most beginner-friendly resources for any topic."
    );

    return NextResponse.json({
      topic,
      skillLevel: level,
      total: resources.resources.length,
      resources: resources.resources.sort((a, b) => {
        const scoreA = a.quality * a.beginnerFriendly;
        const scoreB = b.quality * b.beginnerFriendly;
        return scoreB - scoreA;
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to find resources" }, { status: 500 });
  }
}
