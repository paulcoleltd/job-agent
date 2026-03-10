"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, applicationsApi, agentsApi, profileApi } from "@/lib/api";
import { Job, Application, AgentRun, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Search, RefreshCw, Briefcase, Bookmark, Send, Trophy,
  Loader2, Building2, MapPin, ChevronRight, Activity,
  User, CheckCircle2, Clock, AlertCircle, Zap, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtScore(s?: number) {
  if (s == null) return null;
  return Math.round(s * 100);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function scoreColor(pct: number) {
  if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, sub, accent,
}: {
  label: string; value: number; icon: React.FC<{ className?: string }>;
  sub?: string; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={cn("text-3xl font-bold mt-1", accent)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineBar({ jobs, applications }: { jobs: Job[]; applications: Application[] }) {
  const stages = [
    { key: "discovered", label: "Discovered", count: jobs.filter(j => j.status === "discovered").length, color: "bg-slate-400" },
    { key: "shortlisted", label: "Shortlisted", count: jobs.filter(j => j.status === "shortlisted").length, color: "bg-blue-500" },
    { key: "applied", label: "Applied", count: applications.filter(a => a.status === "applied").length, color: "bg-violet-500" },
    { key: "interview", label: "Interview", count: applications.filter(a => a.status === "interview").length, color: "bg-amber-500" },
    { key: "offer", label: "Offer", count: applications.filter(a => a.status === "offer").length, color: "bg-emerald-500" },
  ];
  const max = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Hiring Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-3 h-24">
          {stages.map(s => (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className={cn("text-sm font-bold", s.count > 0 ? "text-foreground" : "text-muted-foreground")}>
                {s.count}
              </span>
              <div className="w-full rounded-t-sm" style={{ height: `${(s.count / max) * 64}px`, minHeight: s.count > 0 ? "4px" : "2px" }}>
                <div className={cn("h-full w-full rounded-t-sm opacity-80", s.color)} />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MatchDistribution({ jobs }: { jobs: Job[] }) {
  const scored = jobs.filter(j => j.match_score != null);
  const buckets = [
    { label: "0–25", count: scored.filter(j => (j.match_score! * 100) < 25).length, color: "bg-rose-500" },
    { label: "25–50", count: scored.filter(j => (j.match_score! * 100) >= 25 && (j.match_score! * 100) < 50).length, color: "bg-amber-400" },
    { label: "50–75", count: scored.filter(j => (j.match_score! * 100) >= 50 && (j.match_score! * 100) < 75).length, color: "bg-blue-500" },
    { label: "75–100", count: scored.filter(j => (j.match_score! * 100) >= 75).length, color: "bg-emerald-500" },
  ];
  const max = Math.max(...buckets.map(b => b.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" /> Match Score Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-3 h-20">
          {buckets.map(b => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold">{b.count}</span>
              <div className="w-full" style={{ height: `${(b.count / max) * 48}px`, minHeight: b.count > 0 ? "4px" : "2px" }}>
                <div className={cn("h-full w-full rounded-t-sm", b.color)} />
              </div>
              <span className="text-[10px] text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">{scored.length} of {jobs.length} jobs scored</p>
      </CardContent>
    </Card>
  );
}

function AgentPanel() {
  const qc = useQueryClient();
  const { data: runs = [] } = useQuery<AgentRun[]>({
    queryKey: ["agent-runs"],
    queryFn: agentsApi.listRuns,
    refetchInterval: 8000,
  });

  const runMutation = useMutation({
    mutationFn: (name: string) => agentsApi.run(name),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ["agent-runs"] }), 2000),
  });

  const agents = [
    { name: "job_search", label: "Job Search", icon: Search, desc: "Discover new openings" },
    { name: "job_match", label: "Job Match", icon: Zap, desc: "Score & rank jobs" },
    { name: "tracking", label: "Tracking", icon: Activity, desc: "Sync application status" },
  ];

  const lastRun = (name: string) => runs.find(r => r.agent_name === name);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" /> AI Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {agents.map(({ name, label, icon: Icon, desc }) => {
          const last = lastRun(name);
          const running = runMutation.isPending && runMutation.variables === name;
          return (
            <div key={name} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <div className="bg-muted rounded-md p-1.5 shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
                {last && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      last.status === "completed" ? "bg-emerald-500" :
                      last.status === "running" ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                    )} />
                    {last.status} · {timeAgo(last.started_at)}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2.5 shrink-0"
                disabled={running}
                onClick={() => runMutation.mutate(name)}
              >
                {running ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TopJobs({ jobs }: { jobs: Job[] }) {
  const top = [...jobs]
    .filter(j => j.match_score != null)
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 5);

  if (top.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Top Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground py-4 text-center">
            Run "Job Match" to score your jobs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Top Matches</span>
          <Link href="/" className="text-[10px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
            All jobs <ChevronRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-0.5">
        {top.map((job, i) => {
          const pct = fmtScore(job.match_score)!;
          return (
            <div key={job.id} className="flex items-center gap-2.5 py-2 border-b last:border-0">
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{job.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-2.5 w-2.5" />{job.company}
                  {job.location && <><MapPin className="h-2.5 w-2.5 ml-1" />{job.location}</>}
                </p>
              </div>
              <span className={cn("text-xs font-bold shrink-0", scoreColor(pct))}>{pct}%</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RecentApplications({ applications }: { applications: Application[] }) {
  const recent = [...applications]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 5);

  const statusIcon = (s: string) => {
    if (s === "offer") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (s === "interview") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    if (s === "rejected") return <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
    if (s === "applied") return <Send className="h-3.5 w-3.5 text-blue-500" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Recent Applications</span>
          <Link href="/applications" className="text-[10px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
            All <ChevronRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No applications yet</p>
        ) : (
          <div className="space-y-0.5">
            {recent.map(app => (
              <div key={app.id} className="flex items-center gap-2.5 py-2 border-b last:border-0">
                {statusIcon(app.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-mono truncate">#{app.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {app.created_at ? timeAgo(app.created_at) : "—"}
                  </p>
                </div>
                <Badge
                  variant={app.status === "offer" ? "success" : app.status === "rejected" ? "destructive" : "outline"}
                  className="text-[10px] capitalize"
                >
                  {app.status}
                </Badge>
                <Link href={`/builder/${app.id}`}>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileCard({ profile }: { profile?: UserProfile }) {
  const hasCV = !!(profile?.cv_text);
  const skillCount = profile?.skills?.length ?? 0;
  const completeness = [hasCV, skillCount > 0, skillCount >= 5].filter(Boolean).length;
  const pct = Math.round((completeness / 3) * 100);

  return (
    <Card className={cn(pct < 100 && "border-amber-200 dark:border-amber-800")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" /> Profile
          <Badge variant={pct === 100 ? "success" : "warning"} className="ml-auto text-[10px]">
            {pct}% complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-amber-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-1 text-xs">
          <Bullet done={hasCV} label="CV uploaded" />
          <Bullet done={skillCount > 0} label="Skills added" />
          <Bullet done={skillCount >= 5} label="5+ skills" />
        </div>
        {pct < 100 && (
          <Link href="/settings">
            <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1">
              Complete Profile
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function Bullet({ done, label }: { done: boolean; label: string }) {
  return (
    <p className={cn("flex items-center gap-1.5", done ? "text-foreground" : "text-muted-foreground")}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", done ? "bg-emerald-500" : "bg-muted-foreground/40")} />
      {label}
    </p>
  );
}

function JobFeed({ jobs, onShortlist }: { jobs: Job[]; onShortlist: (id: string) => void }) {
  const sorted = [...jobs]
    .filter(j => j.status === "discovered")
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 9);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          No discovered jobs yet. Run the Job Search agent to find opportunities.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map(job => {
        const pct = fmtScore(job.match_score);
        return (
          <Card key={job.id} className="hover:shadow-md transition-shadow group">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{job.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  {job.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[job.salary_min && `$${(job.salary_min/1000).toFixed(0)}k`, job.salary_max && `$${(job.salary_max/1000).toFixed(0)}k`].filter(Boolean).join(" – ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {pct != null && (
                    <span className={cn("text-sm font-bold", scoreColor(pct))}>{pct}%</span>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">{job.source}</Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => onShortlist(job.id)}
                >
                  <Bookmark className="h-3 w-3 mr-1.5" /> Shortlist
                </Button>
                {job.apply_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => window.open(job.apply_url, "_blank")}
                  >
                    View
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function DashboardPage() {
  const qc = useQueryClient();

  const { data: jobs = [], isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: () => jobsApi.list({ min_score: 0 }),
    refetchInterval: 30_000,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
    refetchInterval: 30_000,
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  const searchMutation = useMutation({
    mutationFn: () => agentsApi.run("job_search"),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ["jobs"] }), 4000),
  });

  const scoreMutation = useMutation({
    mutationFn: () => agentsApi.run("job_match"),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ["jobs"] }), 3000),
  });

  const shortlistMutation = useMutation({
    mutationFn: (id: string) => jobsApi.updateStatus(id, "shortlisted"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const stats = {
    discovered: jobs.filter(j => j.status === "discovered").length,
    shortlisted: jobs.filter(j => j.status === "shortlisted").length,
    applied: applications.filter(a => a.status === "applied").length,
    interviews: applications.filter(a => a.status === "interview").length,
    offers: applications.filter(a => a.status === "offer").length,
    highMatch: jobs.filter(j => (j.match_score ?? 0) >= 0.7).length,
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your job search at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending}>
            {scoreMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Score Jobs
          </Button>
          <Button size="sm" onClick={() => searchMutation.mutate()} disabled={searchMutation.isPending}>
            {searchMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {searchMutation.isPending ? "Searching…" : "Find Jobs"}
          </Button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Discovered" value={stats.discovered} icon={Briefcase} />
        <StatCard label="High Match" value={stats.highMatch} icon={Trophy} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Shortlisted" value={stats.shortlisted} icon={Bookmark} accent="text-blue-600 dark:text-blue-400" />
        <StatCard label="Applied" value={stats.applied} icon={Send} accent="text-violet-600 dark:text-violet-400" />
        <StatCard label="Interviews" value={stats.interviews} icon={CheckCircle2} accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Offers" value={stats.offers} icon={Trophy} accent="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PipelineBar jobs={jobs} applications={applications} />
        <MatchDistribution jobs={jobs} />
      </div>

      {/* ── Main content: left column + right sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left: job feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">New Discoveries</h2>
            <Link href="/shortlist" className="text-xs text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
              View shortlist <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {loadingJobs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <JobFeed jobs={jobs} onShortlist={id => shortlistMutation.mutate(id)} />
          )}
        </div>

        {/* right sidebar */}
        <div className="space-y-4">
          <ProfileCard profile={profile} />
          <AgentPanel />
          <TopJobs jobs={jobs} />
          <RecentApplications applications={applications} />
        </div>
      </div>
    </div>
  );
}
