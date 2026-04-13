import { useState } from "react";
import { Ticket, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Login() {
  const { login, register } = useApp();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        const r = await login(email, password);
        if (!r.success) setError(r.message || "خطأ في تسجيل الدخول");
      } else {
        if (!name.trim()) return setError("الرجاء إدخال الاسم");
        if (password.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        const r = await register(email, password, name);
        if (!r.success) setError(r.message || "خطأ في إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#0B1426 0%,#1B3A8C 45%,#1B4FD8 100%)" }}>
      <div className="flex flex-col items-center pt-16 pb-10 px-5">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
          <Ticket size={40} color="#fff" />
        </div>
        <h1 className="text-white text-2xl font-black mb-1">تذكرتك بتجيك ذحين</h1>
        <p className="text-white/60 text-sm">مرحباً بك في المطيري للحجز</p>
      </div>

      <div className="flex-1 rounded-t-3xl bg-white px-5 pt-8 pb-10" style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
        <div className="flex rounded-2xl overflow-hidden mb-6" style={{ background: "#EEF2FF" }}>
          {(["login", "register"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className="flex-1 py-3 text-sm font-bold transition-all"
              style={{ background: tab === t ? "#1B4FD8" : "transparent", color: tab === t ? "#fff" : "#6B7A99", borderRadius: tab === t ? "1rem" : 0 }}>
              {t === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === "register" && (
            <div>
              <label className="block text-sm font-bold mb-2 text-right" style={{ color: "#0B1426" }}>الاسم الكامل</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك الكامل"
                className="w-full h-14 rounded-2xl px-4 text-right text-base outline-none transition-all"
                style={{ background: "#EEF2FF", border: "1.5px solid #E2E8F0", fontFamily: "Tajawal" }} />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2 text-right" style={{ color: "#0B1426" }}>البريد الإلكتروني</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="example@gmail.com"
              className="w-full h-14 rounded-2xl px-4 text-right text-base outline-none transition-all"
              style={{ background: "#EEF2FF", border: "1.5px solid #E2E8F0", fontFamily: "Tajawal" }} />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-right" style={{ color: "#0B1426" }}>كلمة المرور</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="••••••••"
                className="w-full h-14 rounded-2xl px-4 pr-12 text-right text-base outline-none transition-all"
                style={{ background: "#EEF2FF", border: "1.5px solid #E2E8F0", fontFamily: "Tajawal" }} />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A99" }}>
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-right font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-base mt-2 transition-opacity"
            style={{ background: "linear-gradient(90deg,#1B4FD8,#0B1426)", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 20px rgba(27,79,216,0.4)" }}>
            {loading ? (
              <span>جارِ المتابعة...</span>
            ) : tab === "login" ? (
              <><LogIn size={20} /><span>تسجيل الدخول</span></>
            ) : (
              <><UserPlus size={20} /><span>إنشاء الحساب</span></>
            )}
          </button>

          <button type="button" onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
            className="text-center text-sm mt-1" style={{ color: "#1B4FD8", fontWeight: 700 }}>
            {tab === "login" ? "ليس لديك حساب؟ أنشئ حساباً جديداً" : "لديك حساب؟ تسجيل الدخول"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#6B7A99" }}>
          الإيميلات المدعومة: gmail · hotmail · live · yahoo
        </p>
      </div>
    </div>
  );
}
