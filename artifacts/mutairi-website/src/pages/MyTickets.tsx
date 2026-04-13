import { useState } from "react";
import { X, ChevronLeft, Ticket, CheckCircle, Zap, Send, AlertCircle, Check } from "lucide-react";
import { useApp, type Ticket as TicketType } from "@/context/AppContext";

type Filter = "all" | "real" | "fake";

export default function MyTickets() {
  const { currentUser, tickets, transferTicket, lookupUser } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<TicketType | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; msg: string } | null>(null);

  const myTickets = tickets.filter(t => t.userEmail === currentUser?.email);
  const filtered = [...myTickets.filter(t => filter === "all" || t.paymentType === filter)].reverse();

  const fmt = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };

  const handleEmailChange = async (text: string) => {
    setTransferEmail(text); setLookedUpName(null);
    if (text.includes("@") && text.includes(".")) {
      setLookupLoading(true);
      const r = await lookupUser(text.toLowerCase());
      setLookupLoading(false);
      if (r && r.email !== currentUser?.email) setLookedUpName(r.name);
    }
  };

  const handleTransfer = async () => {
    if (!selected || !transferEmail.trim()) return setAlert({ title: "خطأ", msg: "الرجاء إدخال البريد الإلكتروني" });
    if (!lookedUpName) return setAlert({ title: "خطأ", msg: "البريد الإلكتروني غير موجود في النظام" });
    if (transferEmail.toLowerCase() === currentUser?.email) return setAlert({ title: "خطأ", msg: "لا يمكن تحويل التذكرة لنفسك" });
    setTransferLoading(true);
    const r = await transferTicket(selected.id, transferEmail.toLowerCase());
    setTransferLoading(false);
    if (r.success) { setShowTransfer(false); setSelected(null); setTransferEmail(""); setLookedUpName(null); setAlert({ title: "تم التحويل", msg: r.message }); }
    else setAlert({ title: "خطأ", msg: r.message });
  };

  return (
    <div className="flex flex-col h-full">
      {alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
            <p className="font-black text-lg mb-2" style={{ color: "#0B1426" }}>{alert.title}</p>
            <p className="text-sm mb-5" style={{ color: "#6B7A99" }}>{alert.msg}</p>
            <button onClick={() => setAlert(null)} className="w-full py-3 rounded-xl text-white font-bold grad-main">حسناً</button>
          </div>
        </div>
      )}

      <div className="px-5 pt-14 pb-5" style={{ background: "linear-gradient(135deg,#0B1426,#1B3A8C,#C9A227)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="px-4 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <p className="text-white font-black text-xl">{myTickets.length}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>تذكرة</p>
          </div>
          <p className="text-white font-black text-3xl">تذاكري</p>
        </div>
        <div className="flex gap-2 flex-row-reverse">
          {[{ v: "all", l: "الكل" }, { v: "real", l: "حقيقي" }, { v: "fake", l: "وهمي" }].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v as Filter)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{ background: filter === o.v ? "#fff" : "rgba(255,255,255,0.12)", color: filter === o.v ? "#0B1426" : "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.22)" }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4" style={{ background: "#F0F4FF" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center grad-gold">
              <Ticket size={36} color="#fff" />
            </div>
            <p className="font-black text-lg" style={{ color: "#0B1426" }}>لا توجد تذاكر</p>
            <p className="text-sm" style={{ color: "#6B7A99" }}>احجز أول تذكرة لك الآن</p>
          </div>
        ) : (
          filtered.map(t => (
            <button key={t.id} onClick={() => setSelected(t)} className="w-full bg-white rounded-2xl mb-2.5 flex items-center overflow-hidden card-shadow-sm active:scale-[0.99] transition-transform text-right">
              <ChevronLeft size={16} color="#6B7A99" className="mx-2 flex-shrink-0" />
              <div className="flex-1 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#6B7A99" }}>{fmt(t.date)}</span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: t.paymentType === "real" ? "#10B98120" : "#F59E0B20", color: t.paymentType === "real" ? "#10B981" : "#F59E0B" }}>
                    {t.paymentType === "real" ? "حقيقي" : "وهمي"}
                  </span>
                </div>
                <p className="font-bold text-sm mt-1" style={{ color: "#0B1426" }}>{t.eventName}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7A99" }}>{t.ticketCount} تذكرة · مربع {t.box}</p>
              </div>
              <div className="w-1.5 self-stretch flex-shrink-0" style={{ background: t.paymentType === "real" ? "#10B981" : "#F59E0B" }} />
            </button>
          ))
        )}
      </div>

      {selected && !showTransfer && (
        <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#F0F4FF" }}>
          <div className="flex items-center justify-between px-5 py-4 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
              <X size={20} color="#0B1426" />
            </button>
            <p className="font-bold text-lg" style={{ color: "#0B1426" }}>تفاصيل التذكرة</p>
            <div className="w-9" />
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <div className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl ${selected.paymentType === "real" ? "grad-success" : "grad-warning"}`}>
              {selected.paymentType === "real" ? <CheckCircle size={20} color="#fff" /> : <Zap size={20} color="#fff" />}
              <p className="text-white font-bold">نوع الحجز: {selected.paymentType === "real" ? "حقيقي" : "وهمي"}</p>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden card-shadow-sm">
              {[["الفعالية", selected.eventName], ["عدد التذاكر", `${selected.ticketCount} تذاكر`], ["رقم المربع", `مربع ${selected.box}`], ["الاسم", selected.userName], ["البريد الإلكتروني", selected.userEmail], ["تاريخ الحجز", fmt(selected.date)], ["الحالة", selected.status === "confirmed" ? "مؤكد" : "قيد الانتظار"]].map(([k, v], i, a) => (
                <div key={k} className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: i < a.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                  <span className="font-bold text-sm" style={{ color: "#0B1426" }}>{v}</span>
                  <span className="text-sm" style={{ color: "#6B7A99" }}>{k}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setTransferEmail(""); setLookedUpName(null); setShowTransfer(true); }}
              className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2" style={{ background: "#1B3A8C" }}>
              <Send size={18} /><span>تحويل التذكرة</span>
            </button>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#F0F4FF" }}>
          <div className="flex items-center justify-between px-5 py-4 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <button onClick={() => setShowTransfer(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
              <X size={20} color="#0B1426" />
            </button>
            <p className="font-bold text-lg" style={{ color: "#0B1426" }}>تحويل التذكرة</p>
            <div className="w-9" />
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-white" style={{ border: "1px solid #E2E8F0" }}>
              <AlertCircle size={18} color="#1B3A8C" className="flex-shrink-0 mt-0.5" />
              <p className="text-sm text-right" style={{ color: "#6B7A99", lineHeight: 1.7 }}>أدخل البريد الإلكتروني للشخص الذي تريد تحويل التذكرة إليه. سيظهر اسمه تلقائياً.</p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2 text-right" style={{ color: "#0B1426" }}>البريد الإلكتروني</p>
              <div className="flex items-center bg-white rounded-2xl px-4 py-1" style={{ border: "1px solid #E2E8F0" }}>
                <input value={transferEmail} onChange={e => handleEmailChange(e.target.value)} type="email" placeholder="example@gmail.com"
                  className="flex-1 h-12 text-right text-base outline-none bg-transparent" style={{ fontFamily: "Tajawal" }} />
                {lookupLoading && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
              </div>
            </div>

            {lookedUpName && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl" style={{ background: "#10B98120", border: "1px solid #10B981" }}>
                <Check size={18} color="#10B981" className="flex-shrink-0" />
                <span className="font-bold" style={{ color: "#10B981" }}>{lookedUpName}</span>
              </div>
            )}
            {transferEmail.length > 3 && !lookupLoading && !lookedUpName && transferEmail.includes("@") && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl" style={{ background: "#EF444420", border: "1px solid #EF4444" }}>
                <AlertCircle size={18} color="#EF4444" className="flex-shrink-0" />
                <span className="font-bold" style={{ color: "#EF4444" }}>البريد الإلكتروني غير موجود</span>
              </div>
            )}

            {selected && (
              <div className="bg-white rounded-2xl overflow-hidden card-shadow-sm">
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <span className="font-bold text-sm" style={{ color: "#0B1426" }}>{selected.eventName}</span>
                  <span className="text-sm" style={{ color: "#6B7A99" }}>الفعالية</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="font-bold text-sm" style={{ color: "#0B1426" }}>{selected.ticketCount} تذاكر</span>
                  <span className="text-sm" style={{ color: "#6B7A99" }}>العدد</span>
                </div>
              </div>
            )}

            <button onClick={handleTransfer} disabled={!lookedUpName || transferLoading}
              className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-opacity"
              style={{ background: lookedUpName ? "#1B3A8C" : "#E2E8F0", opacity: transferLoading ? 0.7 : 1 }}>
              {transferLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={18} /><span>تحويل الآن</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
