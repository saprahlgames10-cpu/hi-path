"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Calendar, Zap, AlertTriangle } from "lucide-react";
import type { AnalyticsPrediction } from "@/types";

export function AnalyticsCard({ roadmapId }: { roadmapId?: string }) {
  const [data, setData] = useState<AnalyticsPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roadmapId) { setLoading(false); return; }
    fetch("/api/analytics/predict").then(r => r.json()).then(d => {
      if (!d.error && d.predictedCompletionDate) setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [roadmapId]);

  if (loading || !data) return null;

  const daysLeft = data.estimatedDaysRemaining;
  const scoreColor = data.efficiencyScore >= 70 ? "text-green-500" : data.efficiencyScore >= 40 ? "text-yellow-500" : "text-red-500";
  const riskColor = data.dropoutRisk >= 50 ? "text-red-500" : data.dropoutRisk >= 20 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" /> Predicted Finish
          </div>
          <p className="text-lg font-bold">{data.predictedCompletionDate}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.onTrack ? (
              <span className="text-green-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> On track</span>
            ) : (
              <span className="text-red-500 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Behind schedule</span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Zap className="h-4 w-4" /> Efficiency
          </div>
          <p className={`text-2xl font-bold ${scoreColor}`}>{data.efficiencyScore}%</p>
          <Progress value={data.efficiencyScore} className="mt-2 h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">Avg quiz: {data.avgQuizScore}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" /> Pace
          </div>
          <p className="text-lg font-bold">{data.pacePerDay.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">nodes/day · {data.completedCount}/{data.totalNodes} done</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" /> Dropout Risk
          </div>
          <p className={`text-2xl font-bold ${riskColor}`}>{data.dropoutRisk}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.daysSinceLastActive > 0 ? `${data.daysSinceLastActive}d since last activity` : "Active today"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
