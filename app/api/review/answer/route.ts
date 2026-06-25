import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reviewId, score } = await req.json();
    if (reviewId === undefined || score === undefined) {
      return NextResponse.json({ error: "reviewId and score required" }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    const { data: item } = await serviceClient
      .from("review_queue")
      .select("*")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (!item) return NextResponse.json({ error: "Review item not found" }, { status: 404 });

    const quality = Math.max(0, Math.min(5, score));
    let { ease_factor, interval_days, repetitions } = item;

    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (quality < 3) {
      repetitions = 0;
      interval_days = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) interval_days = 3;
      else if (repetitions === 2) interval_days = 7;
      else interval_days = Math.round(interval_days * ease_factor);
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + interval_days);

    const { data, error } = await serviceClient
      .from("review_queue")
      .update({
        interval_days,
        ease_factor,
        repetitions,
        due_at: dueAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Review recorded", item: data, nextReview: dueAt.toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record review" }, { status: 500 });
  }
}
