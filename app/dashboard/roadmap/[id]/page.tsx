"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NodeDetailModal } from "@/components/roadmap/node-detail-modal";
import { getNodeTypeIcon, getDifficultyColor, formatDate } from "@/lib/utils";
import { Lock, CheckCircle, Play, BookOpen, Code2, HelpCircle, Link, Award, ArrowLeft, GitCompare, Sparkles, Loader2 } from "lucide-react";
import type { Roadmap, RoadmapPhase, RoadmapNode } from "@/types";

function ExplainChangesButton({ changeLog, version, roadmapTitle, totalNodes, completedNodes }: any) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/node/explain-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeLog, version, roadmapTitle, totalNodes, completedNodes }),
      });
      const data = await res.json();
      if (!data.error) setExplanation(data.explanation);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="mt-2">
      <Button variant="ghost" size="sm" className="h-7 text-xs w-full" onClick={fetchExplanation} disabled={loading}>
        {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
        AI Explain Changes
      </Button>
      {explanation && (
        <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-primary/5 italic">{explanation}</p>
      )}
    </div>
  );
}

export default function RoadmapDetail() {
  const params = useParams();
  const router = useRouter();
  const { user, setActiveRoadmap } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user || !params.id) return;

      const { data: rm } = await supabase.from("roadmaps").select("*").eq("id", params.id).single();
      if (rm) {
        setRoadmap(rm as Roadmap);
        setActiveRoadmap(rm as Roadmap);
      }

      const { data: ph } = await supabase.from("roadmap_phases").select("*").eq("roadmap_id", params.id).order("order_index");
      setPhases((ph || []) as RoadmapPhase[]);

      const { data: nd } = await supabase.from("roadmap_nodes").select("*").eq("roadmap_id", params.id).order("order_index");
      setNodes((nd || []) as RoadmapNode[]);

      setLoading(false);
    };
    fetch();
  }, [user, params.id, setActiveRoadmap]);

  const getNodesByPhase = (phaseId: string) => nodes.filter((n) => n.phase_id === phaseId);

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  if (!roadmap) return <div className="py-20 text-center"><p>Roadmap not found</p></div>;

  const completedNodes = nodes.filter((n) => n.status === "completed").length;
  const progress = roadmap.total_nodes > 0 ? (completedNodes / roadmap.total_nodes) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => router.push("/dashboard/roadmap")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to roadmaps
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{roadmap.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{roadmap.goal_description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/auth/onboarding?regenerate=" + roadmap.id)}>
            Regenerate with AI
          </Button>
        </div>
      </div>

      {roadmap.goal_parse && typeof roadmap.goal_parse === "object" && (roadmap.goal_parse as any).targetRole && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <Sparkles className="h-4 w-4" /> AI Goal Analysis
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{(roadmap.goal_parse as any).targetRole}</span>
              <Badge variant="outline">{(roadmap.goal_parse as any).seniority}</Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {((roadmap.goal_parse as any).requiredSkills || []).map((s: string) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{completedNodes}/{roadmap.total_nodes} nodes</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
            {roadmap.version && roadmap.version > 1 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={async () => {
                setShowCompare(!showCompare);
                if (!compareData) {
                  const res = await fetch(`/api/roadmap/compare?roadmapId=${roadmap.id}`);
                  const data = await res.json();
                  if (!data.error) setCompareData(data);
                }
              }}>
                <GitCompare className="h-3 w-3 mr-1" /> v{roadmap.version} history
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showCompare && compareData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Roadmap Change Log</h3>
              <Badge variant="outline">v{compareData.version}</Badge>
            </div>
            {(compareData.changeLog || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {(compareData.changeLog as any[]).map((entry: any, i: number) => (
                  <div key={i} className="text-xs p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">{entry.changed_at?.substring(0, 10) || "?"}</span>
                    {entry.reason && <p className="mt-1">{entry.reason}</p>}
                    {entry.changes?.map((c: string, j: number) => (
                      <p key={j} className="text-primary ml-2">- {c}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {compareData.summary && (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="p-2 rounded bg-green-500/10 text-center">
                    <p className="font-medium text-green-500">+{compareData.summary.newNodes.length}</p>
                    <p className="text-muted-foreground">Added</p>
                  </div>
                  <div className="p-2 rounded bg-red-500/10 text-center">
                    <p className="font-medium text-red-500">-{compareData.summary.removedNodes.length}</p>
                    <p className="text-muted-foreground">Removed</p>
                  </div>
                  <div className="p-2 rounded bg-blue-500/10 text-center">
                    <p className="font-medium text-blue-500">{compareData.summary.unchangedNodes.length}</p>
                    <p className="text-muted-foreground">Kept</p>
                  </div>
                </div>
                <ExplainChangesButton
                  changeLog={compareData.changeLog}
                  version={compareData.version}
                  roadmapTitle={roadmap.title}
                  totalNodes={roadmap.total_nodes}
                  completedNodes={completedNodes}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" className="space-y-4">
        {phases.map((phase) => {
          const phaseNodes = getNodesByPhase(phase.id);
          const phaseCompleted = phaseNodes.filter((n) => n.status === "completed").length;
          const phaseProgress = phaseNodes.length > 0 ? (phaseCompleted / phaseNodes.length) * 100 : 0;
          const iconMap: Record<string, any> = { concept: BookOpen, project: Code2, quiz: HelpCircle, resource: Link, milestone: Award };

          return (
            <AccordionItem key={phase.id} value={phase.id} className="border border-border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Phase {phase.phase_number}</span>
                      {phase.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {phase.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="font-semibold">{phase.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{phaseCompleted}/{phaseNodes.length}</span>
                      <span className="w-16">
                        <Progress value={phaseProgress} className="h-1.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {phaseNodes.map((node) => {
                    const Icon = iconMap[node.node_type] || BookOpen;
                    const difficultyColor = getDifficultyColor(node.difficulty);
                    const isLocked = node.status === "locked";
                    const isCompleted = node.status === "completed";

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          if (!isLocked) {
                            setSelectedNode(node);
                            setModalOpen(true);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                          ${isCompleted ? "border-green-500/20 bg-green-500/5" : ""}
                          ${isLocked ? "opacity-50 cursor-not-allowed border-border" : "hover:border-primary/30 hover:bg-muted/50"}
                          ${node.status === "in_progress" || node.status === "active" ? "border-primary/30 bg-primary/5" : ""}
                        `}
                      >
                        <div className={`p-1.5 rounded-lg ${isCompleted ? "bg-green-500/10" : isLocked ? "bg-muted" : "bg-primary/10"}`}>
                          {isCompleted ? <CheckCircle className="h-4 w-4 text-green-500" /> : isLocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Icon className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{node.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{node.node_type}</Badge>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyColor}`}>{node.difficulty}</span>
                            <span className="text-[10px] text-muted-foreground">{node.estimated_hours}h</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary font-medium">+{node.xp_reward} XP</span>
                          {!isLocked && !isCompleted && <Play className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onNodeUpdate={(updated) => {
            setNodes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
          }}
        />
      )}
    </div>
  );
}
