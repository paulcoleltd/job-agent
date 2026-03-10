"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, applicationsApi } from "@/lib/api";
import { Job } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Building2 } from "lucide-react";

export function ShortlistPage() {
  const qc = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["jobs", "shortlisted"],
    queryFn: () => jobsApi.list({ status: "shortlisted" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => jobsApi.updateStatus(id, "rejected"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const applyMutation = useMutation({
    mutationFn: (job_id: string) => applicationsApi.create(job_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shortlist</h1>
        <p className="text-sm text-muted-foreground">Review and approve jobs for application</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No shortlisted jobs. Go to the dashboard and shortlist jobs you like.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Card key={job.id}>
              <CardContent className="pt-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{job.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Building2 className="h-3 w-3" />
                    <span>{job.company}</span>
                    {job.location && <span>· {job.location}</span>}
                  </div>
                </div>
                {job.match_score && (
                  <Badge variant={job.match_score >= 0.7 ? "success" : "warning"}>
                    {Math.round(job.match_score * 100)}%
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(job.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyMutation.mutate(job.id)}
                    disabled={applyMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
