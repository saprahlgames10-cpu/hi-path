"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Skill {
  name: string;
  mastery: number;
}

interface SkillsOverviewProps {
  skills: Skill[];
  focusRecommendation: string;
}

function getMasteryColor(value: number): string {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-green-500/70";
  if (value >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getTextColor(value: number): string {
  if (value >= 60) return "text-green-600 dark:text-green-400";
  if (value >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function SkillsOverview({ skills, focusRecommendation }: SkillsOverviewProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Skills Overview</CardTitle>
        <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
          View All <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium">{skill.name}</span>
              <span className={cn("font-medium", getTextColor(skill.mastery))}>{skill.mastery}%</span>
            </div>
            <Progress value={skill.mastery} className={cn("h-1.5", getMasteryColor(skill.mastery))} />
          </div>
        ))}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 mt-3">
          <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Focus on {focusRecommendation}</p>
            <p className="text-[11px] text-yellow-700 dark:text-yellow-400/80 mt-0.5">Strengthen this area to unlock next topics</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
