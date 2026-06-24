"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { QuizQuestion } from "@/types";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("id", params.sessionId)
        .single();
      if (data) {
        setQuestions((data.questions || []) as QuizQuestion[]);
        setSessionId(data.id);
      }
      setLoading(false);
    };
    load();
  }, [params.sessionId]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const finalScore = Math.round((correct / questions.length) * 100);
    const passed = finalScore >= 70;
    setScore(finalScore);
    setFinished(true);

    await supabase.from("quiz_sessions").update({
      user_answers: Object.entries(answers).map(([question_id, selected_answer]) => ({ question_id, selected_answer })),
      score: finalScore,
      passed,
      time_taken_seconds: 0,
    }).eq("id", sessionId);

    toast({
      title: passed ? "Quiz passed! 🎉" : "Keep practicing!",
      description: `You scored ${finalScore}%`,
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!questions.length) return <div className="min-h-screen flex items-center justify-center"><p>Quiz not found</p></div>;

  if (finished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardHeader>
            <CardTitle>Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-6xl font-bold text-primary">{score}%</div>
            <Badge variant={score >= 70 ? "success" : "destructive"} className="text-sm">
              {score >= 70 ? "Passed" : "Failed"}
            </Badge>
            <p className="text-sm text-muted-foreground">You got {Math.round((score / 100) * questions.length)} out of {questions.length} correct</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowResult(false);
                setAnswers({});
                setFinished(false);
              }}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
            <Progress value={((currentIndex + 1) / questions.length) * 100} className="w-32" />
          </div>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((opt, i) => {
            const isCorrect = opt === currentQuestion.correct_answer;
            const isSelected = opt === selectedAnswer;
            let variant: "outline" | "default" | "secondary" = "outline";
            if (showResult) {
              if (isCorrect) variant = "default";
              else if (isSelected && !isCorrect) variant = "secondary";
            }
            return (
              <Button
                key={i}
                variant={variant}
                className={`w-full justify-start text-left h-auto py-3 px-4 ${showResult && isCorrect ? "bg-green-500 hover:bg-green-500" : ""} ${showResult && isSelected && !isCorrect ? "bg-red-500 hover:bg-red-500 text-white" : ""}`}
                onClick={() => handleAnswer(opt)}
                disabled={showResult}
              >
                <span className="flex-1">{opt}</span>
                {showResult && isCorrect && <CheckCircle className="h-4 w-4 ml-2" />}
                {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 ml-2" />}
              </Button>
            );
          })}

          {showResult && (
            <div className="p-3 rounded-lg bg-muted text-sm mt-2">
              <p className="font-medium mb-1">Explanation:</p>
              <p className="text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          {showResult && (
            <Button className="w-full mt-2" onClick={nextQuestion}>
              {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
