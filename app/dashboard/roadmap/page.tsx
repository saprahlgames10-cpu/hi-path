"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Plus } from "lucide-react";
import Link from "next/link";
import type { Roadmap } from "@/types";

export default function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRoadmaps((data || []) as Roadmap[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const active = roadmaps.find((r) => r.status === "active");

  if (!active && roadmaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Map className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No roadmaps yet</h2>
        <p className="text-muted-foreground mb-6">Create your personalized learning roadmap</p>
        <Button onClick={() => router.push("/auth/onboarding")}>
          <Plus className="mr-2 h-4 w-4" /> Create Roadmap
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">My Roadmaps</h1>
      <div className="grid gap-4">
        {roadmaps.map((r) => (
          <Link key={r.id} href={`/dashboard/roadmap/${r.id}`}>
            <Card className={`hover:border-primary/50 transition-colors ${r.status === "active" ? "border-primary/30" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.goal_description?.substring(0, 100)}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{r.completed_nodes}/{r.total_nodes} nodes</span>
                      <span>{Math.round(r.overall_progress)}% complete</span>
                      <span className="capitalize">{r.status}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
