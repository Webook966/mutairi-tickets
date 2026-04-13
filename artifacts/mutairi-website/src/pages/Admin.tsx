import { useState } from "react";
import { Shield, X, Check, ChevronLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

type AdminTab = "tickets" | "topup" | "card" | "stc" | "users";

interface Props { navigate: (page: string) => void; }

export default function Admin({ navigate }: Props) {
  const {
    currentUser, tickets, users, topUpRequests, cardPaymentRequests, stcPaymentRequests,
    adminApproveTopUp, adminRejectTopUp,
    adminApproveCard, adminRejectCard, adminSendCardCode,
    adminApproveStc, adminRejectStc, adminSendStcCode,
    adminDeleteTicket, adminUpdateWallet,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>("tickets");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; msg: string } | null>(null);
  const [codeInput, setCodeInput] = useState<Record<string, string>>({});
  const [walletEdit, setWalletEdit] = useState<Record<string, string>>({});

  if (!currentUser?.isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Shield size={60} color="#E2E8F0" />
      <p className="font-black text-xl" style={{ color: "#0B1426" }}>غير مصرح</p>
      <button onClick={() => navigate("home")} className="px-6 py-3 rounded-2xl text-white font-bold grad-main">رجوع</button>
    </div>
  );

  const doAction = async (fn: () => Promise<any>, successMsg?: string) => {
    setLoading(true); const r = await fn(); setLoading(false);
    if (successMsg || r?.message) setAlert({ title: "تم", msg: successMsg ?? r?.message ?? "" });
  };

  const tabs = [
    { id: "tickets", label: "التذاكر", count: tickets.length },
    { id: "topup", label: "طلبات الشحن", count: topUpRequests.filter(r => r.status === "pending").length },
    { id: "card", label: "بطاقات", count: cardPaymentRequests.filter(r => r.status === "pending" || r.status === "awaiting_code").length },
    { id: "stc", label: "STC", count: stcPaymentRequests.filter(r => r.status === "pending" || r.status === "awaiting_code").length },
    { id: "users", label: "المستخدمون", count: users.length },
  ] as const;

  const statusBadge = (s: string) => {
    const m: Record<string, { bg: string; c: string; l: string }> = {
      pending: { bg: "#EEF2FF", c: "#6B7A99", l: "انتظار" },
      approved: { bg: "#10B98120", c: "#10B981", l: "موافق" },
      rejected: { bg: "#EF444420", c: "#EF4444", l: "مرفوض" },
      awaiting_code: { bg: "#F59E0B20", c: "#F59E0B", l: "انتظار كود" },
      code_submitted: { bg: "#1B4FD820", c: "#1B4FD8", l: "تم إرسال كود" },
      confirmed: { bg: "#10B98120", c: "#10B981", l: "مؤكد" },
    };
    const st = m[s] ?? m.pending;
    return <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: st.bg, color: st.c }}>{st.l}</span>;
  };

  const fmt = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(11,20,38,0.6)" }}>
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      {alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
            <p className="font-black text-lg mb-2" style={{ color: "#0B1426" }}>{alert.title}</p>
            <p className="text-sm mb-5" style={{ color: "#6B7A99" }}>{alert.msg}</p>
            <button onClick={() => setAlert(null)} className="w-full py-3 rounded-xl text-white font-bold grad-main">حسناً</button>
          </div>
        </div>
      )}

      <div className="grad-gold px-5 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("home")} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
          <p className="text-white font-black text-2xl flex-1 text-right">لوحة الإدارة</p>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-2 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all"
            style={{ background: tab === t.id ? "#0B1426" : "#EEF2FF", color: tab === t.id ? "#fff" : "#6B7A99" }}>
            <span>{t.label}</span>
            {t.count > 0 && <span className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center" style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : "#C9A227", color: "#fff" }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4" style={{ background: "#F0F4FF" }}>
        {tab === "tickets" && (
          <div>
            {[...tickets].reverse().map(t => (
              <div key={t.id} className="bg-white rounded-2xl mb-2.5 flex items-center overflow-hidden card-shadow-sm">
                <div className="flex-1 text-right px-4 py-3">
                  {statusBadge(t.paymentType === "real" ? "confirmed" : "confirmed")}
                  <p className="font-bold text-sm mt-1" style={{ color: "#0B1426" }}>{t.eventName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7A99" }}>{t.userName} · {t.ticketCount} تذكرة · مربع {t.box} · {fmt(t.date)}</p>
                  <p className="text-xs" style={{ color: "#6B7A99" }}>{t.userEmail}</p>
                </div>
                <button onClick={() => doAction(() => adminDeleteTicket(t.id), "تم حذف التذكرة")} className="w-10 h-10 flex items-center justify-center mx-2 rounded-xl" style={{ background: "#FEE2E2" }}>
                  <X size={18} color="#EF4444" />
                </button>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-center py-10" style={{ color: "#6B7A99" }}>لا توجد تذاكر</p>}
          </div>
        )}

        {tab === "topup" && (
          <div>
            {[...topUpRequests].reverse().map(r => (
              <div key={r.id} className="bg-white rounded-2xl mb-2.5 p-4 card-shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  {statusBadge(r.status)}
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: "#0B1426" }}>{r.packageName} — {r.amount} ر.س</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>{r.userEmail} · {fmt(r.date)}</p>
                  </div>
                </div>
                {(r.receiptImage ?? r.receiptImageUrl) && <img src={r.receiptImage ?? r.receiptImageUrl} alt="receipt" className="w-full max-h-36 object-cover rounded-xl mb-3" />}
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction(() => adminRejectTopUp(r.id))} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>رفض</button>
                    <button onClick={() => doAction(() => adminApproveTopUp(r.id))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#10B981" }}>موافقة</button>
                  </div>
                )}
              </div>
            ))}
            {topUpRequests.length === 0 && <p className="text-center py-10" style={{ color: "#6B7A99" }}>لا توجد طلبات</p>}
          </div>
        )}

        {tab === "card" && (
          <div>
            {[...cardPaymentRequests].reverse().map(r => (
              <div key={r.id} className="bg-white rounded-2xl mb-2.5 p-4 card-shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  {statusBadge(r.status)}
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: "#0B1426" }}>{r.packageName} — {r.amount} ر.س</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>{r.userEmail}</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>البطاقة: {r.cardNumber ? `****${r.cardNumber.replace(/\s/g, "").slice(-4)}` : "غير محدد"}</p>
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction(() => adminRejectCard(r.id))} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>رفض</button>
                    <button onClick={() => doAction(() => adminApproveCard(r.id, "awaiting_code"))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#F59E0B" }}>طلب كود</button>
                    <button onClick={() => doAction(() => adminApproveCard(r.id, "approved"))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#10B981" }}>موافقة</button>
                  </div>
                )}
                {r.status === "awaiting_code" && (
                  <div className="flex gap-2 mt-2">
                    <input value={codeInput[r.id] ?? ""} onChange={e => setCodeInput(s => ({ ...s, [r.id]: e.target.value }))} placeholder="الكود للعميل"
                      className="flex-1 h-10 rounded-xl px-3 text-center text-sm outline-none" style={{ background: "#EEF2FF", fontFamily: "Tajawal" }} />
                    <button onClick={() => doAction(() => adminSendCardCode(r.id, codeInput[r.id] ?? ""))} className="px-4 rounded-xl text-white text-sm font-bold" style={{ background: "#1B4FD8" }}>إرسال</button>
                  </div>
                )}
                {r.status === "code_submitted" && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction(() => adminRejectCard(r.id))} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>رفض</button>
                    <button onClick={() => doAction(() => adminApproveCard(r.id, "approved"))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#10B981" }}>موافقة</button>
                  </div>
                )}
              </div>
            ))}
            {cardPaymentRequests.length === 0 && <p className="text-center py-10" style={{ color: "#6B7A99" }}>لا توجد طلبات</p>}
          </div>
        )}

        {tab === "stc" && (
          <div>
            {[...stcPaymentRequests].reverse().map(r => (
              <div key={r.id} className="bg-white rounded-2xl mb-2.5 p-4 card-shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  {statusBadge(r.status)}
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: "#0B1426" }}>{r.packageName} — {r.amount} ر.س</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>{r.userEmail}</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>STC: {r.stcNumber}</p>
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction(() => adminRejectStc(r.id))} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>رفض</button>
                    <button onClick={() => doAction(() => adminApproveStc(r.id, "awaiting_code"))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#F59E0B" }}>طلب كود</button>
                    <button onClick={() => doAction(() => adminApproveStc(r.id, "approved"))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#10B981" }}>موافقة</button>
                  </div>
                )}
                {r.status === "awaiting_code" && (
                  <div className="flex gap-2 mt-2">
                    <input value={codeInput[r.id] ?? ""} onChange={e => setCodeInput(s => ({ ...s, [r.id]: e.target.value }))} placeholder="الكود للعميل"
                      className="flex-1 h-10 rounded-xl px-3 text-center text-sm outline-none" style={{ background: "#EEF2FF" }} />
                    <button onClick={() => doAction(() => adminSendStcCode(r.id, codeInput[r.id] ?? ""))} className="px-4 rounded-xl text-white text-sm font-bold" style={{ background: "#7C3AED" }}>إرسال</button>
                  </div>
                )}
                {r.status === "code_submitted" && (
                  <div className="flex gap-2">
                    <button onClick={() => doAction(() => adminRejectStc(r.id))} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>رفض</button>
                    <button onClick={() => doAction(() => adminApproveStc(r.id, "approved"))} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#10B981" }}>موافقة</button>
                  </div>
                )}
              </div>
            ))}
            {stcPaymentRequests.length === 0 && <p className="text-center py-10" style={{ color: "#6B7A99" }}>لا توجد طلبات</p>}
          </div>
        )}

        {tab === "users" && (
          <div>
            {users.filter(u => u.email !== "888888000888").map(u => (
              <div key={u.email} className="bg-white rounded-2xl mb-2.5 p-4 card-shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {u.hasFakePaySubscription && <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "#C9A22720", color: "#C9A227" }}>فيك باي</span>}
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "#10B98120", color: "#10B981" }}>{u.wallet} ر.س</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: "#0B1426" }}>{u.name}</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <button onClick={() => doAction(() => adminUpdateWallet(u.email, Number(walletEdit[u.email] ?? u.wallet)))} className="px-3 py-2 rounded-xl text-white text-sm font-bold" style={{ background: "#1B4FD8" }}>تحديث</button>
                  <input value={walletEdit[u.email] ?? u.wallet} onChange={e => setWalletEdit(s => ({ ...s, [u.email]: e.target.value }))} type="number" placeholder="الرصيد"
                    className="flex-1 h-9 rounded-xl px-3 text-right text-sm outline-none" style={{ background: "#EEF2FF" }} />
                  <span className="text-sm font-bold" style={{ color: "#6B7A99" }}>الرصيد:</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
