"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, ChevronRight, Brain } from "lucide-react";
import type { ReviewItem } from "@/types";

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ success: number; fail: number }>({ success: 0, fail: 0 });
  const router = useRouter();

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/review/queue");
      const data = await res.json();
      if (!data.error) setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const submitReview = async (quality: number) => {
    const item = items[currentIndex];
    if (!item) return;
    setSubmitting(true);
    setScore(quality);
    try {
      await fetch("/api/review/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: item.id, score: quality }),
      });
      if (quality >= 3) setResults(r => ({ ...r, success: r.success + 1 }));
      else setResults(r => ({ ...r, fail: r.fail + 1 }));
    } finally {
      setSubmitting(false);
    }
  };

  const nextItem = () => {
    setScore(null);
    if (currentIndex < items.length - 1) setCurrentIndex(i => i + 1);
    else setItems([]);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  if (items.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <Button variant="outline" size="sm" onClick={fetchQueue}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
        </div>
        {results.success + results.fail > 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto text-primary mb-3" />
              <h2 className="text-lg font-semibold mb-2">Review complete!</h2>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-green-500">{results.success} mastered</span>
                <span className="text-red-500">{results.fail} need practice</span>
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={() => { setCurrentIndex(0); setResults({ success: 0, fail: 0 }); fetchQueue(); }}>
                  Review again
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Back to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center py-12">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-1">All caught up!</h2>
              <p className="text-sm text-muted-foreground">No items due for review right now.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>Dashboard</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const item = items[currentIndex];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review</h1>
        <span className="text-sm text-muted-foreground">{currentIndex + 1} of {items.length}</span>
      </div>

      <Progress value={((currentIndex + 1) / items.length) * 100} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{item.roadmap_nodes?.title || "Review item"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {item.roadmap_nodes?.description || "How well do you remember this topic?"}
          </p>

          {item.repetitions > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline">Review #{item.repetitions + 1}</Badge>
              <Badge variant="outline">Interval: {item.interval_days}d</Badge>
            </div>
          )}

          {score === null ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium">How well did you know this?</p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Forgot", value: 1, color: "bg-red-500 hover:bg-red-600" },
                  { label: "Hazy", value: 2, color: "bg-orange-500 hover:bg-orange-600" },
                  { label: "Mixed", value: 3, color: "bg-yellow-500 hover:bg-yellow-600" },
                  { label: "Good", value: 4, color: "bg-lime-500 hover:bg-lime-600" },
                  { label: "Perfect", value: 5, color: "bg-green-500 hover:bg-green-600" },
                ].map((opt) => (
                  <Button key={opt.value} className={`h-16 ${opt.color}`} onClick={() => submitReview(opt.value)} disabled={submitting}>
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className={`flex items-center gap-2 ${score >= 3 ? "text-green-500" : "text-red-500"}`}>
                {score >= 3 ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="font-medium">{score >= 3 ? "Mastered" : "Needs practice"}</span>
              </div>
              <Button onClick={nextItem} className="w-full">
                {currentIndex < items.length - 1 ? "Next" : "Finish"} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <span className="text-green-500 mr-3">{results.success} mastered</span>
        <span className="text-red-500">{results.fail} need practice</span>
      </div>
    </div>
  );
}
