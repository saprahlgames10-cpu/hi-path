import { NextResponse } from "next/server";
import { supabase, getServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = getServiceClient();
    const { data: notifications, error } = await serviceClient
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

    return NextResponse.json({ notifications: notifications || [], unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationIds, markAll } = await req.json();
    const serviceClient = getServiceClient();

    if (markAll) {
      await serviceClient
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    } else if (notificationIds?.length) {
      await serviceClient
        .from("notifications")
        .update({ read: true })
        .in("id", notificationIds);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
