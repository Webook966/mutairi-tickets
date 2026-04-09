import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "@/constants/fonts";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IOSAlert from "@/components/IOSAlert";
import IOSLoadingOverlay from "@/components/IOSLoadingOverlay";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Step = "event" | "count" | "box" | "payment" | "done";

export default function BookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, addTicket } = useApp();

  const [step, setStep] = useState<Step>("event");
  const [eventName, setEventName] = useState("");
  const [ticketCount, setTicketCount] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const [paymentType, setPaymentType] = useState<"real" | "fake" | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [alert, setAlert] = useState<{ title: string; message: string; onOk?: () => void } | null>(null);
  const [fakePayConfirm, setFakePayConfirm] = useState(false);
  const [fakePayConfirmed, setFakePayConfirmed] = useState(false);

  const startCountdown = (seconds: number, msg: string, onDone: () => void) => {
    setLoading(true);
    setLoadingMsg(msg ? `${msg}\n${seconds}` : `${seconds}`);
    let count = seconds;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(0);
        setLoading(false);
        onDone();
      } else {
        setLoadingMsg(msg ? `${msg}\n${count}` : `${count}`);
      }
    }, 1000);
  };

  const handleEventNext = async () => {
    if (!eventName.trim()) return setAlert({ title: "خطأ", message: "الرجاء إدخال اسم الفعالية" });
    setLoading(true);
    setLoadingMsg("جارِ المتابعة...");
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setAlert({ title: "تم", message: "تم إدخال اسم الفعالية بنجاح", onOk: () => startCountdown(5, "", () => setStep("count")) });
  };

  const handleCountNext = async () => {
    if (!ticketCount || isNaN(Number(ticketCount)) || Number(ticketCount) < 1)
      return setAlert({ title: "خطأ", message: "الرجاء إدخال عدد صحيح من التذاكر" });
    setLoading(true);
    setLoadingMsg("جارِ المتابعة...");
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setAlert({ title: "تم", message: `تم تحديد ${ticketCount} تذكرة بنجاح`, onOk: () => setStep("box") });
  };

  const handleBoxNext = () => {
    if (!boxNumber.trim()) return setAlert({ title: "خطأ", message: "الرجاء إدخال رقم المربع" });
    startCountdown(5, `جارِ التحقق من توفر تذاكر\nمربع ${boxNumber}`, () => {
      setAlert({ title: "تم التحقق", message: `تم التحقق من توفر التذاكر في مربع ${boxNumber}`, onOk: () => setStep("payment") });
    });
  };

  const handleRealPayment = async () => {
    setPaymentType("real");
    setLoading(true);
    setLoadingMsg("جارِ تأكيد الحجز...");
    await new Promise((r) => setTimeout(r, 1500));
    await addTicket({ eventName, ticketCount: Number(ticketCount), box: boxNumber, paymentType: "real", status: "confirmed" });
    setLoading(false);
    setStep("done");
  };

  const handleFakePayment = () => {
    if (!currentUser?.hasFakePaySubscription) {
      setLoading(true);
      setLoadingMsg("جارِ التحقق من الاشتراك...");
      setTimeout(() => {
        setLoading(false);
        setAlert({ title: "يجب الاشتراك أولاً", message: "قم بالاشتراك في خدمة الدفع الوهمي لتتمكن من استخدامها.\nالسعر: 50 ريال أسبوعياً" });
      }, 3000);
    } else {
      setFakePayConfirm(true);
    }
  };

  const confirmFakePay = () => { setFakePayConfirm(false); setFakePayConfirmed(true); };

  const handleFakePayFinal = async () => {
    setLoading(true);
    setLoadingMsg("جارِ تأكيد الحجز...");
    await new Promise((r) => setTimeout(r, 1500));
    await addTicket({ eventName, ticketCount: Number(ticketCount), box: boxNumber, paymentType: "fake", status: "confirmed" });
    setLoading(false);
    setStep("done");
  };

  const resetForm = () => {
    setStep("event"); setEventName(""); setTicketCount(""); setBoxNumber("");
    setPaymentType(null); setFakePayConfirmed(false); setFakePayConfirm(false);
  };

  const stepLabels = ["الفعالية", "العدد", "المربع", "الدفع"];
  const steps = ["event", "count", "box", "payment", "done"];
  const stepIndex = steps.indexOf(step);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <IOSLoadingOverlay visible={loading} message={loadingMsg || undefined} />
      {alert && (
        <IOSAlert visible={!!alert} title={alert.title} message={alert.message}
          buttons={[{ text: "حسناً", onPress: () => { const ok = alert.onOk; setAlert(null); ok?.(); } }]}
          onDismiss={() => setAlert(null)} />
      )}
      <IOSAlert visible={fakePayConfirm} title="تأكيد الدفع الوهمي"
        message="تنبيه: الدفع الوهمي قد يعرض حسابك للإيقاف. أنت تتحمل كامل المسؤولية. هل تريد المتابعة؟"
        buttons={[
          { text: "إلغاء", style: "cancel", onPress: () => setFakePayConfirm(false) },
          { text: "موافق", style: "destructive", onPress: confirmFakePay },
        ]}
        onDismiss={() => setFakePayConfirm(false)} />

      <LinearGradient
        colors={["#0B1426", "#1B3A8C", "#1B4FD8"]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) }]}
      >
        <Text style={styles.headerTitle}>حجز التذاكر</Text>
        <Text style={styles.headerSub}>أتمم خطوات الحجز بسهولة</Text>

        {step !== "done" && (
          <View style={styles.stepsRow}>
            {stepLabels.map((label, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <React.Fragment key={label}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepBubble, done ? styles.stepDone : active ? styles.stepActive : styles.stepPending]}>
                      {done
                        ? <Ionicons name="checkmark" size={13} color="#fff" />
                        : <Text style={[styles.stepNum, { color: active ? "#0B1426" : "rgba(255,255,255,0.5)" }]}>{i + 1}</Text>
                      }
                    </View>
                    <Text style={[styles.stepLabel, { opacity: active || done ? 1 : 0.45 }]}>{label}</Text>
                  </View>
                  {i < 3 && <View style={[styles.stepLine, { backgroundColor: done ? "#fff" : "rgba(255,255,255,0.25)" }]} />}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 110) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "event" && (
          <StepCard title="اسم الفعالية / المباراة" hint="مثال: نهائي الدوري السعودي" colors={colors}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="أدخل اسم الفعالية"
              placeholderTextColor={colors.mutedForeground}
              value={eventName} onChangeText={setEventName} textAlign="right"
            />
            <PrimaryBtn label="متابعة" onPress={handleEventNext} />
          </StepCard>
        )}

        {step === "count" && (
          <StepCard title="عدد التذاكر المطلوبة" hint="أدخل العدد الذي تحتاجه" colors={colors}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="عدد التذاكر" placeholderTextColor={colors.mutedForeground}
              value={ticketCount} onChangeText={setTicketCount} keyboardType="numeric" textAlign="right"
            />
            <PrimaryBtn label="متابعة" onPress={handleCountNext} />
          </StepCard>
        )}

        {step === "box" && (
          <StepCard title="رقم المربع" hint="أدخل رقم المربع المطلوب" colors={colors}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="رقم المربع" placeholderTextColor={colors.mutedForeground}
              value={boxNumber} onChangeText={setBoxNumber} keyboardType="default" textAlign="right"
            />
            <PrimaryBtn label="تحقق من التوفر" onPress={handleBoxNext} />
          </StepCard>
        )}

        {step === "payment" && (
          <View style={{ gap: 14 }}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>ملخص الحجز</Text>
              {[
                { label: "الفعالية", value: eventName },
                { label: "عدد التذاكر", value: `${ticketCount} تذاكر` },
                { label: "رقم المربع", value: `مربع ${boxNumber}` },
              ].map((row, i) => (
                <View key={row.label} style={[styles.summaryRow, { borderBottomColor: colors.border, borderBottomWidth: i < 2 ? StyleSheet.hairlineWidth : 0 }]}>
                  <Text style={[styles.summaryVal, { color: colors.foreground }]}>{row.value}</Text>
                  <Text style={[styles.summaryLbl, { color: colors.mutedForeground }]}>{row.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handleRealPayment} activeOpacity={0.88}>
              <LinearGradient colors={["#1B4FD8", "#0B2A99"]} style={styles.payBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.payBtnText}>تأكيد بالدفع الحقيقي</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!fakePayConfirmed ? (
              <TouchableOpacity onPress={handleFakePayment} activeOpacity={0.88}>
                <LinearGradient colors={["#F59E0B", "#B45309"]} style={styles.payBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="flash" size={22} color="#fff" />
                  <Text style={styles.payBtnText}>دفع وهمي</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleFakePayFinal} activeOpacity={0.88}>
                <LinearGradient colors={["#10B981", "#065F46"]} style={styles.payBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
                  <Text style={styles.payBtnText}>تأكيد الحجز الوهمي</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === "done" && (
          <View style={[styles.doneCard, { backgroundColor: colors.card }]}>
            <LinearGradient colors={["#10B981", "#065F46"]} style={styles.doneIconWrap} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
              <Ionicons name="checkmark-circle" size={56} color="#fff" />
            </LinearGradient>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>تم الحجز بنجاح!</Text>
            <View style={[styles.doneDetailsBox, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.doneEvent, { color: colors.foreground }]}>{eventName}</Text>
              <Text style={[styles.doneMeta, { color: colors.mutedForeground }]}>{ticketCount} تذكرة · مربع {boxNumber}</Text>
              <View style={[styles.doneBadge, { backgroundColor: paymentType === "real" ? colors.success + "20" : colors.warning + "20" }]}>
                <Text style={[styles.doneBadgeText, { color: paymentType === "real" ? colors.success : colors.warning }]}>
                  {paymentType === "real" ? "دفع حقيقي" : "دفع وهمي"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={resetForm} activeOpacity={0.88} style={{ width: "100%" }}>
              <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.doneBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.doneBtnText}>حجز جديد</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StepCard({ title, hint, children, colors }: { title: string; hint: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
      <View style={{ gap: 3, marginBottom: 4 }}>
        <Text style={[styles.stepCardTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.stepCardHint, { color: colors.mutedForeground }]}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

function PrimaryBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.nextBtnText}>{label}</Text>
        <Ionicons name="arrow-back" size={18} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { color: "#fff", fontSize: 26, fontFamily: Fonts.extraBold, textAlign: "right", letterSpacing: -0.5, marginBottom: 3 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 14, fontFamily: Fonts.regular, textAlign: "right", marginBottom: 20 },
  stepsRow: { flexDirection: "row-reverse", alignItems: "center" },
  stepItem: { alignItems: "center", gap: 5 },
  stepBubble: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  stepDone: { backgroundColor: "rgba(255,255,255,0.9)" },
  stepActive: { backgroundColor: "#fff" },
  stepPending: { backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  stepNum: { fontSize: 13, fontFamily: Fonts.bold },
  stepLabel: { color: "#fff", fontSize: 11, fontFamily: Fonts.medium },
  stepLine: { flex: 1, height: 2, marginBottom: 18, marginHorizontal: 3 },
  scroll: { padding: 16, gap: 14 },
  stepCard: {
    borderRadius: 22,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  stepCardTitle: { fontSize: 20, fontFamily: Fonts.extraBold, textAlign: "right", letterSpacing: -0.3 },
  stepCardHint: { fontSize: 14, fontFamily: Fonts.regular, textAlign: "right" },
  input: {
    height: 54, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, fontSize: 16,
  },
  nextBtn: {
    height: 54, borderRadius: 15,
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#1B4FD8", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: Fonts.bold },
  summaryCard: {
    borderRadius: 20, padding: 20, gap: 0,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  summaryTitle: { fontSize: 18, fontFamily: Fonts.extraBold, textAlign: "right", marginBottom: 12, letterSpacing: -0.2 },
  summaryRow: { flexDirection: "row-reverse", justifyContent: "space-between", paddingVertical: 12 },
  summaryLbl: { fontSize: 14 },
  summaryVal: { fontSize: 14, fontWeight: "700" },
  payBtn: {
    height: 58, borderRadius: 16,
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  payBtnText: { color: "#fff", fontSize: 17, fontFamily: Fonts.bold },
  doneCard: {
    borderRadius: 26, padding: 32, alignItems: "center", gap: 18,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  doneIconWrap: {
    width: 110, height: 110, borderRadius: 34,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#10B981", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  doneTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  doneDetailsBox: { width: "100%", borderRadius: 18, padding: 18, alignItems: "center", gap: 6 },
  doneEvent: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  doneMeta: { fontSize: 14, textAlign: "center" },
  doneBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10, marginTop: 4 },
  doneBadgeText: { fontSize: 13, fontWeight: "700" },
  doneBtn: {
    height: 54, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#1B4FD8", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
