"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Target, CheckCircle, Circle, Plus, RefreshCw } from "lucide-react";
import type { DailyGoal } from "@/types";

export default function GoalsPage() {
  const { user } = useStore();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(14);
      setGoals((data || []) as DailyGoal[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const generateGoal = async () => {
    setGenerating(true);
    try {
      const { data: rm } = await supabase.from("roadmaps").select("id").eq("user_id", user?.id).eq("status", "active").single();
      if (!rm) { toast({ title: "No active roadmap" }); return; }
      const res = await fetch("/api/goals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId: rm.id }),
      });
      const data = await res.json();
      toast({ title: data.goal_description || "Goal generated!" });
    } catch (e) {
      toast({ title: "Failed to generate goal", variant: "destructive" });
    }
    setGenerating(false);
  };

  const toggleGoal = async (goal: DailyGoal) => {
    const updated = !goal.completed;
    await supabase.from("daily_goals").update({ completed: updated }).eq("id", goal.id);
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, completed: updated } : g));
    toast({ title: updated ? "Goal completed! 🎉" : "Goal marked incomplete" });
  };

  if (loading) return <Skeleton className="h-64" />;

  const today = new Date().toISOString().split("T")[0];
  const todayGoal = goals.find((g) => g.date === today);
  const completedCount = goals.filter((g) => g.completed).length;
  const completionRate = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Goals</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateGoal} disabled={generating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} /> Generate
          </Button>
          <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Manual</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Completion Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">{completedCount}/{goals.length} goals</p>
          </CardContent>
        </Card>
      </div>

      {todayGoal && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Today's Goal</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleGoal(todayGoal)}>
                  {todayGoal.completed ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                </button>
                <div>
                  <p className={`font-medium ${todayGoal.completed ? "line-through text-muted-foreground" : ""}`}>{todayGoal.goal_description}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
              <Badge variant={todayGoal.completed ? "success" : "secondary"}>{todayGoal.completed ? "Done" : "Pending"}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">Recent Goals</h2>
        {goals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No goals yet. Generate your first one!</p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleGoal(goal)}>
                    {goal.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div>
                    <p className={`text-sm ${goal.completed ? "line-through text-muted-foreground" : ""}`}>{goal.goal_description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(goal.date)}</p>
                  </div>
                </div>
                {goal.xp_earned > 0 && <Badge variant="secondary">+{goal.xp_earned} XP</Badge>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
