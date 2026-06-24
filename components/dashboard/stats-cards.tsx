"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, CheckCircle, HelpCircle } from "lucide-react";

interface StatsCardsProps {
  xp: number;
  nodesCompleted: number;
  quizzesPassed: number;
}

export function StatsCards({ xp, nodesCompleted, quizzesPassed }: StatsCardsProps) {
  const stats = [
    { label: "Total XP", value: xp, icon: Zap, color: "text-primary" },
    { label: "Nodes Done", value: nodesCompleted, icon: CheckCircle, color: "text-green-500" },
    { label: "Quizzes Passed", value: quizzesPassed, icon: HelpCircle, color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
