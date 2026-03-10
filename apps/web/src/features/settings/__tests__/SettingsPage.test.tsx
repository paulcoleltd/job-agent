import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettingsPage } from "../SettingsPage";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  profileApi: { get: vi.fn(), update: vi.fn() },
  documentsApi: { upload: vi.fn() },
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(api.profileApi.get).mockResolvedValue({
    skills: ["Python", "React"],
    cv_text: "Sample CV text",
    preferences: {},
  });
  vi.mocked(api.profileApi.update).mockResolvedValue({ message: "Profile updated" });
  vi.mocked(api.documentsApi.upload).mockResolvedValue({ id: "doc1", name: "cv.pdf", type: "resume" });
});

describe("SettingsPage", () => {
  it("renders settings heading", async () => {
    wrap(<SettingsPage />);
    expect(await screen.findByText("Settings")).toBeInTheDocument();
  });

  it("shows CV upload section", async () => {
    wrap(<SettingsPage />);
    expect(await screen.findByText("CV / Resume")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload cv/i })).toBeInTheDocument();
  });

  it("shows skills profile section", async () => {
    wrap(<SettingsPage />);
    expect(await screen.findByText("Skills Profile")).toBeInTheDocument();
  });

  it("shows CV character count when cv_text present", async () => {
    wrap(<SettingsPage />);
    expect(await screen.findByText(/characters/i)).toBeInTheDocument();
  });

  it("adds a skill on Add button click", async () => {
    wrap(<SettingsPage />);
    const input = await screen.findByPlaceholderText(/add a skill/i);
    fireEvent.change(input, { target: { value: "TypeScript" } });
    const addBtn = screen.getByRole("button", { name: /^add$/i });
    fireEvent.click(addBtn);
    expect(await screen.findByText("TypeScript")).toBeInTheDocument();
  });

  it("adds a skill on Enter key press", async () => {
    wrap(<SettingsPage />);
    const input = await screen.findByPlaceholderText(/add a skill/i);
    fireEvent.change(input, { target: { value: "Node.js" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText("Node.js")).toBeInTheDocument();
  });

  it("saves skills when Save Skills is clicked", async () => {
    wrap(<SettingsPage />);
    const saveBtn = await screen.findByRole("button", { name: /save skills/i });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(api.profileApi.update).toHaveBeenCalled());
  });

  it("does not add duplicate skills", async () => {
    wrap(<SettingsPage />);
    const input = await screen.findByPlaceholderText(/add a skill/i);
    fireEvent.change(input, { target: { value: "Python" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const pythonItems = await screen.findAllByText("Python");
    expect(pythonItems).toHaveLength(1);
  });
});
