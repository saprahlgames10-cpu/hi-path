"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDifficultyColor, XP_REWARDS } from "@/lib/utils";
import { BookOpen, ExternalLink, Star, RefreshCw, Loader2, Brain, Focus } from "lucide-react";
import type { RoadmapNode } from "@/types";

interface Props {
  node: RoadmapNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNodeUpdate: (node: RoadmapNode) => void;
}

export function NodeDetailModal({ node, open, onOpenChange, onNodeUpdate }: Props) {
  const [explanation, setExplanation] = useState(node.ai_explanation || "");
  const [exercises, setExercises] = useState<{ question: string; answer: string }[]>([]);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [showConfidence, setShowConfidence] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { user, setXp, xp } = useStore();

  const loadExplanation = async () => {
    setLoadingExplain(true);
    try {
      const res = await fetch("/api/node/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id }),
      });
      const data = await res.json();
      if (data.explanation) setExplanation(data.explanation);
      if (data.exercises) setExercises(data.exercises);
    } catch (e) {
      toast({ title: "Failed to load explanation", variant: "destructive" });
    }
    setLoadingExplain(false);
  };

  const markInProgress = async () => {
    await supabase
      .from("roadmap_nodes")
      .update({ status: "in_progress" })
      .eq("id", node.id);

    await supabase.from("user_progress").insert({
      user_id: user?.id,
      node_id: node.id,
      roadmap_id: node.roadmap_id,
      status: "started",
      time_spent_minutes: 0,
    });

    onNodeUpdate({ ...node, status: "in_progress" });
    toast({ title: "Node started", description: "Good luck learning!" });
  };

  const markComplete = async () => {
    setCompleting(true);
    try {
      const xpReward = node.xp_reward || XP_REWARDS.CONCEPT_COMPLETE;

      await supabase.from("roadmap_nodes").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", node.id);

      await supabase.from("user_progress").insert({
        user_id: user?.id,
        node_id: node.id,
        roadmap_id: node.roadmap_id,
        status: "completed",
        confidence_level: confidence || null,
        notes: notes || null,
        time_spent_minutes: 0,
      });

      const { data: roadmap } = await supabase
        .from("roadmaps")
        .select("completed_nodes, total_nodes, overall_progress, user_id")
        .eq("id", node.roadmap_id)
        .single();

      if (roadmap) {
        const newCompleted = (roadmap.completed_nodes || 0) + 1;
        const newProgress = (newCompleted / roadmap.total_nodes) * 100;

        await supabase.from("roadmaps").update({
          completed_nodes: newCompleted,
          overall_progress: newProgress,
        }).eq("id", node.roadmap_id);

        if (newCompleted >= roadmap.total_nodes) {
          await supabase.from("roadmaps").update({ status: "completed" }).eq("id", node.roadmap_id);
        }
      }

      await fetch("/api/review/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, roadmapId: node.roadmap_id }),
      });

      setXp(xp + xpReward);
      onNodeUpdate({ ...node, status: "completed" });
      toast({ title: "Node completed!", description: `+${xpReward} XP earned · Added to review queue` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed to complete node", description: e.message, variant: "destructive" });
    }
    setCompleting(false);
  };

  if (!explanation && !loadingExplain) loadExplanation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {node.title}
            <Badge variant="outline" className={getDifficultyColor(node.difficulty)}>{node.difficulty}</Badge>
            <Badge variant="secondary">{node.node_type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="learn">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">{node.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">AI Explanation</h4>
                <Button variant="ghost" size="sm" onClick={loadExplanation} disabled={loadingExplain}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${loadingExplain ? "animate-spin" : ""}`} /> Regenerate
                </Button>
              </div>
              {loadingExplain ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating explanation...
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">{explanation || "Loading..."}</div>
              )}
            </div>

            {node.resources && node.resources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resources</h4>
                <div className="space-y-1">
                  {node.resources.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> {r.title} {r.is_free ? "(Free)" : ""}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {node.status !== "completed" && (
                <>
                  {node.status === "locked" ? null : node.status !== "in_progress" ? (
                    <Button onClick={markInProgress}>Mark as In Progress</Button>
                  ) : (
                    <>
                      <Button onClick={() => setShowConfirmation(true)}>Mark as Complete</Button>
                      <Button variant="outline" onClick={() => window.open(`/dashboard/review?nodeId=${node.id}`, "_blank")}>
                        <Brain className="h-4 w-4 mr-1" /> Review
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="practice" className="space-y-4 mt-4">
            {exercises.length > 0 ? (
              exercises.map((ex, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-2">{i + 1}. {ex.question}</p>
                  <details className="text-sm">
                    <summary className="text-primary cursor-pointer">Show Answer</summary>
                    <p className="mt-2 text-muted-foreground">{ex.answer}</p>
                  </details>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Loading exercises...</p>
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Your Notes</h4>
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-border bg-transparent p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Write your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button size="sm" variant="outline" onClick={() => toast({ title: "Notes saved" })}>Save Notes</Button>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium">Real-World Application</h4>
              <p className="text-xs text-muted-foreground">Log a project, task, or practical application of this skill</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                  placeholder="e.g., Built a CLI calculator"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!notes.trim()) return;
                  await fetch("/api/applications/log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      nodeId: node.id,
                      title: notes.trim(),
                      description: `Applied from "${node.title}"`,
                      applicationType: "project",
                    }),
                  });
                  toast({ title: "Application logged!" });
                  setNotes("");
                }}>Log</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4 mt-4">
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">Adaptive Quiz</h3>
              <p className="text-sm text-muted-foreground mb-2">Questions adapt to your skill level</p>
              <Button onClick={async () => {
                const res = await fetch("/api/quiz/adaptive-generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nodeId: node.id, roadmapId: node.roadmap_id }),
                });
                const data = await res.json();
                if (data.sessionId) {
                  window.open(`/quiz/${data.sessionId}?difficulty=${data.difficulty}`, "_blank");
                }
              }}>
                <Focus className="h-4 w-4 mr-2" /> Start Adaptive Quiz
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
