"use client";

import type { RoadmapNode } from "@/types";

interface Props {
  nodes: RoadmapNode[];
  onNodeClick: (node: RoadmapNode) => void;
}

export function SkillTree({ nodes, onNodeClick }: Props) {

  const phaseNodes: Record<string, RoadmapNode[]> = {};
  nodes.forEach((n) => {
    const phase = n.phase_id;
    if (!phaseNodes[phase]) phaseNodes[phase] = [];
    phaseNodes[phase].push(n);
  });

  const statusColors: Record<string, string> = {
    completed: "border-green-500 bg-green-500/10 text-green-500",
    in_progress: "border-primary bg-primary/10 text-primary",
    active: "border-primary/40 bg-primary/5 text-foreground",
    locked: "border-muted bg-muted/30 text-muted-foreground",
    skipped: "border-muted bg-muted/30 text-muted-foreground",
  };

  const statusIcons: Record<string, string> = {
    completed: "\u2713",
    in_progress: "\u25B6",
    locked: "\uD83D\uDD12",
    active: "\u25CB",
    skipped: "\u2014",
  };

  return (
    <div className="space-y-2">
      {Object.entries(phaseNodes).map(([phaseId, phaseNodeList], phaseIdx) => (
        <div key={phaseId}>
          {phaseNodeList.map((node, nodeIdx) => {
            const isCompleted = node.status === "completed";
            const isInProgress = node.status === "in_progress";
            const isLocked = node.status === "locked";
            const isLast = nodeIdx === phaseNodeList.length - 1;

            return (
              <div key={node.id} className="relative">
                {!isLast && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
                )}
                <div className="flex items-start gap-3 py-1.5">
                  <button
                    onClick={() => !isLocked && onNodeClick(node)}
                    disabled={isLocked}
                    className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                      statusColors[node.status] || statusColors.locked
                    } ${isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                  >
                    {statusIcons[node.status] || "?"}
                  </button>
                  <div className={`flex-1 min-w-0 pt-1.5 ${isLocked ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {node.title}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${
                        node.difficulty === "easy" ? "bg-green-500/10 text-green-500" :
                        node.difficulty === "hard" ? "bg-red-500/10 text-red-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {node.difficulty}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{node.estimated_hours}h</span>
                    </div>
                    {node.prerequisites && node.prerequisites.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {node.prerequisites.map((prereq, i) => {
                          const prereqNode = nodes.find((n) => n.title === prereq);
                          const prereqMet = prereqNode?.status === "completed";
                          return (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              prereqMet ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                            }`}>
                              {prereqMet ? "\u2713" : "\u25CB"} {prereq}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {isInProgress && (
                    <span className="text-xs text-primary font-medium animate-pulse-soft shrink-0 pt-1.5">
                      In progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {phaseIdx < Object.keys(phaseNodes).length - 1 && (
            <div className="flex items-center gap-3 py-2 pl-[19px]">
              <div className="h-6 w-0.5 bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Phase</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
