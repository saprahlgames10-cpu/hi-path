"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { TodaysPlan } from "@/components/dashboard/todays-plan";
import { SkillsOverview } from "@/components/dashboard/skills-overview";
import { AICoachCard } from "@/components/dashboard/ai-coach-card";
import { RoadmapTimeline } from "@/components/dashboard/roadmap-timeline";
import { RecommendedResources } from "@/components/dashboard/recommended-resources";
import { WeeklyGoal } from "@/components/dashboard/weekly-goal";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { cn } from "@/lib/utils";
import { Clock, BookOpen, Code2, Flame } from "lucide-react";
import type { Roadmap, RoadmapNode } from "@/types";

function StatCard({ icon: Icon, label, value, sub, subColor }: {
  icon: any; label: string; value: string; sub?: string; subColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className={cn("text-xs font-medium mt-0.5", subColor || "text-green-500")}>{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardHome() {
  const { user, xp, streakCount, setActiveRoadmap, setXp } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

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
        setXp(roadmaps.overall_progress ? Math.round(roadmaps.overall_progress * 10) : xp);

        const { data: roadmapNodes } = await supabase
          .from("roadmap_nodes")
          .select("*")
          .eq("roadmap_id", roadmaps.id)
          .order("order_index", { ascending: true });
        if (roadmapNodes) setNodes(roadmapNodes as RoadmapNode[]);
      }

      const { data: rawProgress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCount: Record<string, number> = {};
      weekDays.forEach((d) => { dayCount[d] = 0; });
      (rawProgress || []).forEach((p: any) => {
        const d = new Date(p.created_at);
        const day = weekDays[d.getDay()];
        const since = (Date.now() - d.getTime()) / 86400000;
        if (since <= 7 && dayCount[day] !== undefined) dayCount[day]++;
      });
      setWeeklyData(weekDays.map((d) => ({ day: d, value: dayCount[d] })));

      setLoading(false);
    };
    fetchData();
  }, [user, setActiveRoadmap, setXp]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const goalParse = roadmap?.goal_parse as { targetRole?: string; estimatedMonths?: number } | null;
  const targetRole = goalParse?.targetRole || "Python Developer";
  const estimatedMonths = goalParse?.estimatedMonths || 12;
  const completedMonths = roadmap ? Math.round((roadmap.overall_progress / 100) * estimatedMonths) : 0;
  const progress = roadmap?.overall_progress || 0;
  const totalNodes = roadmap?.total_nodes || 0;
  const completedNodes = roadmap?.completed_nodes || 0;

  const timelineNodes = nodes.slice(0, 7).map((n) => ({
    id: n.id,
    title: n.title.length > 12 ? n.title.substring(0, 12) + "..." : n.title,
    status: (n.status === "completed" ? "completed" : n.status === "active" || n.status === "in_progress" ? "current" : "locked") as "completed" | "current" | "locked",
  }));

  const skills = [
    { name: "Python Basics", mastery: 92 },
    { name: "Functions", mastery: 85 },
    { name: "Data Structures", mastery: 70 },
    { name: "OOP", mastery: 45 },
    { name: "File Handling", mastery: 35 },
    { name: "Modules & Packages", mastery: 20 },
  ];

  const todayTasks = [
    { id: "1", title: "Functions in Python", duration: "20 min", category: "Learn" as const, color: "#7c3aed", completed: true },
    { id: "2", title: "Practice: Functions Exercises", duration: "30 min", category: "Practice" as const, color: "#eab308" },
    { id: "3", title: "Mini Project: Tip Calculator", duration: "20 min", category: "Project" as const, color: "#22c55e" },
  ];

  const resources = [
    { id: "1", title: "Object Oriented Programming in Python Full Course", source: "YouTube", duration: "2h 15m", icon: "youtube" as const },
    { id: "2", title: "Python OOP Tutorial for Beginners", source: "freeCodeCamp", duration: "1h 30m", icon: "freecodecamp" as const },
    { id: "3", title: "Hands-on OOP Exercises (With Solutions)", source: "Blog", duration: "45 min read", icon: "blog" as const },
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.full_name?.split(" ")[0] || "Arjun"}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Let's continue your journey to become a{" "}
          <span className="text-primary font-medium">{targetRole}</span>.
        </p>
      </div>

      {/* Progress + Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          {roadmap ? (
            <ProgressCard
              progress={progress}
              targetRole={targetRole}
              estimatedMonths={estimatedMonths}
              completedMonths={completedMonths}
            />
          ) : (
            <Card className="border-dashed border-primary/20">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No active roadmap. Create one to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Clock} label="Study Time" value="128h 45m" sub="↑12% this week" />
          <StatCard icon={BookOpen} label="Lessons" value={`${completedNodes}/${totalNodes}`} sub="↑8% weekly" />
          <StatCard icon={Code2} label="Projects" value="4/8" sub="↑2 this week" />
          <StatCard icon={Flame} label="Current Streak" value={`${streakCount} Days`} sub="Keep it going!" subColor="text-orange-500" />
        </div>
      </div>

      {/* Today's Plan | Skills | AI Coach */}
      <div className="grid gap-4 md:grid-cols-3">
        <TodaysPlan date={dateStr} tasks={todayTasks} />
        <SkillsOverview skills={skills} focusRecommendation="OOP" />
        <AICoachCard />
      </div>

      {/* Timeline | Recommended Resources */}
      {timelineNodes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <RoadmapTimeline nodes={timelineNodes} />
          <RecommendedResources resources={resources} />
        </div>
      )}

      {/* Weekly Goals | Weekly Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <WeeklyGoal goalHours={10} currentHours={6.2} />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">This Week's Progress</h3>
              <span className="text-xs text-muted-foreground">6h 20m total</span>
            </div>
            <WeeklyChart data={weeklyData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
