"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RealWorldApplication } from "@/types";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<RealWorldApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications/list")
      .then(r => r.json())
      .then(d => { if (!d.error) setApps(d.applications || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Real-World Applications</h1>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No applications yet</h3>
            <p className="text-sm text-muted-foreground">Log projects and real-world work from your roadmap nodes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{app.title}</h3>
                    {app.description && <p className="text-xs text-muted-foreground mt-1">{app.description}</p>}
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted capitalize">{app.application_type}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(app.created_at)}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
