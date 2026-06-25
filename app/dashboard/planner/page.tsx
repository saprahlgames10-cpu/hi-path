"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Brain, Target, Sparkles, Loader2, CheckCircle, BookOpen, Code2, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PlannerPage() {
  const { user, activeRoadmap } = useStore();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const generatePlan = async (roadmapId?: string) => {
    const rmId = roadmapId || activeRoadmap?.id;
    if (!rmId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/planner/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId: rmId }),
      });
      const data = await res.json();
      if (!data.error) setPlan(data);
    } catch {} finally { setGenerating(false); }
  };

  useEffect(() => {
    const fetchOrGenerate = async () => {
      if (!user) return;
      let rmId = activeRoadmap?.id;
      if (!rmId) {
        const { data: rm } = await supabase.from("roadmaps").select("id").eq("user_id", user.id).eq("status", "active").single();
        if (rm) rmId = rm.id;
      }
      if (rmId) {
        const today = new Date().toISOString().split("T")[0];
        const { data: existing } = await supabase.from("daily_goals").select("*").eq("user_id", user.id).eq("date", today).eq("roadmap_id", rmId).maybeSingle();
        if (existing) {
          setPlan({
            focus: existing.goal_description,
            blocks: [],
            date: today,
            motivation: "Keep going!",
            total_minutes: 0,
            xp_estimate: 0,
          });
          setLoading(false);
        } else {
          await generatePlan(rmId);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchOrGenerate();
  }, [user, activeRoadmap]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /><Skeleton className="h-48" /></div>;

  if (!activeRoadmap) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No active roadmap</h2>
        <p className="text-muted-foreground mb-6">Create a roadmap to get your daily plan</p>
        <Button onClick={() => router.push("/auth/onboarding")} className="gap-2">
          <Sparkles className="h-4 w-4" /> Create Roadmap
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s Study Plan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => generatePlan()} disabled={generating} className="gap-1.5">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating..." : "Regenerate"}
        </Button>
      </div>

      {generating && !plan ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Creating your personalized study plan...</p>
          </CardContent>
        </Card>
      ) : plan ? (
        <>
          {plan.focus && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Today&apos;s Focus</p>
                    <p className="font-semibold">{plan.focus}</p>
                    {plan.motivation && <p className="text-sm text-muted-foreground mt-2 italic">&ldquo;{plan.motivation}&rdquo;</p>}
                  </div>
                </div>
                {plan.total_minutes > 0 && (
                  <div className="flex gap-4 mt-4 pt-3 border-t border-border text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" /> {plan.total_minutes} min
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Brain className="h-4 w-4" /> ~{plan.xp_estimate} XP
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {plan.blocks && plan.blocks.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Schedule</h2>
              {plan.blocks.map((block: any, i: number) => {
                const typeIcons: Record<string, any> = { learn: BookOpen, practice: Code2, quiz: HelpCircle, project: Code2, review: Brain };
                const TypeIcon = typeIcons[block.type] || BookOpen;
                const typeColors: Record<string, string> = { learn: "bg-blue-500/10 text-blue-500", practice: "bg-green-500/10 text-green-500", quiz: "bg-purple-500/10 text-purple-500", project: "bg-orange-500/10 text-orange-500", review: "bg-pink-500/10 text-pink-500" };
                const colorClass = typeColors[block.type] || "bg-primary/10 text-primary";

                return (
                  <Card key={i} className="hover:border-primary/20 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{block.activity}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className="text-[10px]">{block.duration_minutes}min</Badge>
                              {block.time && <Badge variant="secondary" className="text-[10px]">{block.time}</Badge>}
                            </div>
                          </div>
                          {block.description && <p className="text-xs text-muted-foreground mt-1">{block.description}</p>}
                          {block.tips && <p className="text-xs text-primary/70 mt-1 italic">{block.tips}</p>}
                          {block.node_title && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{block.node_title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex items-center justify-between px-1 py-3">
                <span className="text-xs text-muted-foreground">
                  {plan.blocks.length} blocks · {plan.blocks.reduce((s: number, b: any) => s + b.duration_minutes, 0)} min total
                </span>
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => generatePlan()}>
                  <Sparkles className="h-3 w-3" /> New Plan
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No plan for today</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate an AI-powered study plan for today</p>
            <Button onClick={() => generatePlan()} className="gap-2">
              <Sparkles className="h-4 w-4" /> Generate Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
