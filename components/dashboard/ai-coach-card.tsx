"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles } from "lucide-react";

interface AICoachCardProps {
  onYesSuggest?: () => void;
  onNotNow?: () => void;
}

export function AICoachCard({ onYesSuggest, onNotNow }: AICoachCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">AI Coach</CardTitle>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">BETA</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-3 rounded-full bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="p-3 rounded-xl bg-muted/50 text-sm leading-relaxed">
              <p className="font-medium text-primary mb-1">Hi Arjun!</p>
              <p className="text-muted-foreground text-xs">
                I analyzed your progress. You're doing great! But I noticed OOP concepts need more practice. Shall I suggest some resources?
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1 text-xs h-8" onClick={onYesSuggest}>
                <Sparkles className="h-3 w-3" /> Yes, suggest
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={onNotNow}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
