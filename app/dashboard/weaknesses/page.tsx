"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, RefreshCw, ArrowRight, BookOpen } from "lucide-react";
import type { WeaknessReport, RoadmapNode } from "@/types";

export default function WeaknessesPage() {
  const { user } = useStore();
  const [report, setReport] = useState<WeaknessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [remediationNodes, setRemediationNodes] = useState<RoadmapNode[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const [{ data }, { data: rm }] = await Promise.all([
        supabase.from("weakness_reports").select("*").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(1).single(),
        supabase.from("roadmaps").select("id").eq("user_id", user.id).eq("status", "active").single(),
      ]);
      if (data) {
        setReport(data as WeaknessReport);
        if (rm && (data as WeaknessReport).weak_topics?.length > 0) {
          const weakTopicNames = (data as WeaknessReport).weak_topics.map((t: any) => t.topic.toLowerCase());
          const { data: nd } = await supabase
            .from("roadmap_nodes")
            .select("*")
            .eq("roadmap_id", rm.id)
            .neq("status", "completed")
            .order("order_index");
          if (nd) {
            const matched = (nd as RoadmapNode[]).filter((n) =>
              weakTopicNames.some((topic: string) =>
                n.title.toLowerCase().includes(topic) || n.description?.toLowerCase().includes(topic)
              )
            );
            setRemediationNodes(matched.slice(0, 5));
          }
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data: rm } = await supabase.from("roadmaps").select("id").eq("user_id", user?.id).eq("status", "active").single();
      if (!rm) { toast({ title: "No active roadmap" }); return; }
      const res = await fetch("/api/weakness/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId: rm.id }),
      });
      const data = await res.json();
      setReport(data);
      toast({ title: "Analysis complete!" });
    } catch (e: any) {
      toast({ title: "Analysis failed", variant: "destructive" });
    }
    setAnalyzing(false);
  };

  if (loading) return <Skeleton className="h-64" />;

  const chartData = report
    ? [...(report.weak_topics || []), ...(report.strong_topics || [])].map((t) => ({
        topic: t.topic,
        score: t.score,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weakness Analysis</h1>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
          Re-analyze
        </Button>
      </div>

      {!report ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No analysis yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Complete some nodes and quizzes to get insights</p>
            <Button onClick={runAnalysis} disabled={analyzing}>Run Analysis</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Weak Topics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(report.weak_topics || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No weak topics detected!</p>
                ) : (
                  report.weak_topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <div>
                        <p className="text-sm font-medium">{t.topic}</p>
                        <p className="text-xs text-muted-foreground">{t.reason}</p>
                      </div>
                      <Badge variant="destructive">{t.score}%</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Strong Topics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(report.strong_topics || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No strong topics tracked yet</p>
                ) : (
                  report.strong_topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <p className="text-sm font-medium">{t.topic}</p>
                      <Badge variant="success">{t.score}%</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Topic Radar</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Score" dataKey="score" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {report.ai_analysis && (
            <Card>
              <CardHeader><CardTitle className="text-lg">AI Analysis</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.ai_analysis}</p>
              </CardContent>
            </Card>
          )}

          {(report.recommendations || []).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <p className="text-sm">{r.action}</p>
                    </div>
                    <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "warning" : "secondary"}>
                      {r.priority}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {remediationNodes.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Suggested Remedial Nodes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">These roadmap nodes target your weak areas:</p>
                {remediationNodes.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 cursor-pointer"
                    onClick={() => router.push(`/dashboard/roadmap/${n.roadmap_id}`)}>
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{n.node_type} · {n.difficulty} · {n.estimated_hours}h</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
