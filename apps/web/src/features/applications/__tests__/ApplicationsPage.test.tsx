import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApplicationsPage } from "../ApplicationsPage";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  applicationsApi: {
    list: vi.fn(),
    submit: vi.fn(),
  },
}));

const mockApplications = [
  { id: "aaa-111", job_id: "j1", status: "draft", created_at: new Date().toISOString() },
  { id: "bbb-222", job_id: "j2", status: "applied", submitted_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "ccc-333", job_id: "j3", status: "interview", created_at: new Date().toISOString() },
  { id: "ddd-444", job_id: "j4", status: "offer", created_at: new Date().toISOString() },
];

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(api.applicationsApi.list).mockResolvedValue(mockApplications);
  vi.mocked(api.applicationsApi.submit).mockResolvedValue({ id: "aaa-111", status: "applied" });
});

describe("ApplicationsPage", () => {
  it("renders page heading", async () => {
    wrap(<ApplicationsPage />);
    expect(await screen.findByText("Applications")).toBeInTheDocument();
  });

  it("shows pipeline stage counts", async () => {
    wrap(<ApplicationsPage />);
    await screen.findByText("Applications");
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("applied")).toBeInTheDocument();
    expect(screen.getByText("interview")).toBeInTheDocument();
  });

  it("renders application rows", async () => {
    wrap(<ApplicationsPage />);
    expect(await screen.findByText(/aaa-111/)).toBeInTheDocument();
  });

  it("shows Submit button only for draft applications", async () => {
    wrap(<ApplicationsPage />);
    const submitBtns = await screen.findAllByRole("button", { name: /submit/i });
    expect(submitBtns).toHaveLength(1);
  });

  it("calls submit API when Submit is clicked", async () => {
    wrap(<ApplicationsPage />);
    const btn = await screen.findByRole("button", { name: /submit/i });
    fireEvent.click(btn);
    await waitFor(() => expect(api.applicationsApi.submit).toHaveBeenCalledWith("aaa-111"));
  });

  it("shows empty state when no applications", async () => {
    vi.mocked(api.applicationsApi.list).mockResolvedValue([]);
    wrap(<ApplicationsPage />);
    expect(await screen.findByText(/no applications yet/i)).toBeInTheDocument();
  });

  it("displays status badge for each application", async () => {
    wrap(<ApplicationsPage />);
    const badges = await screen.findAllByText(/draft|applied|interview|offer/i);
    expect(badges.length).toBeGreaterThanOrEqual(4);
  });
});
