import { Platform } from "react-native";
import { User, Ticket, TopUpPackage, WalletTransfer, TopUpRequest, CardPaymentRequest } from "@/context/AppContext";

const getBase = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  if (Platform.OS === "web") return "";
  return "http://localhost:8080";
};

async function req<T>(
  path: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const base = getBase();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || "خطأ في الخادم");
  return data as T;
}

// ── AUTH ───────────────────────────────────────────────────────────────────────

export const apiLogin = (email: string, password: string) =>
  req<{ success: boolean; message?: string; user?: User }>("/api/auth/login", "POST", { email, password });

export const apiRegister = (email: string, password: string, name: string) =>
  req<{ success: boolean; message?: string; user?: User }>("/api/auth/register", "POST", { email, password, name });

// ── USERS ──────────────────────────────────────────────────────────────────────

export const apiGetUsers = () => req<User[]>("/api/users");

export const apiUpdateUser = (email: string, updates: Partial<User>) =>
  req<User>(`/api/users/${encodeURIComponent(email)}`, "PATCH", updates);

export const apiDeleteUser = (email: string) =>
  req<{ success: boolean }>(`/api/users/${encodeURIComponent(email)}`, "DELETE");

// ── PACKAGES ──────────────────────────────────────────────────────────────────

export const apiGetPackages = () => req<TopUpPackage[]>("/api/packages");

export const apiCreatePackage = (pkg: Omit<TopUpPackage, "id">) =>
  req<TopUpPackage>("/api/packages", "POST", pkg);

export const apiDeletePackage = (id: string) =>
  req<{ success: boolean }>(`/api/packages/${id}`, "DELETE");

// ── TICKETS ───────────────────────────────────────────────────────────────────

export const apiGetTickets = () => req<Ticket[]>("/api/tickets");

export const apiCreateTicket = (ticket: Omit<Ticket, "id">) =>
  req<Ticket>("/api/tickets", "POST", ticket);

export const apiTransferTicket = (ticketId: string, toEmail: string) =>
  req<Ticket>(`/api/tickets/${ticketId}/transfer`, "POST", { toEmail });

export const apiLookupUser = (email: string) =>
  req<{ email: string; name: string }>(`/api/users/lookup?email=${encodeURIComponent(email)}`);

// ── TRANSFERS ─────────────────────────────────────────────────────────────────

export const apiGetTransfers = () => req<WalletTransfer[]>("/api/transfers");

export const apiCreateTransfer = (transfer: Omit<WalletTransfer, "id">) =>
  req<WalletTransfer>("/api/transfers", "POST", transfer);

// ── TOP-UP REQUESTS ───────────────────────────────────────────────────────────

export const apiGetTopUpRequests = () => req<TopUpRequest[]>("/api/topup-requests");

export const apiCreateTopUpRequest = (r: Omit<TopUpRequest, "id">) =>
  req<TopUpRequest>("/api/topup-requests", "POST", r);

export const apiUpdateTopUpRequest = (id: string, updates: Partial<TopUpRequest>) =>
  req<{ success: boolean }>(`/api/topup-requests/${id}`, "PATCH", updates);

// ── PACKAGES (edit) ───────────────────────────────────────────────────────────

export const apiUpdatePackage = (id: string, updates: Partial<TopUpPackage>) =>
  req<TopUpPackage>(`/api/packages/${id}`, "PATCH", updates);

// ── CARD PAYMENT REQUESTS ─────────────────────────────────────────────────────

export const apiGetCardPayments = () => req<CardPaymentRequest[]>("/api/card-payments");

export const apiCreateCardPayment = (r: Omit<CardPaymentRequest, "id">) =>
  req<CardPaymentRequest>("/api/card-payments", "POST", r);

export const apiUpdateCardPayment = (id: string, updates: Partial<CardPaymentRequest>) =>
  req<{ success: boolean }>(`/api/card-payments/${id}`, "PATCH", updates);

// ── STC PAYMENT REQUESTS ──────────────────────────────────────────────────────

export const apiGetStcPayments = () => req<StcPaymentRequest[]>("/api/stc-payments");

export const apiCreateStcPayment = (r: Omit<StcPaymentRequest, "id">) =>
  req<StcPaymentRequest>("/api/stc-payments", "POST", r);

export const apiUpdateStcPayment = (id: string, updates: Partial<StcPaymentRequest>) =>
  req<{ success: boolean }>(`/api/stc-payments/${id}`, "PATCH", updates);

export interface StcPaymentRequest {
  id: string;
  userEmail: string;
  userName: string;
  amount: number;
  packageName: string;
  stcNumber: string;
  date: string;
  status: "pending" | "awaiting_code" | "code_submitted" | "approved" | "rejected";
  verificationCode?: string;
}
