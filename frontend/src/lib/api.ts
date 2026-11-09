export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Role = "researcher" | "panel" | "admin";
export type SubmissionStatus = "pending" | "under_review" | "approved" | "rejected";
export type Decision = "approve" | "reject";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Review {
  id: number;
  decision: Decision;
  comment: string;
  created_at: string;
  reviewer: User;
}

export interface Submission {
  id: number;
  title: string;
  abstract: string;
  authors: string;
  keywords: string;
  file_name: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  submitter: User;
  review_count: number;
}

export interface SubmissionDetail extends Submission {
  reviews: Review[];
}

export interface Stats {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TOKEN_KEY = "rr_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. It may be waking up, which can take up to a minute. Please try again.");
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  me: () => request<User>("/api/auth/me"),

  listSubmissions: (params: { status?: SubmissionStatus; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<Submission[]>(`/api/submissions${suffix}`);
  },
  stats: () => request<Stats>("/api/submissions/stats"),
  getSubmission: (id: number | string) => request<SubmissionDetail>(`/api/submissions/${id}`),
  createSubmission: (form: FormData) => request<Submission>("/api/submissions", { method: "POST", body: form }),
  review: (id: number | string, decision: Decision, comment: string) =>
    request<SubmissionDetail>(`/api/submissions/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ decision, comment }),
    }),

  /** Downloads the file with the auth header and opens it in a new tab. */
  async openFile(id: number | string) {
    const res = await fetch(`${API_URL}/api/submissions/${id}/file`, {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    if (!res.ok) throw new ApiError(res.status, "Could not open the file");
    const url = URL.createObjectURL(await res.blob());
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
