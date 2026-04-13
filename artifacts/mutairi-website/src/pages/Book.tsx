import { useState } from "react";
import { CheckCircle, ArrowLeft, Ticket, Zap, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";

type Step = "event" | "count" | "box" | "payment" | "done";

interface Props { navigate: (page: string) => void; }

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export default function Book({ navigate }: Props) {
  const { currentUser, addTicket } = useApp();
  const [step, setStep] = useState<Step>("event");
  const [eventName, setEventName] = useState("");
  const [ticketCount, setTicketCount] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const [paymentType, setPaymentType] = useState<"real" | "fake" | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [fakePayConfirmed, setFakePayConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<{ title: string; msg: string; onOk?: () => void } | null>(null);

  const steps = ["الفعالية", "العدد", "المربع", "الدفع"];
  const stepKeys = ["event", "count", "box", "payment", "done"];
  const stepIndex = stepKeys.indexOf(step);

  const showAlert = (title: string, msg: string, onOk?: () => void) => setAlert({ title, msg, onOk });

  const startCountdown = (secs: number, msg: string, onDone: () => void) => {
    setLoading(true); setLoadingMsg(`${msg}\n${secs}`); let c = secs;
    const iv = setInterval(() => { c--; if (c <= 0) { clearInterval(iv); setCountdown(0); setLoading(false); onDone(); } else { setCountdown(c); setLoadingMsg(`${msg}\n${c}`); } }, 1000);
  };

  const handleEventNext = async () => {
    if (!eventName.trim()) return setError("الرجاء إدخال اسم الفعالية");
    setError(""); setLoading(true); setLoadingMsg("جارِ المتابعة...");
    await delay(900); setLoading(false);
    showAlert("تم", "تم إدخال اسم الفعالية بنجاح", () => startCountdown(5, "", () => setStep("count")));
  };

  const handleCountNext = async () => {
    if (!ticketCount || isNaN(Number(ticketCount)) || Number(ticketCount) < 1) return setError("الرجاء إدخال عدد صحيح");
    setError(""); setLoading(true); setLoadingMsg("جارِ المتابعة...");
    await delay(800); setLoading(false);
    showAlert("تم", `تم تحديد ${ticketCount} تذاكر بنجاح`, () => setStep("box"));
  };

  const handleBoxNext = () => {
    if (!boxNumber.trim()) return setError("الرجاء إدخال رقم المربع");
    setError("");
    startCountdown(5, `جارِ التحقق من توفر تذاكر\nمربع ${boxNumber}`, () => {
      showAlert("تم التحقق", `تم التحقق من توفر التذاكر في مربع ${boxNumber}`, () => setStep("payment"));
    });
  };

  const handleRealPayment = async () => {
    setPaymentType("real"); setLoading(true); setLoadingMsg("جارِ تأكيد الحجز...");
    await delay(1500);
    await addTicket({ eventName, ticketCount: Number(ticketCount), box: boxNumber, paymentType: "real", status: "confirmed" });
    setLoading(false); setStep("done");
  };

  const handleFakePayment = async () => {
    if (!currentUser?.hasFakePaySubscription) {
      setLoading(true); setLoadingMsg("جارِ التحقق من الاشتراك...");
      await delay(3000); setLoading(false);
      showAlert("يجب الاشتراك أولاً", "قم بالاشتراك في خدمة الدفع الوهمي\nالسعر: 50 ريال أسبوعياً");
    } else {
      showAlert("تأكيد الدفع الوهمي", "تنبيه: الدفع الوهمي قد يعرض حسابك للإيقاف. هل تريد المتابعة؟", () => setFakePayConfirmed(true));
    }
  };

  const handleFakePayFinal = async () => {
    setLoading(true); setLoadingMsg("جارِ تأكيد الحجز...");
    await delay(1500);
    await addTicket({ eventName, ticketCount: Number(ticketCount), box: boxNumber, paymentType: "fake", status: "confirmed" });
    setLoading(false); setStep("done");
  };

  const reset = () => { setStep("event"); setEventName(""); setTicketCount(""); setBoxNumber(""); setPaymentType(null); setFakePayConfirmed(false); };

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "rgba(11,20,38,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin mb-4" />
          {loadingMsg.split("\n").map((l, i) => <p key={i} className="text-white font-bold text-center text-lg">{l}</p>)}
        </div>
      )}

      {alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
            <p className="font-black text-lg mb-2" style={{ color: "#0B1426" }}>{alert.title}</p>
            <p className="text-sm mb-5" style={{ color: "#6B7A99" }}>{alert.msg}</p>
            <button onClick={() => { const ok = alert.onOk; setAlert(null); ok?.(); }}
              className="w-full py-3 rounded-xl text-white font-bold grad-main">حسناً</button>
          </div>
        </div>
      )}

      <div className="grad-main px-5 pt-14 pb-7">
        <p className="text-white font-black text-2xl text-right mb-1">حجز التذاكر</p>
        <p style={{ color: "rgba(255,255,255,0.65)", textAlign: "right", marginBottom: step !== "done" ? 20 : 0, fontSize: 14 }}>أتمم خطوات الحجز بسهولة</p>
        {step !== "done" && (
          <div className="flex items-center">
            {steps.map((label, i) => {
              const done = i < stepIndex; const active = i === stepIndex;
              return (
                <div key={label} className="flex items-center" style={{ flex: i < 3 ? 1 : 0 }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: done ? "rgba(255,255,255,0.9)" : active ? "#fff" : "rgba(255,255,255,0.18)", border: done || active ? "none" : "1.5px solid rgba(255,255,255,0.35)" }}>
                      {done ? <Check size={14} color="#0B1426" /> : <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#0B1426" : "rgba(255,255,255,0.5)" }}>{i + 1}</span>}
                    </div>
                    <span className="text-white text-xs font-bold" style={{ opacity: active || done ? 1 : 0.45 }}>{label}</span>
                  </div>
                  {i < 3 && <div className="flex-1 h-0.5 mx-1 mb-5" style={{ background: done ? "#fff" : "rgba(255,255,255,0.25)" }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5" style={{ background: "#F0F4FF" }}>
        {step === "event" && (
          <StepCard title="اسم الفعالية / المباراة" hint="مثال: نهائي الدوري السعودي">
            <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="أدخل اسم الفعالية"
              className="w-full h-14 rounded-2xl px-4 text-right text-base outline-none border border-[#E2E8F0]" style={{ background: "#EEF2FF", fontFamily: "Tajawal" }} />
            {error && <p className="text-right text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}
            <PrimaryBtn label="متابعة" onClick={handleEventNext} />
          </StepCard>
        )}

        {step === "count" && (
          <StepCard title="عدد التذاكر المطلوبة" hint="أدخل العدد الذي تحتاجه">
            <input value={ticketCount} onChange={e => setTicketCount(e.target.value)} type="number" min="1" placeholder="عدد التذاكر"
              className="w-full h-14 rounded-2xl px-4 text-right text-base outline-none border border-[#E2E8F0]" style={{ background: "#EEF2FF", fontFamily: "Tajawal" }} />
            {error && <p className="text-right text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}
            <PrimaryBtn label="متابعة" onClick={handleCountNext} />
          </StepCard>
        )}

        {step === "box" && (
          <StepCard title="رقم المربع" hint="أدخل رقم المربع المطلوب">
            <input value={boxNumber} onChange={e => setBoxNumber(e.target.value)} placeholder="رقم المربع"
              className="w-full h-14 rounded-2xl px-4 text-right text-base outline-none border border-[#E2E8F0]" style={{ background: "#EEF2FF", fontFamily: "Tajawal" }} />
            {error && <p className="text-right text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}
            <PrimaryBtn label="تحقق من التوفر" onClick={handleBoxNext} />
          </StepCard>
        )}

        {step === "payment" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 card-shadow-sm">
              <p className="font-black text-right text-lg mb-4" style={{ color: "#0B1426" }}>ملخص الحجز</p>
              {[["الفعالية", eventName], ["عدد التذاكر", `${ticketCount} تذاكر`], ["رقم المربع", `مربع ${boxNumber}`]].map(([k, v], i, a) => (
                <div key={k} className="flex items-center justify-between py-3" style={{ borderBottom: i < a.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                  <span className="font-bold text-sm" style={{ color: "#0B1426" }}>{v}</span>
                  <span className="text-sm" style={{ color: "#6B7A99" }}>{k}</span>
                </div>
              ))}
            </div>

            <button onClick={handleRealPayment} className="w-full h-14 rounded-2xl text-white font-black flex items-center justify-center gap-3" style={{ background: "linear-gradient(90deg,#1B4FD8,#0B2A99)", boxShadow: "0 4px 16px rgba(27,79,216,0.35)" }}>
              <CheckCircle size={22} /><span>تأكيد بالدفع الحقيقي</span>
            </button>

            {!fakePayConfirmed ? (
              <button onClick={handleFakePayment} className="w-full h-14 rounded-2xl text-white font-black flex items-center justify-center gap-3" style={{ background: "linear-gradient(90deg,#F59E0B,#B45309)" }}>
                <Zap size={22} /><span>دفع وهمي</span>
              </button>
            ) : (
              <button onClick={handleFakePayFinal} className="w-full h-14 rounded-2xl text-white font-black flex items-center justify-center gap-3 grad-success">
                <CheckCircle size={22} /><span>تأكيد الحجز الوهمي</span>
              </button>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-5 card-shadow">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center grad-success" style={{ boxShadow: "0 6px 20px rgba(16,185,129,0.4)" }}>
              <CheckCircle size={56} color="#fff" />
            </div>
            <p className="font-black text-2xl" style={{ color: "#0B1426" }}>تم الحجز بنجاح!</p>
            <div className="w-full rounded-2xl p-5 text-center flex flex-col gap-2" style={{ background: "#EEF2FF" }}>
              <p className="font-black text-base" style={{ color: "#0B1426" }}>{eventName}</p>
              <p className="text-sm" style={{ color: "#6B7A99" }}>{ticketCount} تذكرة · مربع {boxNumber}</p>
              <div className="inline-block mx-auto px-4 py-1.5 rounded-xl text-sm font-bold"
                style={{ background: paymentType === "real" ? "#10B98120" : "#F59E0B20", color: paymentType === "real" ? "#10B981" : "#F59E0B" }}>
                {paymentType === "real" ? "دفع حقيقي" : "دفع وهمي"}
              </div>
            </div>
            <div className="w-full flex gap-3">
              <button onClick={() => navigate("my-tickets")} className="flex-1 py-3.5 rounded-2xl font-bold" style={{ background: "#EEF2FF", color: "#1B4FD8" }}>تذاكري</button>
              <button onClick={reset} className="flex-1 py-3.5 rounded-2xl text-white font-bold grad-main">حجز جديد</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 card-shadow">
      <div className="text-right">
        <p className="font-black text-xl" style={{ color: "#0B1426" }}>{title}</p>
        <p className="text-sm mt-1" style={{ color: "#6B7A99" }}>{hint}</p>
      </div>
      {children}
    </div>
  );
}

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 grad-main" style={{ boxShadow: "0 4px 16px rgba(27,79,216,0.35)" }}>
      <span>{label}</span><ArrowLeft size={18} />
    </button>
  );
}
