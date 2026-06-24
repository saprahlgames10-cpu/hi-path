"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakWidget } from "@/components/dashboard/streak-widget";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { ArrowRight, Target, Map, Clock } from "lucide-react";
import type { Roadmap, UserProgress, DailyGoal } from "@/types";

export default function DashboardHome() {
  const { user, xp, streakCount, setActiveRoadmap, setXp, setStreakCount } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: roadmaps } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (roadmaps) {
        setRoadmap(roadmaps as Roadmap);
        setActiveRoadmap(roadmaps as Roadmap);
      }

      const { data: progress } = await supabase
        .from("user_progress")
        .select("*, roadmap_nodes:node_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(progress || []);

      const today = new Date().toISOString().split("T")[0];
      const { data: goal } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (goal) setDailyGoal(goal as DailyGoal);

      const completed = progress?.filter((p: any) => p.status === "completed").length || 0;
      const { data: quizzes } = await supabase
        .from("quiz_sessions")
        .select("id")
        .eq("user_id", user.id)
        .gte("score", 70);

      setXp(roadmaps?.overall_progress ? Math.round(roadmaps.overall_progress * 10) : xp);
      setLoading(false);
    };
    fetchData();
  }, [user, setActiveRoadmap, setXp]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = weekDays.map((day) => ({ day, xp: Math.floor(Math.random() * 100) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {roadmap ? (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                <span className="font-semibold">{roadmap.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{roadmap.completed_nodes}/{roadmap.total_nodes} nodes</span>
            </div>
            <Progress value={roadmap.overall_progress} className="mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{Math.round(roadmap.overall_progress)}% complete</span>
              <Button variant="link" size="sm" className="text-primary" onClick={() => router.push("/dashboard/roadmap")}>
                Continue <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Map className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No active roadmap</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first learning roadmap to get started</p>
            <Button onClick={() => router.push("/auth/onboarding")}>Create Roadmap</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Today's Goal</CardTitle></CardHeader>
          <CardContent className="p-4 pt-2">
            {dailyGoal ? (
              <div>
                <p className="text-sm">{dailyGoal.goal_description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  {dailyGoal.completed ? "✅ Completed" : "⏳ In progress"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <p>No goal set for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Streak</CardTitle></CardHeader>
          <CardContent className="p-4 pt-2">
            <StreakWidget />
          </CardContent>
        </Card>

        <StatsCards xp={xp} nodesCompleted={roadmap?.completed_nodes || 0} quizzesPassed={0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyChart data={chartData} />
        </CardContent>
      </Card>

      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{act.roadmap_nodes?.title || "Unknown node"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(act.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
