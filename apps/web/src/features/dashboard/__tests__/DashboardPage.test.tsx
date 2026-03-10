import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "../DashboardPage";
import * as api from "@/lib/api";

vi.mock("next/link", () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/api", () => ({
  jobsApi: {
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
  applicationsApi: { list: vi.fn() },
  agentsApi: { run: vi.fn(), listRuns: vi.fn() },
  profileApi: { get: vi.fn() },
}));

const mockJobs = [
  { id: "j1", source: "linkedin", company: "Acme", title: "Engineer", status: "discovered", match_score: 0.85, location: "London" },
  { id: "j2", source: "indeed", company: "Beta", title: "Developer", status: "shortlisted", match_score: 0.55 },
  { id: "j3", source: "linkedin", company: "Gamma", title: "Lead", status: "applied", match_score: 0.3 },
];

const mockApplications = [
  { id: "a1", job_id: "j3", status: "applied", created_at: new Date().toISOString() },
  { id: "a2", job_id: "j2", status: "interview", created_at: new Date().toISOString() },
];

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(api.jobsApi.list).mockResolvedValue(mockJobs);
  vi.mocked(api.applicationsApi.list).mockResolvedValue(mockApplications);
  vi.mocked(api.agentsApi.listRuns).mockResolvedValue([]);
  vi.mocked(api.profileApi.get).mockResolvedValue({ skills: ["React", "TypeScript", "Python", "SQL", "Node"], cv_text: "My CV" });
  vi.mocked(api.jobsApi.updateStatus).mockResolvedValue({ id: "j1", status: "shortlisted" });
  vi.mocked(api.agentsApi.run).mockResolvedValue({ message: "started" });
});

describe("DashboardPage", () => {
  it("renders dashboard heading", async () => {
    wrap(<DashboardPage />);
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("shows KPI stat cards", async () => {
    wrap(<DashboardPage />);
    // Use getAllByText since labels appear in both stat cards and pipeline bar
    expect(await screen.findAllByText("Discovered")).toBeTruthy();
    expect(screen.getAllByText("Shortlisted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Applied").length).toBeGreaterThan(0);
    expect(screen.getByText("Interviews")).toBeInTheDocument();
    expect(screen.getByText("Offers")).toBeInTheDocument();
  });

  it("shows hiring pipeline chart", async () => {
    wrap(<DashboardPage />);
    expect(await screen.findByText("Hiring Pipeline")).toBeInTheDocument();
  });

  it("shows match score distribution chart", async () => {
    wrap(<DashboardPage />);
    expect(await screen.findByText("Match Score Distribution")).toBeInTheDocument();
  });

  it("renders agent panel with run buttons", async () => {
    wrap(<DashboardPage />);
    expect(await screen.findByText("AI Agents")).toBeInTheDocument();
    expect(screen.getByText("Job Search")).toBeInTheDocument();
    expect(screen.getByText("Job Match")).toBeInTheDocument();
  });

  it("shows profile completeness", async () => {
    wrap(<DashboardPage />);
    expect(await screen.findByText("100% complete")).toBeInTheDocument();
  });

  it("shows top matches section", async () => {
    wrap(<DashboardPage />);
    expect(await screen.findByText("Top Matches")).toBeInTheDocument();
  });

  it("renders discovered jobs in feed", async () => {
    wrap(<DashboardPage />);
    // "Engineer" may appear in the feed and/or top matches
    expect(await screen.findAllByText("Engineer")).toBeTruthy();
  });

  it("shows match score percentage on job card", async () => {
    wrap(<DashboardPage />);
    // 85% may appear in the feed card and in top matches
    expect(await screen.findAllByText("85%")).toBeTruthy();
  });

  it("calls Find Jobs on button click", async () => {
    wrap(<DashboardPage />);
    const btn = await screen.findByRole("button", { name: /find jobs/i });
    fireEvent.click(btn);
    await waitFor(() => expect(api.agentsApi.run).toHaveBeenCalledWith("job_search"));
  });

  it("calls Score Jobs on button click", async () => {
    wrap(<DashboardPage />);
    const btn = await screen.findByRole("button", { name: /score jobs/i });
    fireEvent.click(btn);
    await waitFor(() => expect(api.agentsApi.run).toHaveBeenCalledWith("job_match"));
  });

  it("shortlists a job on Shortlist button click", async () => {
    wrap(<DashboardPage />);
    const btns = await screen.findAllByRole("button", { name: /shortlist/i });
    fireEvent.click(btns[0]);
    await waitFor(() => expect(api.jobsApi.updateStatus).toHaveBeenCalledWith("j1", "shortlisted"));
  });
});
