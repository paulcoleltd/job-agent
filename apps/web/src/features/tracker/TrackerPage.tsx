"use client";
import { useQuery } from "@tanstack/react-query";
import { agentsApi, applicationsApi } from "@/lib/api";
import { Application, AgentRun } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Trophy, Loader2 } from "lucide-react";

const PIPELINE = [
  { key: "draft",     label: "Draft",     icon: Clock,        color: "outline" },
  { key: "applied",   label: "Applied",   icon: CheckCircle2, color: "default" },
  { key: "interview", label: "Interview", icon: Trophy,       color: "success" },
  { key: "rejected",  label: "Rejected",  icon: XCircle,      color: "destructive" },
  { key: "offer",     label: "Offer",     icon: Trophy,       color: "warning" },
] as const;

function PipelineColumn({
  stage,
  applications,
}: {
  stage: (typeof PIPELINE)[number];
  applications: Application[];
}) {
  const Icon = stage.icon;
  return (
    <div className="flex-1 min-w-[160px]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{stage.label}</span>
        <Badge variant={stage.color as any} className="ml-auto text-xs">
          {applications.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {applications.map((app) => (
          <Card key={app.id} className="shadow-none">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground truncate">
                {app.id.slice(0, 8)}…
              </div>
              {app.submitted_at && (
                <div className="text-xs mt-0.5">
                  {new Date(app.submitted_at).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {applications.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}

export function TrackerPage() {
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });

  const { data: runs = [] } = useQuery<AgentRun[]>({
    queryKey: ["agent-runs"],
    queryFn: agentsApi.listRuns,
  });

  const byStage = PIPELINE.reduce<Record<string, Application[]>>((acc, s) => {
    acc[s.key] = applications.filter((a) => a.status === s.key);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Application Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline view of all your applications
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading pipeline…
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE.map((stage) => (
            <PipelineColumn
              key={stage.key}
              stage={stage}
              applications={byStage[stage.key] ?? []}
            />
          ))}
        </div>
      )}

      {/* Agent run history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Agent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agent runs yet.</p>
          ) : (
            <div className="divide-y">
              {runs.slice(0, 10).map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium capitalize">{run.agent_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(run.started_at).toLocaleString()}
                  </span>
                  <Badge
                    variant={
                      run.status === "completed"
                        ? "success"
                        : run.status === "running"
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {run.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
