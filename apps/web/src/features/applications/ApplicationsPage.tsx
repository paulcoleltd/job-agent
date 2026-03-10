"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api";
import { Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const STATUS_PIPELINE = ["draft", "applied", "interview", "rejected", "offer"];

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "outline",
  applied: "default",
  interview: "success",
  rejected: "destructive",
  offer: "warning",
};

export function ApplicationsPage() {
  const qc = useQueryClient();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  const byStatus = STATUS_PIPELINE.reduce<Record<string, Application[]>>((acc, s) => {
    acc[s] = applications.filter(a => a.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-sm text-muted-foreground">Track your application pipeline</p>
      </div>

      {/* Pipeline summary */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STATUS_PIPELINE.map(s => (
          <div key={s} className="flex-1 min-w-[120px] text-center">
            <div className="text-2xl font-bold">{byStatus[s]?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground capitalize">{s}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No applications yet. Shortlist jobs and create applications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <Card key={app.id}>
              <CardContent className="pt-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">ID: {app.id.slice(0, 8)}...</div>
                  <div className="text-xs mt-0.5">
                    {app.submitted_at
                      ? `Submitted: ${new Date(app.submitted_at).toLocaleDateString()}`
                      : `Created: ${app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}`}
                  </div>
                </div>
                <Badge variant={statusVariant[app.status] ?? "outline"} className="capitalize">
                  {app.status}
                </Badge>
                {app.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => submitMutation.mutate(app.id)}
                    disabled={submitMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Submit
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
