"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineNode {
  id: string;
  title: string;
  status: "completed" | "current" | "locked";
}

interface RoadmapTimelineProps {
  nodes: TimelineNode[];
}

export function RoadmapTimeline({ nodes }: RoadmapTimelineProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Roadmap Timeline</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
          <button className="shrink-0 p-1 rounded-full hover:bg-muted">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          {nodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                  node.status === "completed" && "bg-green-100 dark:bg-green-900/30",
                  node.status === "current" && "bg-primary/10 ring-2 ring-primary",
                  node.status === "locked" && "bg-muted",
                )}>
                  {node.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {node.status === "current" && <Circle className="h-4 w-4 text-primary fill-primary" />}
                  {node.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <span className={cn(
                  "text-[10px] text-center leading-tight max-w-[80px]",
                  node.status === "completed" && "text-green-600 dark:text-green-400",
                  node.status === "current" && "text-primary font-medium",
                  node.status === "locked" && "text-muted-foreground",
                )}>
                  {node.title}
                </span>
              </div>
              {i < nodes.length - 1 && (
                <div className={cn(
                  "w-6 h-0.5 mt-[-20px]",
                  node.status === "completed" ? "bg-green-400" : "bg-muted",
                )} />
              )}
            </div>
          ))}
          <button className="shrink-0 p-1 rounded-full hover:bg-muted">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
