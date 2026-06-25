"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Bot, RefreshCw, Brain } from "lucide-react";

export function CoachWidget({ roadmapId }: { roadmapId?: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchCoachMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .in("type", ["coach_intervention", "coach_weekly"])
      .order("created_at", { ascending: false })
      .limit(5);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoachMessages(); }, [roadmapId]);

  const triggerIntervention = async (type: string) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/coach/intervene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, roadmapId }),
      });
      if (res.ok) {
        await fetchCoachMessages();
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> PathForge Coach
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => triggerIntervention("weekly_review")} disabled={generating}>
            <RefreshCw className={`h-3 w-3 mr-1 ${generating ? "animate-spin" : ""}`} /> Weekly Review
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => triggerIntervention("low_comprehension")} disabled={generating}>
            Check Comprehension
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No coach messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Generate a weekly review to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {notifications.map((n: any) => (
              <div key={n.id} className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-primary">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
