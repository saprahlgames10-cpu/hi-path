"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import type { QuizSession } from "@/types";

export default function QuizHistoryPage() {
  const [quizzes, setQuizzes] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setQuizzes((data || []) as QuizSession[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const passed = quizzes.filter((q) => q.passed).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quiz History</h1>
        <div className="text-sm text-muted-foreground">{passed}/{quizzes.length} passed</div>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No quizzes yet</h3>
            <p className="text-sm text-muted-foreground">Complete some nodes and take quizzes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Quiz Session</p>
                    <p className="text-xs text-muted-foreground">{formatDate(quiz.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{Math.round(quiz.score)}%</span>
                    <Badge variant={quiz.passed ? "success" : "destructive"}>
                      {quiz.passed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
