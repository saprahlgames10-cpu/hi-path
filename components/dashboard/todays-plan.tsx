"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  duration: string;
  category: "Learn" | "Practice" | "Project";
  color: string;
  completed?: boolean;
}

interface TodaysPlanProps {
  date: string;
  tasks: Task[];
}

export function TodaysPlan({ date, tasks }: TodaysPlanProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Today's Plan</CardTitle>
        <p className="text-xs text-muted-foreground">{date}</p>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors",
              task.completed ? "bg-muted/30 border-l-green-500" : "bg-muted/20 border-l-transparent"
            )}
            style={{ borderLeftColor: task.completed ? undefined : task.color }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  task.category === "Learn" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                  task.category === "Practice" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                  task.category === "Project" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                )}>
                  {task.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {task.duration}
                </span>
              </div>
              <p className={cn("text-sm font-medium mt-1", task.completed && "line-through text-muted-foreground")}>
                {task.title}
              </p>
            </div>
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs gap-1">
          View Full Plan <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
