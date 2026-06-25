import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { nodeId, durationSeconds, distractedSeconds, energyLevel, mood, completed } = await req.json();
    const serviceClient = getServiceClient();

    const { data: session, error } = await serviceClient.from("focus_sessions").insert({
      user_id: user.id,
      node_id: nodeId || null,
      duration_seconds: durationSeconds || 0,
      distracted_seconds: distractedSeconds || 0,
      energy_level: energyLevel || null,
      mood: mood || null,
      completed: completed ?? true,
      ended_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    const { data: profile } = await serviceClient
      .from("users_profile")
      .select("learning_dna, focus_minutes, distracted_minutes")
      .eq("id", user.id)
      .single();

    const focusMin = profile?.focus_minutes || 0;
    const distractMin = profile?.distracted_minutes || 0;
    const dna = (profile?.learning_dna as any) || {};

    const hour = new Date().getHours();
    const timeBuckets = dna.timeOfDayActivity || {};
    const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    timeBuckets[bucket] = (timeBuckets[bucket] || 0) + 1;

    if (nodeId) {
      await serviceClient.from("roadmap_nodes").update({ status: "in_progress" }).eq("id", nodeId).eq("user_id", user.id);
    }

    await serviceClient.from("roadmaps").update({ last_active_at: new Date().toISOString() }).eq("user_id", user.id).eq("status", "active");

    await serviceClient.from("users_profile").update({
      focus_minutes: focusMin + Math.round((durationSeconds || 0) / 60),
      distracted_minutes: distractMin + Math.round((distractedSeconds || 0) / 60),
      last_active_at: new Date().toISOString(),
      learning_dna: {
        ...dna,
        timeOfDayActivity: timeBuckets,
        avgSessionDuration: dna.avgSessionDuration
          ? Math.round((dna.avgSessionDuration * dna.totalSessions + (durationSeconds || 0)) / ((dna.totalSessions || 0) + 1))
          : durationSeconds || 0,
        avgDistractionRate: dna.avgDistractionRate
          ? (dna.avgDistractionRate * dna.totalSessions + ((distractedSeconds || 0) / Math.max(1, durationSeconds || 1))) / ((dna.totalSessions || 0) + 1)
          : ((distractedSeconds || 0) / Math.max(1, durationSeconds || 1)),
        totalSessions: (dna.totalSessions || 0) + 1,
        lastEnergy: energyLevel || null,
        lastMood: mood || null,
      },
    }).eq("id", user.id);

    return NextResponse.json({ message: "Focus session logged", session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log session" }, { status: 500 });
  }
}
