import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL });

export const jobsApi = {
  list: (params?: { status?: string; min_score?: number }) =>
    api.get("/jobs", { params }).then(r => r.data),
  get: (id: string) => api.get(`/jobs/${id}`).then(r => r.data),
  search: (q: string) => api.get("/jobs/search", { params: { q } }).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/jobs/${id}/status`, null, { params: { status } }).then(r => r.data),
};

export const applicationsApi = {
  list: () => api.get("/applications").then(r => r.data),
  create: (job_id: string) => api.post("/applications", { job_id }).then(r => r.data),
  get: (id: string) => api.get(`/applications/${id}`).then(r => r.data),
  prepare: (id: string) => api.post(`/applications/${id}/prepare`).then(r => r.data),
  submit: (id: string) => api.post(`/applications/${id}/submit`).then(r => r.data),
};

export const agentsApi = {
  run: (agent_name: string) =>
    api.post("/agents/run", null, { params: { agent_name } }).then(r => r.data),
  listRuns: () => api.get("/agents/runs").then(r => r.data),
};

export const profileApi = {
  get: () => api.get("/profile").then(r => r.data),
  update: (data: { cv_text?: string; skills?: string[]; preferences?: object }) =>
    api.put("/profile", data).then(r => r.data),
};

export const documentsApi = {
  upload: (file: File, doc_type = "resume") => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/documents/upload?doc_type=${doc_type}`, form).then(r => r.data);
  },
};
