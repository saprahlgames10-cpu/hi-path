"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suggested, current, and completed projects.</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Projects will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
