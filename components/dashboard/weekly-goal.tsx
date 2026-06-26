"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Edit2 } from "lucide-react";

interface WeeklyGoalProps {
  goalHours: number;
  currentHours: number;
}

export function WeeklyGoal({ goalHours, currentHours }: WeeklyGoalProps) {
  const progress = Math.min((currentHours / goalHours) * 100, 100);
  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Weekly Goal
        </CardTitle>
        <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
          <Edit2 className="h-3 w-3" /> Edit
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        <p className="text-sm">
          Study <span className="font-bold">{goalHours} hours</span> this week
        </p>
        <Progress value={progress} className="h-2.5" />
        <p className="text-xs text-muted-foreground">
          {currentHours.toFixed(1)} / {goalHours} hours
        </p>
      </CardContent>
    </Card>
  );
}
