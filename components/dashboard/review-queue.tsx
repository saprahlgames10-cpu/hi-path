"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChevronRight } from "lucide-react";
import type { ReviewItem } from "@/types";

export function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary" /> Spaced Repetition
        </CardTitle>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => router.push("/dashboard/review")}>
            Review all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items due for review. Complete nodes to add them to your review queue.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">{items.length} item{items.length > 1 ? "s" : ""} due for review</p>
            <div className="space-y-1">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/review?nodeId=${item.node_id}`)}>
                  <span className="truncate">{item.roadmap_nodes?.title || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {item.repetitions === 0 ? "New" : `R${item.repetitions}`}
                  </span>
                </div>
              ))}
            </div>
            {items.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{items.length - 5} more</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
