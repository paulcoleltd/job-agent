"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { applicationsApi, jobsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Mail, Building2, Sparkles, Send, ChevronDown, ChevronUp } from "lucide-react";

interface PreparedApplication {
  job_id: string;
  company: string;
  title: string;
  tailored_resume: string;
  cover_letter: string;
  requires_approval: boolean;
}

interface ApplicationBuilderPageProps {
  applicationId: string;
}

export default function ApplicationBuilderPage({ applicationId }: ApplicationBuilderPageProps) {
  const [resumeText, setResumeText] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [prepared, setPrepared] = useState<PreparedApplication | null>(null);
  const [resumeExpanded, setResumeExpanded] = useState(true);
  const [coverExpanded, setCoverExpanded] = useState(true);

  const { data: application, isLoading: loadingApp } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => applicationsApi.get(applicationId),
  });

  const prepareMutation = useMutation({
    mutationFn: () => applicationsApi.prepare(applicationId),
    onSuccess: (data: PreparedApplication) => {
      setPrepared(data);
      setResumeText(data.tailored_resume);
      setCoverLetterText(data.cover_letter);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => applicationsApi.submit(applicationId),
  });

  if (loadingApp) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSubmitted = application?.status === "applied";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-tailored resume and cover letter for this role
          </p>
        </div>
        <Badge variant={isSubmitted ? "default" : "secondary"} className="mt-1">
          {application?.status ?? "draft"}
        </Badge>
      </div>

      {/* Job context */}
      {application?.job_id && (
        <JobContextCard jobId={application.job_id} />
      )}

      {/* Prepare button */}
      {!prepared && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <Sparkles className="h-10 w-10 text-primary mx-auto" />
            <div>
              <p className="font-medium">Generate tailored documents</p>
              <p className="text-sm text-muted-foreground mt-1">
                Claude will tailor your CV and write a cover letter for this specific role
              </p>
            </div>
            <Button
              onClick={() => prepareMutation.mutate()}
              disabled={prepareMutation.isPending}
            >
              {prepareMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
            {prepareMutation.isError && (
              <p className="text-sm text-destructive">Failed to generate — check your API key and try again.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tailored Resume */}
      {prepared && (
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setResumeExpanded(v => !v)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tailored Resume
              </span>
              {resumeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {resumeExpanded && (
            <CardContent>
              <Textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={18}
                className="font-mono text-xs resize-y"
                placeholder="Tailored resume will appear here…"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Edit as needed before submitting
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Cover Letter */}
      {prepared && (
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setCoverExpanded(v => !v)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Cover Letter
              </span>
              {coverExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {coverExpanded && (
            <CardContent>
              <Textarea
                value={coverLetterText}
                onChange={e => setCoverLetterText(e.target.value)}
                rows={14}
                className="text-sm resize-y"
                placeholder="Cover letter will appear here…"
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Submit */}
      {prepared && !isSubmitted && (
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => setPrepared(null)}>
            Regenerate
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || isSubmitted}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      )}

      {isSubmitted && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="py-4 text-center text-sm text-green-700 dark:text-green-400 font-medium">
            Application submitted successfully
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JobContextCard({ jobId }: { jobId: string }) {
  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.get(jobId),
  });

  if (!job) return null;

  return (
    <Card className="bg-muted/40">
      <CardContent className="py-4 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-medium truncate">{job.title}</p>
          <p className="text-sm text-muted-foreground truncate">{job.company} · {job.location ?? "Remote"}</p>
        </div>
        {job.match_score != null && (
          <Badge variant="outline" className="ml-auto shrink-0">
            {Math.round(job.match_score * 100)}% match
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
