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
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { CoachWidget } from "@/components/dashboard/coach-widget";
import { ReviewQueue } from "@/components/dashboard/review-queue";
import { FocusTimer } from "@/components/dashboard/focus-timer";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { ArrowRight, Target, Map, Clock, Sparkles, Zap } from "lucide-react";
import type { Roadmap, UserProgress, DailyGoal } from "@/types";

export default function DashboardHome() {
  const { user, xp, streakCount, setActiveRoadmap, setXp, setStreakCount } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([]);
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

      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCount: Record<string, number> = {};
      weekDays.forEach((d) => { dayCount[d] = 0; });
      (progress || []).forEach((p: any) => {
        const d = new Date(p.created_at);
        const day = weekDays[d.getDay()];
        const since = (Date.now() - d.getTime()) / 86400000;
        if (since <= 7 && dayCount[day] !== undefined) dayCount[day]++;
      });
      setWeeklyData(weekDays.map((d) => ({ day: d, value: dayCount[d] })));

      setXp(roadmaps?.overall_progress ? Math.round(roadmaps.overall_progress * 10) : xp);
      setLoading(false);
    };
    fetchData();
  }, [user, setActiveRoadmap, setXp]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s your learning overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Zap className="h-3.5 w-3.5 text-primary" />
          {streakCount || 0} day streak
        </div>
      </div>

      {roadmap ? (
        <>
          <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial opacity-40" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Map className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{roadmap.title}</p>
                    {roadmap.goal_parse && typeof roadmap.goal_parse === "object" && (roadmap.goal_parse as any).targetRole && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Target: <span className="text-primary">{(roadmap.goal_parse as any).targetRole}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  {roadmap.completed_nodes}/{roadmap.total_nodes} nodes
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(roadmap.overall_progress)}%</span>
                </div>
                <Progress value={roadmap.overall_progress} className="h-2" />
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={() => router.push("/dashboard/roadmap")}>
                  Continue learning <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <AnalyticsCard roadmapId={roadmap.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <CoachWidget roadmapId={roadmap.id} />
            <ReviewQueue />
          </div>
        </>
      ) : (
        <Card className="border-dashed border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
          <CardContent className="p-12 text-center">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Map className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Start your learning journey</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first AI-powered roadmap tailored to your goals, skill level, and learning style.
            </p>
            <Button onClick={() => router.push("/auth/onboarding")} className="gap-2">
              <Sparkles className="h-4 w-4" /> Create Your Roadmap
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Today&apos;s Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {dailyGoal ? (
              <div className="space-y-2">
                <p className="text-sm">{dailyGoal.goal_description}</p>
                <div className={`flex items-center gap-1.5 text-xs ${dailyGoal.completed ? "text-green-500" : "text-muted-foreground"}`}>
                  <div className={`h-2 w-2 rounded-full ${dailyGoal.completed ? "bg-green-500" : "bg-muted-foreground"}`} />
                  {dailyGoal.completed ? "Completed" : "In progress"}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No goal set for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <StreakWidget />
          </CardContent>
        </Card>

        <StatsCards xp={xp} nodesCompleted={roadmap?.completed_nodes || 0} quizzesPassed={0} />
      </div>

      {roadmap && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <WeeklyChart data={weeklyData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.map((act: any) => (
                    <div key={act.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm truncate">{act.roadmap_nodes?.title || "Unknown node"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatTimeAgo(act.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <FocusTimer />
    </div>
  );
}
