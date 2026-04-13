import { useState } from "react";
import { User, Eye, EyeOff, LogOut, Trash2, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Props { navigate: (page: string) => void; }

export default function Account({ navigate }: Props) {
  const { currentUser, updateProfile, changePassword, logout, deleteAccount } = useApp();
  const [editName, setEditName] = useState(currentUser?.name ?? "");
  const [oldPass, setOldPass] = useState(""); const [newPass, setNewPass] = useState(""); const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false); const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; msg: string; onOk?: () => void; cancel?: boolean } | null>(null);

  const fmt = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };

  const handleSaveName = async () => {
    if (!editName.trim()) return setAlert({ title: "خطأ", msg: "الاسم لا يمكن أن يكون فارغاً" });
    setLoading(true); await new Promise(r => setTimeout(r, 800));
    await updateProfile({ name: editName.trim() }); setLoading(false);
    setAlert({ title: "تم", msg: "تم حفظ الاسم بنجاح" });
  };

  const handleChangePass = async () => {
    if (!oldPass || !newPass || !confirmPass) return setAlert({ title: "خطأ", msg: "الرجاء ملء جميع الحقول" });
    if (newPass !== confirmPass) return setAlert({ title: "خطأ", msg: "كلمة المرور الجديدة غير متطابقة" });
    if (newPass.length < 6) return setAlert({ title: "خطأ", msg: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    setLoading(true); await new Promise(r => setTimeout(r, 1000));
    const r = await changePassword(oldPass, newPass); setLoading(false);
    if (r.success) { setOldPass(""); setNewPass(""); setConfirmPass(""); }
    setAlert({ title: r.success ? "تم" : "خطأ", msg: r.message });
  };

  const handleLogout = () => setAlert({ title: "تسجيل الخروج", msg: "هل تريد تسجيل الخروج؟", cancel: true, onOk: () => { logout(); } });
  const handleDelete = () => setAlert({ title: "حذف الحساب", msg: "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.", cancel: true, onOk: () => { if (currentUser) deleteAccount(currentUser.email); } });

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
            <div className="flex gap-3">
              {alert.cancel && <button onClick={() => setAlert(null)} className="flex-1 py-3 rounded-xl font-bold" style={{ background: "#EEF2FF", color: "#6B7A99" }}>إلغاء</button>}
              <button onClick={() => { const ok = alert.onOk; setAlert(null); ok?.(); }} className="flex-1 py-3 rounded-xl text-white font-bold grad-main">تأكيد</button>
            </div>
          </div>
        </div>
      )}

      <div className="grad-main px-5 pt-14 pb-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.35)" }}>
          <User size={36} color="#fff" />
        </div>
        <p className="text-white font-black text-xl">{currentUser?.name}</p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>{currentUser?.email}</p>
        {currentUser?.isAdmin && (
          <div className="mt-3 px-4 py-1.5 rounded-full" style={{ background: "rgba(201,162,39,0.25)", border: "1px solid rgba(201,162,39,0.5)" }}>
            <span style={{ color: "#C9A227", fontWeight: 700, fontSize: 13 }}>مدير</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 flex flex-col gap-4" style={{ background: "#F0F4FF" }}>
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 card-shadow-sm">
          <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>معلومات الحساب</p>
          {[["البريد الإلكتروني", currentUser?.email ?? ""], ["آخر تسجيل دخول", fmt(currentUser?.lastLogin ?? new Date().toISOString())], ["رصيد المحفظة", `${currentUser?.wallet ?? 0} ر.س`], ["اشتراك الدفع الوهمي", currentUser?.hasFakePaySubscription ? "نشط" : "غير مشترك"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <span className="font-bold text-sm" style={{ color: "#0B1426" }}>{v}</span>
              <span className="text-sm" style={{ color: "#6B7A99" }}>{k}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 card-shadow-sm">
          <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>تعديل الاسم</p>
          <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم الكامل"
            className="w-full h-12 rounded-xl px-4 text-right text-base outline-none" style={{ background: "#EEF2FF", border: "1px solid #E2E8F0", fontFamily: "Tajawal" }} />
          <button onClick={handleSaveName} className="w-full py-3.5 rounded-xl text-white font-bold grad-main">حفظ التغييرات</button>
        </div>

        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 card-shadow-sm">
          <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>تغيير كلمة المرور</p>
          {[
            { val: oldPass, set: setOldPass, ph: "كلمة المرور الحالية", show: showOld, toggle: setShowOld },
            { val: newPass, set: setNewPass, ph: "كلمة المرور الجديدة", show: showNew, toggle: setShowNew },
            { val: confirmPass, set: setConfirmPass, ph: "تأكيد كلمة المرور الجديدة", show: showNew, toggle: () => {} },
          ].map((f, i) => (
            <div key={i} className="relative">
              <input value={f.val} onChange={e => f.set(e.target.value)} type={f.show ? "text" : "password"} placeholder={f.ph}
                className="w-full h-12 rounded-xl px-4 pr-12 text-right text-base outline-none" style={{ background: "#EEF2FF", border: "1px solid #E2E8F0", fontFamily: "Tajawal" }} />
              {i < 2 && (
                <button type="button" onClick={() => f.toggle((s: boolean) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6B7A99" }}>
                  <Eye size={18} />
                </button>
              )}
            </div>
          ))}
          <button onClick={handleChangePass} className="w-full py-3.5 rounded-xl text-white font-bold grad-main">تغيير كلمة المرور</button>
        </div>

        {currentUser?.isAdmin && (
          <button onClick={() => navigate("admin")} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 grad-gold card-shadow-sm">
            <Shield size={20} /><span>لوحة الإدارة</span>
          </button>
        )}

        <button onClick={handleLogout} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2" style={{ background: "#EEF2FF", color: "#1B4FD8" }}>
          <LogOut size={20} /><span>تسجيل الخروج</span>
        </button>
        <button onClick={handleDelete} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4" style={{ background: "#FEE2E2", color: "#EF4444" }}>
          <Trash2 size={20} /><span>حذف الحساب</span>
        </button>
      </div>
    </div>
  );
}
