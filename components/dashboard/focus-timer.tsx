"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, StopCircle, Brain, Focus } from "lucide-react";

export function FocusTimer({ nodeId }: { nodeId?: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distractedSeconds, setDistractedSeconds] = useState(0);
  const [isDistracted, setIsDistracted] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
        if (isDistracted) setDistractedSeconds(d => d + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isDistracted]);

  const startTimer = () => { setIsRunning(true); setShowTimer(true); };
  const toggleDistracted = () => setIsDistracted(d => !d);
  const togglePause = () => setIsRunning(r => !r);

  const stopTimer = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await fetch("/api/focus/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          durationSeconds: seconds,
          distractedSeconds,
          completed: seconds > 60,
        }),
      });
    } catch {}
    setShowTimer(false);
    setSeconds(0);
    setDistractedSeconds(0);
    setIsDistracted(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!showTimer) {
    return (
      <Button variant="outline" size="sm" onClick={startTimer} className="gap-2">
        <Focus className="h-4 w-4" /> Focus Timer
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-72 shadow-xl z-50 border-primary/20">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold mb-2">{formatTime(seconds)}</div>
          {distractedSeconds > 5 && (
            <p className="text-xs text-muted-foreground mb-2">Distracted: {formatTime(distractedSeconds)}</p>
          )}
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant={isDistracted ? "destructive" : "outline"} onClick={toggleDistracted}>
              <Brain className={`h-4 w-4 mr-1 ${isDistracted ? "animate-pulse" : ""}`} />
              {isDistracted ? "Focusing" : "Distracted"}
            </Button>
            <Button size="sm" variant="outline" onClick={togglePause}>
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="destructive" onClick={stopTimer}>
              <StopCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
