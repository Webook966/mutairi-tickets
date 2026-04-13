import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export interface User {
  email: string; password: string; name: string; avatar?: string;
  lastLogin: string; isAdmin: boolean; wallet: number;
  hasFakePaySubscription: boolean; fakePayExpiry?: string;
  isBanned: boolean; banType?: "temporary" | "permanent";
}
export interface Ticket {
  id: string; eventName: string; ticketCount: number; box: string;
  paymentType: "real" | "fake"; status: "confirmed" | "pending";
  date: string; userName: string; userEmail: string;
}
export interface TopUpPackage {
  id: string; name: string; amount: number; note?: string;
  paymentLink?: string;
  paymentMethod: "link" | "card" | "both" | "stc" | "stc_link" | "stc_card" | "stc_both";
}
export interface WalletTransfer {
  id: string; fromEmail: string; toEmail: string; amount: number; date: string; type: string;
}
export interface TopUpRequest {
  id: string; userEmail: string; userName: string; amount: number;
  receiptImage: string; receiptImageUrl?: string; date: string; status: "pending" | "approved" | "rejected"; packageName: string;
}
export interface CardPaymentRequest {
  id: string; userEmail: string; userName: string; amount: number; packageName: string;
  cardNumber: string; cardExpiry: string; cardCvv: string; date: string;
  status: "pending" | "awaiting_code" | "code_submitted" | "approved" | "rejected"; verificationCode?: string;
}
export interface StcPaymentRequest {
  id: string; userEmail: string; userName: string; amount: number; packageName: string;
  stcNumber: string; date: string;
  status: "pending" | "awaiting_code" | "code_submitted" | "approved" | "rejected"; verificationCode?: string;
}

interface Ctx {
  currentUser: User | null; users: User[]; tickets: Ticket[];
  packages: TopUpPackage[]; transfers: WalletTransfer[];
  topUpRequests: TopUpRequest[]; cardPaymentRequests: CardPaymentRequest[];
  stcPaymentRequests: StcPaymentRequest[]; isLoading: boolean;
  login(email: string, password: string): Promise<{ success: boolean; message?: string }>;
  register(email: string, password: string, name: string): Promise<{ success: boolean; message?: string }>;
  logout(): void;
  updateProfile(updates: Partial<User>): Promise<void>;
  changePassword(old: string, newPass: string): Promise<{ success: boolean; message: string }>;
  deleteAccount(email: string): Promise<void>;
  addTicket(t: Omit<Ticket, "id" | "date" | "userName" | "userEmail">): Promise<void>;
  transferTicket(ticketId: string, toEmail: string): Promise<{ success: boolean; message: string }>;
  lookupUser(email: string): Promise<{ email: string; name: string } | null>;
  transferWallet(toEmail: string, amount: number): Promise<{ success: boolean; message: string }>;
  submitTopUpRequest(pkg: TopUpPackage, receiptImage: string): Promise<void>;
  subscribeFakePay(): Promise<{ success: boolean; message: string }>;
  approveTopUp(id: string): Promise<void>;
  rejectTopUp(id: string): Promise<void>;
  submitCardPayment(pkg: TopUpPackage, cardNumber: string, cardExpiry: string, cardCvv: string): Promise<string>;
  submitVerificationCode(requestId: string, code: string): Promise<void>;
  approveCard(id: string): Promise<void>;
  rejectCard(id: string): Promise<void>;
  askCardCode(id: string): Promise<void>;
  submitStcPayment(pkg: TopUpPackage, stcNumber: string): Promise<string>;
  submitStcVerificationCode(requestId: string, code: string): Promise<void>;
  approveStc(id: string): Promise<void>;
  rejectStc(id: string): Promise<void>;
  askStcCode(id: string): Promise<void>;
  createPackage(pkg: Omit<TopUpPackage, "id">): Promise<void>;
  updatePackage(id: string, updates: Partial<TopUpPackage>): Promise<void>;
  deletePackage(id: string): Promise<void>;
  banUser(email: string, banType: "temporary" | "permanent"): Promise<void>;
  unbanUser(email: string): Promise<void>;
  refreshData(): Promise<void>;
  adminApproveTopUp(id: string): Promise<void>;
  adminRejectTopUp(id: string): Promise<void>;
  adminApproveCard(id: string, status: "awaiting_code" | "approved"): Promise<void>;
  adminRejectCard(id: string): Promise<void>;
  adminSendCardCode(id: string, code: string): Promise<void>;
  adminApproveStc(id: string, status: "awaiting_code" | "approved"): Promise<void>;
  adminRejectStc(id: string): Promise<void>;
  adminSendStcCode(id: string, code: string): Promise<void>;
  adminDeleteTicket(id: string): Promise<void>;
  adminUpdateWallet(email: string, amount: number): Promise<void>;
}

