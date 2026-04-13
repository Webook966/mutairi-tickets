import { useApp } from "@/context/AppContext";
import { Ticket, BookOpen, Wallet, User, Shield, ChevronLeft } from "lucide-react";

interface Props { navigate: (page: string) => void; }

export default function Home({ navigate }: Props) {
  const { currentUser, tickets } = useApp();
  const myTickets = tickets.filter(t => t.userEmail === currentUser?.email);
  const recent = [...myTickets].reverse().slice(0, 3);

  const actions = [
    { label: "حجز تذكرة", icon: Ticket, page: "book", grad: "linear-gradient(135deg,#1B4FD8,#0B1426)" },
    { label: "تذاكري", icon: BookOpen, page: "my-tickets", grad: "linear-gradient(135deg,#C9A227,#7B5E0F)" },
    { label: "المحفظة", icon: Wallet, page: "wallet", grad: "linear-gradient(135deg,#10B981,#065F46)" },
    { label: "حسابي", icon: User, page: "account", grad: "linear-gradient(135deg,#6B7A99,#3B4561)" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="grad-main px-5 pt-14 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("account")} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
            <User size={20} color="#fff" />
          </button>
          <div className="flex-1 text-right">
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>مرحباً بك</p>
            <p className="font-black text-xl text-white">{currentUser?.name}</p>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "right" }}>رصيد المحفظة</p>
          <p className="font-black text-right" style={{ color: "#fff", fontSize: 44, lineHeight: 1.1, marginBottom: 12 }}>
            {currentUser?.wallet ?? 0} <span style={{ fontSize: 20, fontWeight: 700 }}>ر.س</span>
          </p>
          <div className="flex">
            {[
              { num: myTickets.length, label: "تذاكر" },
              { num: myTickets.filter(t => t.paymentType === "real").length, label: "حقيقية" },
              { num: myTickets.filter(t => t.paymentType === "fake").length, label: "وهمية" },
            ].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1" style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
                <span className="text-white font-bold text-xl">{s.num}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5" style={{ background: "#F0F4FF" }}>
        <p className="text-right font-black text-lg mb-3" style={{ color: "#0B1426" }}>الخدمات</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {actions.map(a => (
            <button key={a.label} onClick={() => navigate(a.page)}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white card-shadow-sm active:scale-95 transition-transform">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: a.grad, boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}>
                <a.icon size={30} color="#fff" />
              </div>
              <span className="font-bold text-sm" style={{ color: "#0B1426" }}>{a.label}</span>
            </button>
          ))}
        </div>

        {recent.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => navigate("my-tickets")} className="text-sm font-bold" style={{ color: "#1B4FD8" }}>عرض الكل</button>
              <p className="font-black text-lg" style={{ color: "#0B1426" }}>آخر الحجوزات</p>
            </div>
            {recent.map(t => (
              <div key={t.id} className="bg-white rounded-2xl mb-2.5 flex items-center overflow-hidden card-shadow-sm">
                <ChevronLeft size={16} color="#6B7A99" className="mx-2 flex-shrink-0" />
                <div className="flex-1 py-3 text-right">
                  <div className="inline-block px-2 py-0.5 rounded-lg mb-1 text-xs font-bold"
                    style={{ background: t.paymentType === "real" ? "#10B98120" : "#F59E0B20", color: t.paymentType === "real" ? "#10B981" : "#F59E0B" }}>
                    {t.paymentType === "real" ? "حقيقي" : "وهمي"}
                  </div>
                  <p className="font-bold text-sm" style={{ color: "#0B1426" }}>{t.eventName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7A99" }}>{t.ticketCount} تذكرة · مربع {t.box}</p>
                </div>
                <div className="w-1.5 self-stretch flex-shrink-0" style={{ background: t.paymentType === "real" ? "#10B981" : "#F59E0B" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 card-shadow">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center grad-main">
              <Ticket size={36} color="#fff" />
            </div>
            <p className="font-black text-lg" style={{ color: "#0B1426" }}>لا توجد تذاكر بعد</p>
            <p className="text-sm text-center" style={{ color: "#6B7A99" }}>ابدأ بحجز تذكرتك الأولى الآن</p>
            <button onClick={() => navigate("book")} className="px-8 py-3.5 rounded-2xl text-white font-bold grad-main" style={{ boxShadow: "0 4px 16px rgba(27,79,216,0.35)" }}>
              احجز الآن
            </button>
          </div>
        )}

        {currentUser?.isAdmin && (
          <button onClick={() => navigate("admin")} className="w-full mt-4 rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(201,162,39,0.5)", boxShadow: "0 4px 12px rgba(201,162,39,0.2)" }}>
            <div className="grad-gold flex items-center gap-3 px-5 py-4">
              <Shield size={22} color="#fff" />
              <span className="flex-1 text-right text-white font-bold text-base">لوحة الإدارة</span>
              <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
