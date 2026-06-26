"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Clock, Play, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  title: string;
  source: string;
  duration: string;
  icon: "youtube" | "freecodecamp" | "blog";
}

const sourceIcons = {
  youtube: Play,
  freecodecamp: ExternalLink,
  blog: ExternalLink,
};

const sourceColors = {
  youtube: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  freecodecamp: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  blog: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
};

export function RecommendedResources({ resources }: { resources: Resource[] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Recommended Resources</CardTitle>
        <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
          View All <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {resources.map((r) => {
          const Icon = sourceIcons[r.icon];
          return (
            <div key={r.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
              <div className={cn("shrink-0 w-14 h-14 rounded-lg flex items-center justify-center", sourceColors[r.icon])}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{r.source}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {r.duration}
                  </span>
                </div>
              </div>
              <button className="shrink-0 p-1 rounded hover:bg-muted-foreground/10 self-start mt-1">
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
