"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { BarChart3, TrendingUp, Clock } from "lucide-react";
import type { Roadmap, RoadmapPhase, RoadmapNode } from "@/types";

export default function ProgressPage() {
  const { user } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: r } = await supabase.from("roadmaps").select("*").eq("user_id", user.id).eq("status", "active").single();
      if (r) {
        setRoadmap(r as Roadmap);
        const { data: ph } = await supabase.from("roadmap_phases").select("*").eq("roadmap_id", r.id).order("order_index");
        setPhases((ph || []) as RoadmapPhase[]);
        const { data: nd } = await supabase.from("roadmap_nodes").select("*").eq("roadmap_id", r.id).order("order_index");
        setNodes((nd || []) as RoadmapNode[]);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  if (!roadmap) return <div className="py-20 text-center"><p>No active roadmap</p></div>;

  const phaseData = phases.map((p) => {
    const phaseNodes = nodes.filter((n) => n.phase_id === p.id);
    const completed = phaseNodes.filter((n) => n.status === "completed").length;
    return { name: p.title.substring(0, 20), completed, total: phaseNodes.length, progress: phaseNodes.length > 0 ? (completed / phaseNodes.length) * 100 : 0 };
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeData = weekDays.map((day) => ({ day, hours: Math.floor(Math.random() * 3) }));

  const completedNodes = nodes.filter((n) => n.status === "completed").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Progress Tracking</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overall</CardTitle></CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-primary">{Math.round(roadmap.overall_progress)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{completedNodes}/{roadmap.total_nodes} nodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total XP</CardTitle></CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-yellow-500">{user?.total_xp || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">experience points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Streak</CardTitle></CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-orange-500">{user?.streak_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">day streak</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Phase Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {phaseData.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{p.name}</span>
                <span className="text-muted-foreground">{p.completed}/{p.total}</span>
              </div>
              <Progress value={p.progress} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">XP Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekDays.map((d) => ({ day: d, xp: Math.floor(Math.random() * 200) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Area type="monotone" dataKey="xp" stroke="#6C63FF" fill="#6C63FF20" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Time Spent</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Bar dataKey="hours" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
