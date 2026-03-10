import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios", () => {
  const mockAxios: any = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    defaults: { baseURL: "" },
  };
  return { default: mockAxios };
});

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("jobsApi.list calls GET /jobs", async () => {
    const mockData = [{ id: "1", title: "Engineer", company: "ACME", status: "discovered", source: "greenhouse" }];
    (axios.get as any).mockResolvedValue({ data: mockData });

    const { jobsApi } = await import("../api");
    const result = await jobsApi.list();
    expect(axios.get).toHaveBeenCalledWith("/jobs", { params: undefined });
    expect(result).toEqual(mockData);
  });

  it("jobsApi.list passes status filter", async () => {
    (axios.get as any).mockResolvedValue({ data: [] });
    const { jobsApi } = await import("../api");
    await jobsApi.list({ status: "shortlisted" });
    expect(axios.get).toHaveBeenCalledWith("/jobs", { params: { status: "shortlisted" } });
  });

  it("applicationsApi.create calls POST /applications", async () => {
    const mockApp = { id: "app1", job_id: "job1", status: "draft" };
    (axios.post as any).mockResolvedValue({ data: mockApp });
    const { applicationsApi } = await import("../api");
    const result = await applicationsApi.create("job1");
    expect(axios.post).toHaveBeenCalledWith("/applications", { job_id: "job1" });
    expect(result).toEqual(mockApp);
  });

  it("agentsApi.run calls POST /agents/run with agent name", async () => {
    (axios.post as any).mockResolvedValue({ data: { message: "started" } });
    const { agentsApi } = await import("../api");
    await agentsApi.run("job_search");
    expect(axios.post).toHaveBeenCalledWith("/agents/run", null, {
      params: { agent_name: "job_search" },
    });
  });

  it("profileApi.update calls PUT /profile", async () => {
    (axios.put as any).mockResolvedValue({ data: { message: "updated" } });
    const { profileApi } = await import("../api");
    await profileApi.update({ skills: ["Python", "React"] });
    expect(axios.put).toHaveBeenCalledWith("/profile", { skills: ["Python", "React"] });
  });
});