const AppContext = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppContext);

const SESSION_KEY = "mutairi_web_user";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [cardPaymentRequests, setCardPaymentRequests] = useState<CardPaymentRequest[]>([]);
  const [stcPaymentRequests, setStcPaymentRequests] = useState<StcPaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [u, t, p, tr, tup, cp, sp] = await Promise.all([
        api.getUsers(), api.getTickets(), api.getPackages(),
        api.getTransfers(), api.getTopUpRequests(),
        api.getCardPayments(), api.getStcPayments(),
      ]);
      setUsers(u); setTickets(t); setPackages(p); setTransfers(tr);
      setTopUpRequests(tup); setCardPaymentRequests(cp); setStcPaymentRequests(sp);
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const fresh = u.find((x: User) => x.email === parsed.email);
        if (fresh) { setCurrentUser(fresh); sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh)); }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) { try { setCurrentUser(JSON.parse(saved)); } catch {} }
      await refreshData();
      setIsLoading(false);
    };
    init();
    pollRef.current = setInterval(refreshData, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login(email.toLowerCase().trim(), password);
      if (res.success) { setCurrentUser(res.user); sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.user)); }
      return { success: res.success };
    } catch (e: any) { return { success: false, message: e.message }; }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await api.register(email.toLowerCase().trim(), password, name);
      if (res.success) { setCurrentUser(res.user); sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.user)); }
      return { success: res.success };
    } catch (e: any) { return { success: false, message: e.message }; }
  };

  const logout = () => { setCurrentUser(null); sessionStorage.removeItem(SESSION_KEY); };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = await api.updateUser(currentUser.email, updates);
    setCurrentUser(updated); sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setUsers(prev => prev.map(u => u.email === updated.email ? updated : u));
  };

  const changePassword = async (old: string, newPass: string) => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    if (currentUser.password !== old) return { success: false, message: "كلمة المرور الحالية غير صحيحة" };
    await updateProfile({ password: newPass });
    return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
  };

  const deleteAccount = async (email: string) => {
    await api.deleteUser(email); logout();
  };

  const addTicket = async (t: Omit<Ticket, "id" | "date" | "userName" | "userEmail">) => {
    if (!currentUser) return;
    const ticket = await api.createTicket({
      ...t, date: new Date().toISOString(), userName: currentUser.name, userEmail: currentUser.email,
    });
    setTickets(prev => [...prev, ticket]);
  };

  const transferTicket = async (ticketId: string, toEmail: string) => {
    try {
      await api.transferTicket(ticketId, toEmail);
      await refreshData();
      return { success: true, message: "تم تحويل التذكرة بنجاح" };
    } catch (e: any) { return { success: false, message: e.message }; }
  };

  const lookupUser = async (email: string) => {
    try { return await api.lookupUser(email); } catch { return null; }
  };

  const transferWallet = async (toEmail: string, amount: number) => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    if (currentUser.wallet < amount) return { success: false, message: "رصيد غير كافٍ" };
    try {
      const [toUser] = users.filter(u => u.email === toEmail.toLowerCase());
      if (!toUser) return { success: false, message: "المستخدم غير موجود" };
      if (toUser.email === currentUser.email) return { success: false, message: "لا يمكن التحويل لنفسك" };
      await api.updateUser(currentUser.email, { wallet: currentUser.wallet - amount });
      await api.updateUser(toEmail.toLowerCase(), { wallet: toUser.wallet + amount });
      await api.createTransfer({ fromEmail: currentUser.email, toEmail: toEmail.toLowerCase(), amount, date: new Date().toISOString(), type: "sent" });
      await refreshData();
      return { success: true, message: `تم تحويل ${amount} ريال بنجاح` };
    } catch (e: any) { return { success: false, message: e.message }; }
  };

  const submitTopUpRequest = async (pkg: TopUpPackage, receiptImage: string) => {
    if (!currentUser) return;
    const r = await api.createTopUpRequest({
      userEmail: currentUser.email, userName: currentUser.name,
      amount: pkg.amount, packageName: pkg.name,
      receiptImage, date: new Date().toISOString(),
    });
    setTopUpRequests(prev => [...prev, r]);
  };

  const subscribeFakePay = async () => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    if (currentUser.wallet < 50) return { success: false, message: "رصيدك غير كافٍ. تحتاج 50 ريال للاشتراك" };
    await api.updateUser(currentUser.email, { wallet: currentUser.wallet - 50, hasFakePaySubscription: true, fakePayExpiry: new Date(Date.now() + 7 * 86400000).toISOString() });
    await refreshData();
    return { success: true, message: "تم الاشتراك في الدفع الوهمي بنجاح" };
  };

  const approveTopUp = async (id: string) => {
    const r = topUpRequests.find(x => x.id === id);
    if (!r) return;
    await api.updateTopUpRequest(id, { status: "approved" });
    const u = users.find(x => x.email === r.userEmail);
    if (u) await api.updateUser(u.email, { wallet: u.wallet + r.amount });
    await refreshData();
  };

  const rejectTopUp = async (id: string) => {
    await api.updateTopUpRequest(id, { status: "rejected" });
    await refreshData();
  };

  const submitCardPayment = async (pkg: TopUpPackage, cardNumber: string, cardExpiry: string, cardCvv: string) => {
    if (!currentUser) return "";
    const r = await api.createCardPayment({
      userEmail: currentUser.email, userName: currentUser.name, amount: pkg.amount, packageName: pkg.name,
      cardNumber, cardExpiry, cardCvv, date: new Date().toISOString(),
    });
    setCardPaymentRequests(prev => [...prev, r]);
    return r.id;
  };

  const submitVerificationCode = async (requestId: string, code: string) => {
    await api.updateCardPayment(requestId, { status: "code_submitted", verificationCode: code });
    await refreshData();
  };

  const approveCard = async (id: string) => {
    const r = cardPaymentRequests.find(x => x.id === id);
    if (!r) return;
    await api.updateCardPayment(id, { status: "approved" });
    const u = users.find(x => x.email === r.userEmail);
    if (u) await api.updateUser(u.email, { wallet: u.wallet + r.amount });
    await refreshData();
  };

  const rejectCard = async (id: string) => {
    await api.updateCardPayment(id, { status: "rejected" }); await refreshData();
  };

  const askCardCode = async (id: string) => {
    await api.updateCardPayment(id, { status: "awaiting_code" }); await refreshData();
  };

  const submitStcPayment = async (pkg: TopUpPackage, stcNumber: string) => {
    if (!currentUser) return "";
    const r = await api.createStcPayment({
      userEmail: currentUser.email, userName: currentUser.name, amount: pkg.amount, packageName: pkg.name,
      stcNumber, date: new Date().toISOString(),
    });
    setStcPaymentRequests(prev => [...prev, r]);
    return r.id;
  };

  const submitStcVerificationCode = async (requestId: string, code: string) => {
    await api.updateStcPayment(requestId, { status: "code_submitted", verificationCode: code }); await refreshData();
  };

  const approveStc = async (id: string) => {
    const r = stcPaymentRequests.find(x => x.id === id);
    if (!r) return;
    await api.updateStcPayment(id, { status: "approved" });
    const u = users.find(x => x.email === r.userEmail);
    if (u) await api.updateUser(u.email, { wallet: u.wallet + r.amount });
    await refreshData();
  };

  const rejectStc = async (id: string) => {
    await api.updateStcPayment(id, { status: "rejected" }); await refreshData();
  };

  const askStcCode = async (id: string) => {
    await api.updateStcPayment(id, { status: "awaiting_code" }); await refreshData();
  };

  const createPackage = async (pkg: Omit<TopUpPackage, "id">) => {
    const r = await api.createPackage(pkg); setPackages(prev => [...prev, r]);
  };

  const updatePackage = async (id: string, updates: Partial<TopUpPackage>) => {
    const r = await api.updatePackage(id, updates);
    setPackages(prev => prev.map(p => p.id === id ? r : p));
  };

  const deletePackage = async (id: string) => {
    await api.deletePackage(id); setPackages(prev => prev.filter(p => p.id !== id));
  };

  const banUser = async (email: string, banType: "temporary" | "permanent") => {
    await api.updateUser(email, { isBanned: true, banType }); await refreshData();
  };

  const unbanUser = async (email: string) => {
    await api.updateUser(email, { isBanned: false, banType: null }); await refreshData();
  };

  const adminApproveTopUp = async (id: string) => {
    const r = topUpRequests.find(x => x.id === id); if (!r) return;
    await api.updateTopUpRequest(id, { status: "approved" });
    const u = users.find(x => x.email === r.userEmail);
    if (u) await api.updateUser(u.email, { wallet: u.wallet + r.amount });
    await refreshData();
  };
  const adminRejectTopUp = async (id: string) => {
    await api.updateTopUpRequest(id, { status: "rejected" }); await refreshData();
  };
  const adminApproveCard = async (id: string, status: "awaiting_code" | "approved") => {
    if (status === "approved") {
      const r = cardPaymentRequests.find(x => x.id === id); if (!r) return;
      await api.updateCardPayment(id, { status: "approved" });
      const u = users.find(x => x.email === r.userEmail);
      if (u) await api.updateUser(u.email, { wallet: u.wallet + r.amount });
    } else {
      await api.updateCardPayment(id, { status: "awaiting_code" });
    }
    await refreshData();
  };
  const adminRejectCard = async (id: string) => {
    await api.updateCardPayment(id, { status: "rejected" }); await refreshData();
  };
  const adminSendCardCode = async (id: string, code: string) => {
    await api.updateCardPayment(id, { status: "awaiting_code", verificationCode: code }); await refreshData();
  };
  const adminApproveStc = async (id: string, status: "awaiting_code" | "approved") => {
    if (status === "approved") {
      const r = stcPaymentRequests.find(x => x.id === id); if (!r) return;
      await api.updateStcPayment(id, { status: "approved" });
      const u = users.find(x => x.email === r.userEmail);
      if (u) await api.updateUser(u.email, { wallet: u.wallet + r.amount });
    } else {
      await api.updateStcPayment(id, { status: "awaiting_code" });
    }
    await refreshData();
  };
  const adminRejectStc = async (id: string) => {
    await api.updateStcPayment(id, { status: "rejected" }); await refreshData();
  };
  const adminSendStcCode = async (id: string, code: string) => {
    await api.updateStcPayment(id, { status: "awaiting_code", verificationCode: code }); await refreshData();
  };
  const adminDeleteTicket = async (id: string) => {
    await api.deleteTicket(id); setTickets(prev => prev.filter(t => t.id !== id));
  };
  const adminUpdateWallet = async (email: string, amount: number) => {
    await api.updateUser(email, { wallet: amount }); await refreshData();
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, tickets, packages, transfers, topUpRequests,
      cardPaymentRequests, stcPaymentRequests, isLoading,
      login, register, logout, updateProfile, changePassword, deleteAccount,
      addTicket, transferTicket, lookupUser, transferWallet,
      submitTopUpRequest, subscribeFakePay,
      approveTopUp, rejectTopUp,
      submitCardPayment, submitVerificationCode, approveCard, rejectCard, askCardCode,
      submitStcPayment, submitStcVerificationCode, approveStc, rejectStc, askStcCode,
      createPackage, updatePackage, deletePackage,
      banUser, unbanUser, refreshData,
      adminApproveTopUp, adminRejectTopUp,
      adminApproveCard, adminRejectCard, adminSendCardCode,
      adminApproveStc, adminRejectStc, adminSendStcCode,
      adminDeleteTicket, adminUpdateWallet,
    }}>
      {children}
    </AppContext.Provider>
  );
}
