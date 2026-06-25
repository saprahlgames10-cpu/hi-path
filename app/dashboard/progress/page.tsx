"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { BarChart3, TrendingUp, Clock, Brain, Focus } from "lucide-react";
import type { Roadmap, RoadmapPhase, RoadmapNode } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ProgressPage() {
  const { user } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [focusData, setFocusData] = useState<any[]>([]);
  const [weeklyXp, setWeeklyXp] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: r } = await supabase.from("roadmaps").select("*").eq("user_id", user.id).eq("status", "active").single();
      if (r) {
        setRoadmap(r as Roadmap);
        const [{ data: ph }, { data: nd }, { data: sessions }] = await Promise.all([
          supabase.from("roadmap_phases").select("*").eq("roadmap_id", r.id).order("order_index"),
          supabase.from("roadmap_nodes").select("*").eq("roadmap_id", r.id).order("order_index"),
          supabase.from("focus_sessions").select("*").eq("user_id", user.id).order("started_at", { ascending: false }),
        ]);
        setPhases((ph || []) as RoadmapPhase[]);
        setNodes((nd || []) as RoadmapNode[]);

        const focusArr = sessions || [];
        const dayMap: Record<string, { minutes: number; focus: number }> = {};
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        weekDays.forEach((d) => { dayMap[d] = { minutes: 0, focus: 0 }; });

        focusArr.slice(0, 50).forEach((s: any) => {
          const d = new Date(s.started_at);
          const day = weekDays[d.getDay()];
          if (dayMap[day]) {
            dayMap[day].minutes += Math.round((s.duration_seconds || 0) / 60);
            if (s.distracted_seconds > 0) dayMap[day].focus += Math.round((s.distracted_seconds || 0) / 60);
          }
        });

        setFocusData(weekDays.map((d) => ({ day: d, hours: Math.round(dayMap[d].minutes / 60 * 10) / 10, distracted: Math.round(dayMap[d].focus / 60 * 10) / 10 })));

        const xpDayMap: Record<string, number> = {};
        weekDays.forEach((d) => { xpDayMap[d] = 0; });
        (nd || []).filter((n: any) => n.status === "completed" && n.completed_at).forEach((n: any) => {
          const d = new Date(n.completed_at);
          const day = weekDays[d.getDay()];
          const since = (Date.now() - d.getTime()) / 86400000;
          if (since <= 7 && xpDayMap[day] !== undefined) {
            xpDayMap[day] += n.xp_reward || 50;
          }
        });
        setWeeklyXp(weekDays.map((d) => ({ day: d, xp: xpDayMap[d] })));
      }

      const { data: p } = await supabase.from("users_profile").select("learning_dna, focus_minutes, distracted_minutes, efficiency_score, total_xp, streak_count").eq("id", user.id).single();
      setProfile(p);
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

  const completedNodes = nodes.filter((n) => n.status === "completed").length;
  const dna = (profile?.learning_dna || {}) as any;
  const timeBuckets = dna.timeOfDayActivity || {};
  const totalSessions = dna.totalSessions || 0;
  const avgDuration = dna.avgSessionDuration ? Math.round(dna.avgSessionDuration / 60) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Progress Tracking</h1>

      <div className="grid gap-4 md:grid-cols-4">
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
            <div className="text-4xl font-bold text-yellow-500">{profile?.total_xp || user?.total_xp || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">experience points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Streak</CardTitle></CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-orange-500">{profile?.streak_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">day streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Efficiency</CardTitle></CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-green-500">{profile?.efficiency_score || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">learning efficiency</p>
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
          <CardHeader><CardTitle className="text-lg">XP This Week</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyXp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="xp" stroke="#6C63FF" fill="#6C63FF20" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Focus Time This Week</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#6C63FF" radius={[4, 4, 0, 0]} name="Focus hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalSessions > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Learning Patterns</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Brain className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total sessions</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{avgDuration}m</p>
                <p className="text-xs text-muted-foreground">Avg session</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Focus className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{Math.round((profile?.distracted_minutes || 0) / Math.max(1, (profile?.focus_minutes || 1)) * 100)}%</p>
                <p className="text-xs text-muted-foreground">Distraction rate</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold capitalize">{Object.entries(timeBuckets).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Best time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
