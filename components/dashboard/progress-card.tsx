"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProgressCardProps {
  progress: number;
  targetRole: string;
  estimatedMonths: number;
  completedMonths: number;
}

export function ProgressCard({ progress, targetRole, estimatedMonths, completedMonths }: ProgressCardProps) {
  const router = useRouter();
  const remaining = estimatedMonths - completedMonths;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Your Roadmap Progress</p>
              <h3 className="text-lg font-bold">{targetRole || "Learning Path"}</h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {estimatedMonths} Months</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs">
                <span className="text-green-500 font-medium">{completedMonths} Months Completed</span>
                <span className="text-muted-foreground">{remaining} Months Remaining</span>
              </div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => router.push("/dashboard/roadmap")}>
              View Full Roadmap <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                <span className="text-[10px] text-muted-foreground">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
