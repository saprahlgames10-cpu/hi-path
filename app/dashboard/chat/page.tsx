"use client";

import { ChatButton } from "@/components/chat/chat-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">AI Learning Coach</h1>
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">PathForge AI</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Click the chat button in the bottom-right corner to start a conversation with your AI learning coach.
          </p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Try asking:</p>
            <ul className="space-y-1">
              <li>"Explain my next topic"</li>
              <li>"What should I study today?"</li>
              <li>"Where am I struggling?"</li>
              <li>"Quiz me on my current topic"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
