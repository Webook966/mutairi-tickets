import { useState, useEffect, useRef } from "react";
import { Wallet, ArrowLeftRight, CreditCard, Smartphone, Link, ChevronLeft, X, Check, AlertCircle, Upload } from "lucide-react";
import { useApp, type TopUpPackage } from "@/context/AppContext";

type PayMethod = "link" | "card" | "stc" | null;
type CardStep = "form" | "awaiting_admin" | "awaiting_code" | "done" | "rejected";
type StcStep = "form" | "awaiting_admin" | "awaiting_code" | "done" | "rejected";

function fmt(iso: string) { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }

export default function WalletPage() {
  const {
    currentUser, packages, transfers, topUpRequests, cardPaymentRequests, stcPaymentRequests,
    subscribeFakePay, submitTopUpRequest, transferWallet,
    submitCardPayment, submitVerificationCode,
    submitStcPayment, submitStcVerificationCode,
  } = useApp();

  const [showTopUp, setShowTopUp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showFakePay, setShowFakePay] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<TopUpPackage | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; msg: string; onOk?: () => void } | null>(null);
  const [receiptImg, setReceiptImg] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState(""); const [cardExpiry, setCardExpiry] = useState(""); const [cardCvv, setCardCvv] = useState("");
  const [cardStep, setCardStep] = useState<CardStep>("form");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardCode, setCardCode] = useState("");

  const [stcNumber, setStcNumber] = useState("");
  const [stcStep, setStcStep] = useState<StcStep>("form");
  const [activeStcId, setActiveStcId] = useState<string | null>(null);
  const [stcCode, setStcCode] = useState("");

  const [transferEmail, setTransferEmail] = useState(""); const [transferAmount, setTransferAmount] = useState("");
  const [spinnerSecs, setSpinnerSecs] = useState(0);
  const spinnerRef = useRef<any>(null);

  const myTransfers = transfers.filter(t => t.fromEmail === currentUser?.email || t.toEmail === currentUser?.email);
  const myTopUp = topUpRequests.filter(r => r.userEmail === currentUser?.email);
  const myCard = cardPaymentRequests.filter(r => r.userEmail === currentUser?.email);
  const myStc = stcPaymentRequests.filter(r => r.userEmail === currentUser?.email);
  const activeCardReq = activeCardId ? cardPaymentRequests.find(r => r.id === activeCardId) : null;
  const activeStcReq = activeStcId ? stcPaymentRequests.find(r => r.id === activeStcId) : null;

  useEffect(() => {
    if (!activeCardReq) return;
    if (cardStep === "awaiting_admin" && activeCardReq.status === "awaiting_code") { stopSpinner(); setCardStep("awaiting_code"); }
    if (cardStep === "awaiting_admin" && activeCardReq.status === "approved") { stopSpinner(); setCardStep("done"); }
    if (cardStep === "awaiting_admin" && activeCardReq.status === "rejected") { stopSpinner(); setCardStep("rejected"); }
    if (cardStep === "awaiting_code" && activeCardReq.status === "approved") setCardStep("done");
    if (cardStep === "awaiting_code" && activeCardReq.status === "rejected") setCardStep("rejected");
  }, [activeCardReq, cardStep]);

  useEffect(() => {
    if (!activeStcReq) return;
    if (stcStep === "awaiting_admin" && activeStcReq.status === "awaiting_code") { stopSpinner(); setStcStep("awaiting_code"); }
    if (stcStep === "awaiting_admin" && activeStcReq.status === "approved") { stopSpinner(); setStcStep("done"); }
    if (stcStep === "awaiting_admin" && activeStcReq.status === "rejected") { stopSpinner(); setStcStep("rejected"); }
    if (stcStep === "awaiting_code" && activeStcReq.status === "approved") setStcStep("done");
    if (stcStep === "awaiting_code" && activeStcReq.status === "rejected") setStcStep("rejected");
  }, [activeStcReq, stcStep]);

  const stopSpinner = () => { if (spinnerRef.current) clearInterval(spinnerRef.current); spinnerRef.current = null; setSpinnerSecs(0); };
  const startSpinner = () => {
    let s = 0;
    spinnerRef.current = setInterval(() => { s++; setSpinnerSecs(s); }, 1000);
  };

  const handleTopUpSelect = (pkg: TopUpPackage) => {
    setSelectedPkg(pkg); setPayMethod(null); setCardStep("form"); setStcStep("form");
    setActiveCardId(null); setActiveStcId(null); setCardNumber(""); setCardExpiry(""); setCardCvv("");
    setStcNumber(""); setCardCode(""); setStcCode(""); setReceiptImg(null);
  };

  const handleSubscribeFakePay = async () => {
    setLoading(true);
    const r = await subscribeFakePay(); setLoading(false);
    setAlert({ title: r.success ? "تم الاشتراك" : "خطأ", msg: r.message });
    if (r.success) setShowFakePay(false);
  };

  const handleTransfer = async () => {
    if (!transferEmail.trim() || !transferAmount) return setAlert({ title: "خطأ", msg: "الرجاء إدخال جميع البيانات" });
    const amt = Number(transferAmount);
    if (isNaN(amt) || amt <= 0) return setAlert({ title: "خطأ", msg: "الرجاء إدخال مبلغ صحيح" });
    setLoading(true);
    const r = await transferWallet(transferEmail.toLowerCase(), amt); setLoading(false);
    setAlert({ title: r.success ? "تم التحويل" : "خطأ", msg: r.message });
    if (r.success) { setShowTransfer(false); setTransferEmail(""); setTransferAmount(""); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setReceiptImg(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLinkTopUp = async () => {
    if (!selectedPkg || !receiptImg) return setAlert({ title: "خطأ", msg: "الرجاء رفع صورة الإيصال أولاً" });
    setLoading(true); await submitTopUpRequest(selectedPkg, receiptImg); setLoading(false);
    setAlert({ title: "تم الإرسال", msg: "تم إرسال طلبك وسيتم مراجعته من قبل الإدارة" });
    setShowTopUp(false); setSelectedPkg(null);
  };

  const handleCardSubmit = async () => {
    if (!selectedPkg || !cardNumber || !cardExpiry || !cardCvv) return setAlert({ title: "خطأ", msg: "الرجاء إدخال جميع بيانات البطاقة" });
    setLoading(true);
    const id = await submitCardPayment(selectedPkg, cardNumber.replace(/\s/g, ""), cardExpiry, cardCvv);
    setLoading(false); setActiveCardId(id); setCardStep("awaiting_admin"); startSpinner();
  };

  const handleCardCode = async () => {
    if (!activeCardId || !cardCode.trim()) return;
    setLoading(true); await submitVerificationCode(activeCardId, cardCode); setLoading(false);
    setCardStep("awaiting_code");
  };

  const handleStcSubmit = async () => {
    if (!selectedPkg || !stcNumber) return setAlert({ title: "خطأ", msg: "الرجاء إدخال رقم STC Pay" });
    setLoading(true);
    const id = await submitStcPayment(selectedPkg, stcNumber);
    setLoading(false); setActiveStcId(id); setStcStep("awaiting_admin"); startSpinner();
  };

  const handleStcCode = async () => {
    if (!activeStcId || !stcCode.trim()) return;
    setLoading(true); await submitStcVerificationCode(activeStcId, stcCode); setLoading(false);
    setStcStep("awaiting_code");
  };

  const pkgSupports = (pkg: TopUpPackage, m: "link" | "card" | "stc") => {
    const pm = pkg.paymentMethod;
    if (m === "link") return ["link", "both", "stc_link", "stc_both"].includes(pm);
    if (m === "card") return ["card", "both", "stc_card", "stc_both"].includes(pm);
    if (m === "stc") return ["stc", "stc_link", "stc_card", "stc_both"].includes(pm);
    return false;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: "#EEF2FF", color: "#6B7A99", label: "قيد الانتظار" },
      approved: { bg: "#10B98120", color: "#10B981", label: "تمت الموافقة" },
      rejected: { bg: "#EF444420", color: "#EF4444", label: "مرفوض" },
      awaiting_code: { bg: "#F59E0B20", color: "#F59E0B", label: "انتظار الكود" },
      code_submitted: { bg: "#EEF2FF", color: "#1B4FD8", label: "تم إرسال الكود" },
    };
    const st = map[s] ?? map.pending;
    return <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>;
  };

  const closeTopUp = () => { setShowTopUp(false); setSelectedPkg(null); setPayMethod(null); stopSpinner(); };

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
            <button onClick={() => { const ok = alert.onOk; setAlert(null); ok?.(); }} className="w-full py-3 rounded-xl text-white font-bold grad-main">حسناً</button>
          </div>
        </div>
      )}

      <div className="grad-success px-5 pt-14 pb-8">
        <p className="text-white font-black text-3xl text-right mb-1">المحفظة</p>
        <div className="rounded-2xl p-5 mt-4" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "right" }}>الرصيد المتاح</p>
          <p className="text-white font-black text-right" style={{ fontSize: 48, lineHeight: 1.1 }}>{currentUser?.wallet ?? 0} <span style={{ fontSize: 22 }}>ر.س</span></p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowTopUp(true)} className="flex-1 py-3 rounded-xl text-white font-bold text-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>شحن الرصيد</button>
            <button onClick={() => setShowTransfer(true)} className="flex-1 py-3 rounded-xl text-white font-bold text-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>تحويل</button>
            <button onClick={() => setShowFakePay(true)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: currentUser?.hasFakePaySubscription ? "rgba(201,162,39,0.4)" : "rgba(255,255,255,0.15)", color: currentUser?.hasFakePaySubscription ? "#C9A227" : "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
              {currentUser?.hasFakePaySubscription ? "اشتراك نشط" : "فيك باي"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 flex flex-col gap-5" style={{ background: "#F0F4FF" }}>
        {myTopUp.length > 0 && (
          <div>
            <p className="font-black text-right text-lg mb-3" style={{ color: "#0B1426" }}>طلبات الشحن</p>
            {[...myTopUp].reverse().slice(0, 5).map(r => (
              <div key={r.id} className="bg-white rounded-2xl px-4 py-3.5 mb-2 flex items-center justify-between card-shadow-sm">
                <div className="flex flex-col items-start gap-1">{statusBadge(r.status)}</div>
                <div className="text-right"><p className="font-bold text-sm" style={{ color: "#0B1426" }}>{r.packageName}</p><p className="text-xs" style={{ color: "#6B7A99" }}>{r.amount} ر.س</p></div>
              </div>
            ))}
          </div>
        )}

        {(myCard.length > 0 || myStc.length > 0) && (
          <div>
            <p className="font-black text-right text-lg mb-3" style={{ color: "#0B1426" }}>طلبات الدفع</p>
            {[...myCard, ...myStc].reverse().slice(0, 5).map(r => (
              <div key={r.id} className="bg-white rounded-2xl px-4 py-3.5 mb-2 flex items-center justify-between card-shadow-sm">
                <div className="flex flex-col items-start gap-1">{statusBadge(r.status)}</div>
                <div className="text-right"><p className="font-bold text-sm" style={{ color: "#0B1426" }}>{r.packageName}</p><p className="text-xs" style={{ color: "#6B7A99" }}>{r.amount} ر.س</p></div>
              </div>
            ))}
          </div>
        )}

        {myTransfers.length > 0 && (
          <div>
            <p className="font-black text-right text-lg mb-3" style={{ color: "#0B1426" }}>سجل التحويلات</p>
            {[...myTransfers].reverse().slice(0, 10).map(t => {
              const isSent = t.fromEmail === currentUser?.email;
              return (
                <div key={t.id} className="bg-white rounded-2xl px-4 py-3.5 mb-2 flex items-center gap-3 card-shadow-sm">
                  <div className="flex-1 text-right">
                    <p className="font-bold text-sm" style={{ color: "#0B1426" }}>{isSent ? `إلى: ${t.toEmail}` : `من: ${t.fromEmail}`}</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>{fmt(t.date)}</p>
                  </div>
                  <span className="font-black" style={{ color: isSent ? "#EF4444" : "#10B981" }}>{isSent ? "-" : "+"}{t.amount} ر.س</span>
                </div>
              );
            })}
          </div>
        )}

        {myTransfers.length === 0 && myTopUp.length === 0 && myCard.length === 0 && (
          <div className="flex flex-col items-center pt-16 gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center grad-success"><Wallet size={36} color="#fff" /></div>
            <p className="font-black text-lg" style={{ color: "#0B1426" }}>لا توجد معاملات</p>
            <p className="text-sm text-center" style={{ color: "#6B7A99" }}>اشحن رصيدك أو حول للآخرين</p>
          </div>
        )}
      </div>

      {showTopUp && (
        <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#F0F4FF" }}>
          <div className="flex items-center justify-between px-5 py-4 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <button onClick={closeTopUp} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}><X size={20} /></button>
            <p className="font-bold text-lg" style={{ color: "#0B1426" }}>شحن الرصيد</p>
            <div className="w-9" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {!selectedPkg ? (
              <>
                <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>اختر الباقة</p>
                {packages.map(pkg => (
                  <button key={pkg.id} onClick={() => handleTopUpSelect(pkg)}
                    className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between card-shadow-sm active:scale-[0.99] transition-transform">
                    <ChevronLeft size={18} color="#6B7A99" />
                    <div className="text-right">
                      <p className="font-black text-base" style={{ color: "#0B1426" }}>{pkg.name}</p>
                      <p className="text-2xl font-black mt-1" style={{ color: "#1B4FD8" }}>{pkg.amount} <span className="text-sm font-bold" style={{ color: "#6B7A99" }}>ر.س</span></p>
                      {pkg.note && <p className="text-sm mt-1" style={{ color: "#6B7A99" }}>{pkg.note}</p>}
                    </div>
                  </button>
                ))}
              </>
            ) : !payMethod ? (
              <>
                <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>طريقة الدفع</p>
                <div className="bg-white rounded-2xl p-4 card-shadow-sm text-right">
                  <p className="font-bold" style={{ color: "#0B1426" }}>{selectedPkg.name}</p>
                  <p className="text-xl font-black" style={{ color: "#1B4FD8" }}>{selectedPkg.amount} ر.س</p>
                </div>
                <div className="flex flex-col gap-3">
                  {pkgSupports(selectedPkg, "link") && (
                    <button onClick={() => setPayMethod("link")} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 card-shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center grad-main"><Link size={20} color="#fff" /></div>
                      <span className="flex-1 text-right font-bold" style={{ color: "#0B1426" }}>تحويل بنكي / إيصال</span>
                    </button>
                  )}
                  {pkgSupports(selectedPkg, "card") && (
                    <button onClick={() => setPayMethod("card")} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 card-shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1B4FD8,#0B2A99)" }}><CreditCard size={20} color="#fff" /></div>
                      <span className="flex-1 text-right font-bold" style={{ color: "#0B1426" }}>بطاقة بنكية</span>
                    </button>
                  )}
                  {pkgSupports(selectedPkg, "stc") && (
                    <button onClick={() => setPayMethod("stc")} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 card-shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}><Smartphone size={20} color="#fff" /></div>
                      <span className="flex-1 text-right font-bold" style={{ color: "#0B1426" }}>STC Pay</span>
                    </button>
                  )}
                </div>
              </>
            ) : payMethod === "link" ? (
              <div className="flex flex-col gap-4">
                <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>رفع إيصال الدفع</p>
                {selectedPkg.paymentLink && (
                  <a href={selectedPkg.paymentLink} target="_blank" rel="noreferrer" className="block text-center py-3.5 rounded-2xl text-white font-bold grad-main">
                    فتح رابط الدفع
                  </a>
                )}
                <label className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white border-2 border-dashed cursor-pointer" style={{ borderColor: "#E2E8F0" }}>
                  <Upload size={32} color="#6B7A99" />
                  <span className="text-sm font-bold" style={{ color: "#6B7A99" }}>رفع صورة الإيصال</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {receiptImg && <img src={receiptImg} alt="receipt" className="w-full rounded-2xl object-cover max-h-48" />}
                <button onClick={handleLinkTopUp} className="w-full py-4 rounded-2xl text-white font-bold grad-main">إرسال الطلب</button>
              </div>
            ) : payMethod === "card" ? (
              <div className="flex flex-col gap-4">
                {cardStep === "form" && (
                  <>
                    <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>بيانات البطاقة</p>
                    {[
                      { val: cardNumber, set: setCardNumber, ph: "رقم البطاقة", format: (v: string) => v.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim() },
                      { val: cardExpiry, set: setCardExpiry, ph: "MM/YY", format: (v: string) => { const d = v.replace(/\D/g, "").substring(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; } },
                      { val: cardCvv, set: setCardCvv, ph: "CVV", format: (v: string) => v.replace(/\D/g, "").substring(0, 4) },
                    ].map((f, i) => (
                      <input key={i} value={f.val} onChange={e => f.set(f.format(e.target.value))} placeholder={f.ph}
                        className="w-full h-12 rounded-xl px-4 text-right text-base outline-none" style={{ background: "white", border: "1px solid #E2E8F0", fontFamily: "Tajawal" }} />
                    ))}
                    <button onClick={handleCardSubmit} className="w-full py-4 rounded-2xl text-white font-bold grad-main">إرسال للمراجعة</button>
                  </>
                )}
                {cardStep === "awaiting_admin" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="font-black text-lg" style={{ color: "#0B1426" }}>جارِ مراجعة الطلب</p>
                    <p className="text-sm text-center" style={{ color: "#6B7A99" }}>انتظر موافقة الإدارة... ({spinnerSecs}ث)</p>
                  </div>
                )}
                {cardStep === "awaiting_code" && (
                  <div className="flex flex-col gap-4">
                    <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>أدخل كود التحقق</p>
                    <input value={cardCode} onChange={e => setCardCode(e.target.value)} placeholder="كود التحقق"
                      className="w-full h-12 rounded-xl px-4 text-center text-xl font-bold outline-none" style={{ background: "white", border: "1px solid #E2E8F0", letterSpacing: 4, fontFamily: "Tajawal" }} />
                    <button onClick={handleCardCode} className="w-full py-4 rounded-2xl text-white font-bold grad-main">إرسال الكود</button>
                  </div>
                )}
                {cardStep === "done" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center grad-success"><Check size={40} color="#fff" /></div>
                    <p className="font-black text-xl" style={{ color: "#0B1426" }}>تم شحن الرصيد!</p>
                    <button onClick={closeTopUp} className="px-8 py-3.5 rounded-2xl text-white font-bold grad-main">إغلاق</button>
                  </div>
                )}
                {cardStep === "rejected" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}><X size={40} color="#fff" /></div>
                    <p className="font-black text-xl" style={{ color: "#EF4444" }}>تم رفض الطلب</p>
                    <button onClick={() => setCardStep("form")} className="px-8 py-3.5 rounded-2xl text-white font-bold" style={{ background: "#EF4444" }}>المحاولة مجدداً</button>
                  </div>
                )}
              </div>
            ) : payMethod === "stc" ? (
              <div className="flex flex-col gap-4">
                {stcStep === "form" && (
                  <>
                    <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>رقم STC Pay</p>
                    <input value={stcNumber} onChange={e => setStcNumber(e.target.value.replace(/\D/g, "").substring(0, 10))} placeholder="05xxxxxxxx" type="tel"
                      className="w-full h-12 rounded-xl px-4 text-right text-base outline-none" style={{ background: "white", border: "1px solid #E2E8F0", fontFamily: "Tajawal" }} />
                    <button onClick={handleStcSubmit} className="w-full py-4 rounded-2xl text-white font-bold" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>إرسال للمراجعة</button>
                  </>
                )}
                {stcStep === "awaiting_admin" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <p className="font-black text-lg" style={{ color: "#0B1426" }}>جارِ مراجعة الطلب</p>
                    <p className="text-sm" style={{ color: "#6B7A99" }}>انتظر موافقة الإدارة... ({spinnerSecs}ث)</p>
                  </div>
                )}
                {stcStep === "awaiting_code" && (
                  <div className="flex flex-col gap-4">
                    <p className="font-black text-right text-lg" style={{ color: "#0B1426" }}>أدخل كود التحقق</p>
                    <input value={stcCode} onChange={e => setStcCode(e.target.value)} placeholder="كود التحقق"
                      className="w-full h-12 rounded-xl px-4 text-center text-xl font-bold outline-none" style={{ background: "white", border: "1px solid #E2E8F0", letterSpacing: 4 }} />
                    <button onClick={handleStcCode} className="w-full py-4 rounded-2xl text-white font-bold" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>إرسال الكود</button>
                  </div>
                )}
                {stcStep === "done" && <div className="flex flex-col items-center gap-4 py-8"><div className="w-20 h-20 rounded-2xl flex items-center justify-center grad-success"><Check size={40} color="#fff" /></div><p className="font-black text-xl" style={{ color: "#0B1426" }}>تم شحن الرصيد!</p><button onClick={closeTopUp} className="px-8 py-3.5 rounded-2xl text-white font-bold grad-main">إغلاق</button></div>}
                {stcStep === "rejected" && <div className="flex flex-col items-center gap-4 py-8"><div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EF4444,#B91C1C)" }}><X size={40} color="#fff" /></div><p className="font-black text-xl" style={{ color: "#EF4444" }}>تم رفض الطلب</p><button onClick={() => setStcStep("form")} className="px-8 py-3.5 rounded-2xl text-white font-bold" style={{ background: "#EF4444" }}>المحاولة مجدداً</button></div>}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#F0F4FF" }}>
          <div className="flex items-center justify-between px-5 py-4 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <button onClick={() => setShowTransfer(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}><X size={20} /></button>
            <p className="font-bold text-lg" style={{ color: "#0B1426" }}>تحويل رصيد</p>
            <div className="w-9" />
          </div>
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div>
              <p className="font-bold text-sm mb-2 text-right" style={{ color: "#0B1426" }}>البريد الإلكتروني للمستلم</p>
              <input value={transferEmail} onChange={e => setTransferEmail(e.target.value)} type="email" placeholder="example@gmail.com"
                className="w-full h-12 rounded-xl px-4 text-right text-base outline-none" style={{ background: "white", border: "1px solid #E2E8F0", fontFamily: "Tajawal" }} />
            </div>
            <div>
              <p className="font-bold text-sm mb-2 text-right" style={{ color: "#0B1426" }}>المبلغ (ر.س)</p>
              <input value={transferAmount} onChange={e => setTransferAmount(e.target.value)} type="number" min="1" placeholder="0"
                className="w-full h-12 rounded-xl px-4 text-right text-base outline-none" style={{ background: "white", border: "1px solid #E2E8F0", fontFamily: "Tajawal" }} />
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "white" }}>
              <span className="font-bold" style={{ color: "#1B4FD8" }}>{currentUser?.wallet ?? 0} ر.س</span>
              <span className="text-sm" style={{ color: "#6B7A99" }}>رصيدك الحالي</span>
            </div>
            <button onClick={handleTransfer} className="w-full py-4 rounded-2xl text-white font-bold grad-success">تحويل الآن</button>
          </div>
        </div>
      )}

      {showFakePay && (
        <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#F0F4FF" }}>
          <div className="flex items-center justify-between px-5 py-4 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <button onClick={() => setShowFakePay(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}><X size={20} /></button>
            <p className="font-bold text-lg" style={{ color: "#0B1426" }}>اشتراك الدفع الوهمي</p>
            <div className="w-9" />
          </div>
          <div className="flex-1 p-5 flex flex-col gap-5">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto grad-gold" style={{ boxShadow: "0 6px 20px rgba(201,162,39,0.4)" }}>
              <span style={{ fontSize: 48 }}>⚡</span>
            </div>
            {currentUser?.hasFakePaySubscription ? (
              <div className="bg-white rounded-2xl p-5 text-center card-shadow">
                <p className="font-black text-xl mb-2" style={{ color: "#10B981" }}>اشتراكك نشط</p>
                <p className="text-sm" style={{ color: "#6B7A99" }}>يمكنك استخدام خاصية الدفع الوهمي عند حجز التذاكر</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-5 card-shadow text-right">
                  <p className="font-black text-xl mb-2" style={{ color: "#0B1426" }}>الدفع الوهمي</p>
                  <p className="text-sm mb-4" style={{ color: "#6B7A99", lineHeight: 1.7 }}>احجز تذاكر وهمية للتجربة. تنبيه: الاستخدام المفرط قد يعرض حسابك للإيقاف.</p>
                  <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: "#E2E8F0" }}>
                    <span className="font-black text-2xl" style={{ color: "#1B4FD8" }}>50 ر.س</span>
                    <span className="text-sm" style={{ color: "#6B7A99" }}>أسبوعياً</span>
                  </div>
                </div>
                <button onClick={handleSubscribeFakePay} className="w-full py-4 rounded-2xl text-white font-bold grad-gold">اشترك الآن</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
