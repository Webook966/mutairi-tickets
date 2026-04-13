const BASE = "/api";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || "خطأ في الخادم");
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    req<{ success: boolean; user: any }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name: string) =>
    req<{ success: boolean; user: any }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  getUsers: () => req<any[]>("/users"),
  updateUser: (email: string, updates: any) =>
    req<any>(`/users/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify(updates) }),
  deleteUser: (email: string) =>
    req<any>(`/users/${encodeURIComponent(email)}`, { method: "DELETE" }),
  lookupUser: (email: string) =>
    req<{ email: string; name: string }>(`/users/lookup?email=${encodeURIComponent(email)}`),
  getPackages: () => req<any[]>("/packages"),
  createPackage: (pkg: any) =>
    req<any>("/packages", { method: "POST", body: JSON.stringify(pkg) }),
  updatePackage: (id: string, updates: any) =>
    req<any>(`/packages/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  deletePackage: (id: string) =>
    req<any>(`/packages/${id}`, { method: "DELETE" }),
  getTickets: () => req<any[]>("/tickets"),
  createTicket: (ticket: any) =>
    req<any>("/tickets", { method: "POST", body: JSON.stringify(ticket) }),
  deleteTicket: (id: string) =>
    req<any>(`/tickets/${id}`, { method: "DELETE" }),
  transferTicket: (id: string, toEmail: string) =>
    req<any>(`/tickets/${id}/transfer`, { method: "POST", body: JSON.stringify({ toEmail }) }),
  getTransfers: () => req<any[]>("/transfers"),
  createTransfer: (transfer: any) =>
    req<any>("/transfers", { method: "POST", body: JSON.stringify(transfer) }),
  getTopUpRequests: () => req<any[]>("/topup-requests"),
  createTopUpRequest: (r: any) =>
    req<any>("/topup-requests", { method: "POST", body: JSON.stringify(r) }),
  updateTopUpRequest: (id: string, updates: any) =>
    req<any>(`/topup-requests/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  getCardPayments: () => req<any[]>("/card-payments"),
  createCardPayment: (r: any) =>
    req<any>("/card-payments", { method: "POST", body: JSON.stringify(r) }),
  updateCardPayment: (id: string, updates: any) =>
    req<any>(`/card-payments/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  getStcPayments: () => req<any[]>("/stc-payments"),
  createStcPayment: (r: any) =>
    req<any>("/stc-payments", { method: "POST", body: JSON.stringify(r) }),
  updateStcPayment: (id: string, updates: any) =>
    req<any>(`/stc-payments/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
};
