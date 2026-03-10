import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ApplicationBuilderPage from "../ApplicationBuilderPage";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  applicationsApi: {
    get: vi.fn(),
    prepare: vi.fn(),
    submit: vi.fn(),
  },
  jobsApi: { get: vi.fn() },
}));

const mockApp = { id: "app-1", job_id: "job-1", status: "draft", created_at: new Date().toISOString() };
const mockJob = { id: "job-1", source: "linkedin", company: "Acme", title: "Software Engineer", status: "shortlisted", match_score: 0.88 };
const mockPrepared = {
  job_id: "job-1",
  company: "Acme",
  title: "Software Engineer",
  tailored_resume: "Tailored resume content here",
  cover_letter: "Dear Hiring Manager, I am excited...",
  requires_approval: true,
};

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(api.applicationsApi.get).mockResolvedValue(mockApp);
  vi.mocked(api.jobsApi.get).mockResolvedValue(mockJob);
  vi.mocked(api.applicationsApi.prepare).mockResolvedValue(mockPrepared);
  vi.mocked(api.applicationsApi.submit).mockResolvedValue({ id: "app-1", status: "applied" });
});

describe("ApplicationBuilderPage", () => {
  it("renders builder heading", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    expect(await screen.findByText("Application Builder")).toBeInTheDocument();
  });

  it("shows Generate with AI button before generation", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    expect(await screen.findByRole("button", { name: /generate with ai/i })).toBeInTheDocument();
  });

  it("shows job context card", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    expect(await screen.findByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
  });

  it("calls prepare API on Generate click", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    const btn = await screen.findByRole("button", { name: /generate with ai/i });
    fireEvent.click(btn);
    await waitFor(() => expect(api.applicationsApi.prepare).toHaveBeenCalledWith("app-1"));
  });

  it("shows resume textarea after generation", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    const btn = await screen.findByRole("button", { name: /generate with ai/i });
    fireEvent.click(btn);
    expect(await screen.findByText("Tailored Resume")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tailored resume content here")).toBeInTheDocument();
  });

  it("shows cover letter textarea after generation", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    const btn = await screen.findByRole("button", { name: /generate with ai/i });
    fireEvent.click(btn);
    expect(await screen.findByText("Cover Letter")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Dear Hiring Manager/)).toBeInTheDocument();
  });

  it("allows editing resume text", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    const btn = await screen.findByRole("button", { name: /generate with ai/i });
    fireEvent.click(btn);
    const resumeArea = await screen.findByDisplayValue("Tailored resume content here");
    fireEvent.change(resumeArea, { target: { value: "Edited resume" } });
    expect(screen.getByDisplayValue("Edited resume")).toBeInTheDocument();
  });

  it("calls submit API on Submit Application click", async () => {
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    const genBtn = await screen.findByRole("button", { name: /generate with ai/i });
    fireEvent.click(genBtn);
    const submitBtn = await screen.findByRole("button", { name: /submit application/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(api.applicationsApi.submit).toHaveBeenCalledWith("app-1"));
  });

  it("shows already-submitted state when status is applied", async () => {
    vi.mocked(api.applicationsApi.get).mockResolvedValue({ ...mockApp, status: "applied" });
    wrap(<ApplicationBuilderPage applicationId="app-1" />);
    expect(await screen.findByText(/applied/i)).toBeInTheDocument();
  });
});
