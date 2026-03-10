import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShortlistPage } from "../ShortlistPage";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  jobsApi: { list: vi.fn(), updateStatus: vi.fn() },
  applicationsApi: { create: vi.fn() },
}));

const mockJobs = [
  { id: "j1", source: "linkedin", company: "Acme", title: "Frontend Engineer", status: "shortlisted", match_score: 0.82, location: "Remote" },
  { id: "j2", source: "indeed", company: "Beta Corp", title: "Backend Dev", status: "shortlisted", match_score: 0.45 },
];

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(api.jobsApi.list).mockResolvedValue(mockJobs);
  vi.mocked(api.jobsApi.updateStatus).mockResolvedValue({ id: "j1", status: "rejected" });
  vi.mocked(api.applicationsApi.create).mockResolvedValue({ id: "app-new", job_id: "j1", status: "draft" });
});

describe("ShortlistPage", () => {
  it("renders page heading", async () => {
    wrap(<ShortlistPage />);
    expect(await screen.findByText("Shortlist")).toBeInTheDocument();
  });

  it("shows shortlisted job titles", async () => {
    wrap(<ShortlistPage />);
    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Backend Dev")).toBeInTheDocument();
  });

  it("shows match score badges", async () => {
    wrap(<ShortlistPage />);
    expect(await screen.findByText("82%")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("shows Apply button for each job", async () => {
    wrap(<ShortlistPage />);
    const applyBtns = await screen.findAllByRole("button", { name: /apply/i });
    expect(applyBtns).toHaveLength(2);
  });

  it("calls createApplication when Apply is clicked", async () => {
    wrap(<ShortlistPage />);
    const applyBtns = await screen.findAllByRole("button", { name: /apply/i });
    fireEvent.click(applyBtns[0]);
    await waitFor(() => expect(api.applicationsApi.create).toHaveBeenCalledWith("j1"));
  });

  it("calls updateStatus(rejected) when reject button clicked", async () => {
    wrap(<ShortlistPage />);
    await screen.findByText("Frontend Engineer");
    const rejectBtns = screen.getAllByRole("button").filter(b => !b.textContent?.includes("Apply"));
    fireEvent.click(rejectBtns[0]);
    await waitFor(() => expect(api.jobsApi.updateStatus).toHaveBeenCalledWith("j1", "rejected"));
  });

  it("shows empty state when no shortlisted jobs", async () => {
    vi.mocked(api.jobsApi.list).mockResolvedValue([]);
    wrap(<ShortlistPage />);
    expect(await screen.findByText(/no shortlisted jobs/i)).toBeInTheDocument();
  });
});
