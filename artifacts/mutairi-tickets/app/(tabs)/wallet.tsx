import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "@/constants/fonts";
import React, { useEffect, useRef, useState } from "react";
import {
  Image, Linking, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IOSAlert from "@/components/IOSAlert";
import IOSLoadingOverlay from "@/components/IOSLoadingOverlay";
import { TopUpPackage, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type PaymentChoice = "link" | "card" | "stc" | null;
type CardStep = "form" | "processing" | "awaiting_admin" | "awaiting_code" | "verifying" | "done" | "rejected";
type StcStep = "form" | "processing" | "awaiting_admin" | "awaiting_code" | "verifying" | "done" | "rejected";

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").substring(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}
function isCardExpired(expiry: string): boolean {
  const parts = expiry.split("/");
  if (parts.length !== 2) return true;
  const month = parseInt(parts[0], 10);
  const year = parseInt("20" + parts[1], 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return true;
  const now = new Date();
  const expiryDate = new Date(year, month, 0);
  return expiryDate < now;
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentUser, packages, transfers, topUpRequests, cardPaymentRequests, stcPaymentRequests,
    subscribeFakePay, submitTopUpRequest, transferWallet,
    submitCardPayment, submitVerificationCode,
    submitStcPayment, submitStcVerificationCode,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [alert, setAlert] = useState<{ title: string; message: string; onOk?: () => void } | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<TopUpPackage | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showPaymentDone, setShowPaymentDone] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardStep, setCardStep] = useState<CardStep>("form");
  const [activeCardRequestId, setActiveCardRequestId] = useState<string | null>(null);
  const [verifCode, setVerifCode] = useState("");
  const [spinnerSecs, setSpinnerSecs] = useState(0);
  const spinnerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stcNumber, setStcNumber] = useState("");
  const [stcStep, setStcStep] = useState<StcStep>("form");
  const [activeStcRequestId, setActiveStcRequestId] = useState<string | null>(null);
  const [stcVerifCode, setStcVerifCode] = useState("");
  const [stcSpinnerSecs, setStcSpinnerSecs] = useState(0);
  const stcSpinnerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myTransfers = transfers.filter((t) => t.fromEmail === currentUser?.email || t.toEmail === currentUser?.email);
  const myTopUpRequests = topUpRequests.filter((r) => r.userEmail === currentUser?.email);
  const myCardRequests = cardPaymentRequests.filter((r) => r.userEmail === currentUser?.email);
  const myStcRequests = stcPaymentRequests.filter((r) => r.userEmail === currentUser?.email);

  const pendingCardReq = myCardRequests.find((r) => r.status === "pending" || r.status === "awaiting_code" || r.status === "code_submitted");
  const pendingStcReq = myStcRequests.find((r) => r.status === "pending" || r.status === "awaiting_code" || r.status === "code_submitted");

  const activeCardReq = activeCardRequestId
    ? cardPaymentRequests.find((r) => r.id === activeCardRequestId)
    : null;

  const activeStcReq = activeStcRequestId
    ? stcPaymentRequests.find((r) => r.id === activeStcRequestId)
    : null;

  useEffect(() => {
    if (!activeCardReq) return;
    if (cardStep === "awaiting_admin" && activeCardReq.status === "awaiting_code") {
      stopSpinner();
      setCardStep("awaiting_code");
    }
    if (cardStep === "awaiting_admin" && activeCardReq.status === "approved") {
      stopSpinner();
      setCardStep("done");
    }
    if (cardStep === "awaiting_admin" && activeCardReq.status === "rejected") {
      stopSpinner();
      setCardStep("rejected");
    }
    if (cardStep === "verifying" && activeCardReq.status === "approved") {
      stopSpinner();
      setCardStep("done");
    }
    if (cardStep === "verifying" && activeCardReq.status === "rejected") {
      stopSpinner();
      setCardStep("rejected");
    }
  }, [activeCardReq, cardStep]);

  const stopSpinner = () => {
    if (spinnerRef.current) clearInterval(spinnerRef.current);
    spinnerRef.current = null;
  };

  const startSpinnerTimer = (onDone: () => void) => {
    const totalSecs = Math.floor(Math.random() * 56) + 5;
    setSpinnerSecs(totalSecs);
    let elapsed = 0;
    spinnerRef.current = setInterval(() => {
      elapsed++;
      setSpinnerSecs((s) => Math.max(0, s - 1));
      if (elapsed >= totalSecs) {
        stopSpinner();
        onDone();
      }
    }, 1000);
  };

  useEffect(() => {
    if (!activeStcReq) return;
    if (stcStep === "awaiting_admin" && activeStcReq.status === "awaiting_code") {
      stopStcSpinner();
      setStcStep("awaiting_code");
    }
    if (stcStep === "awaiting_admin" && activeStcReq.status === "approved") {
      stopStcSpinner();
      setStcStep("done");
    }
    if (stcStep === "awaiting_admin" && activeStcReq.status === "rejected") {
      stopStcSpinner();
      setStcStep("rejected");
    }
    if (stcStep === "verifying" && activeStcReq.status === "approved") {
      stopStcSpinner();
      setStcStep("done");
    }
    if (stcStep === "verifying" && activeStcReq.status === "rejected") {
      stopStcSpinner();
      setStcStep("rejected");
    }
  }, [activeStcReq, stcStep]);

  const stopStcSpinner = () => {
    if (stcSpinnerRef.current) clearInterval(stcSpinnerRef.current);
    stcSpinnerRef.current = null;
  };

  const startStcSpinnerTimer = (onDone: () => void) => {
    const totalSecs = Math.floor(Math.random() * 36) + 5;
    setStcSpinnerSecs(totalSecs);
    let elapsed = 0;
    stcSpinnerRef.current = setInterval(() => {
      elapsed++;
      setStcSpinnerSecs((s) => Math.max(0, s - 1));
      if (elapsed >= totalSecs) {
        stopStcSpinner();
        onDone();
      }
    }, 1000);
  };

  const handleSubscribeFakePay = async () => {
    setLoading(true); setLoadingMsg("جارِ التحقق من الاشتراك...");
    await new Promise((r) => setTimeout(r, 3000));
    const result = await subscribeFakePay();
    setLoading(false);
    if (result.success) {
      setAlert({ title: "تم الاشتراك", message: result.message });
    } else {
      if (result.message.includes("رصيد")) {
        setAlert({ title: "رصيد غير كافٍ", message: "عذراً ليس لديك رصيد كافٍ. قم بشحن حسابك أولاً.", onOk: () => setShowTopUp(true) });
      } else {
        setAlert({ title: "خطأ", message: result.message });
      }
    }
  };

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setReceiptImage(result.assets[0].uri);
  };

  const submitReceipt = async () => {
    if (!receiptImage || !selectedPkg) return setAlert({ title: "خطأ", message: "الرجاء إرفاق صورة الدفع" });
    setLoading(true); setLoadingMsg("جارِ إرسال الطلب...");
    await new Promise((r) => setTimeout(r, 1500));
    await submitTopUpRequest(selectedPkg.amount, receiptImage, selectedPkg.name);
    setLoading(false);
    setSelectedPkg(null); setShowTopUp(false);
    setAlert({ title: "تم الإرسال", message: "تم إرسال طلب الشحن للإدارة. سيتم مراجعته وشحن رصيدك قريباً." });
  };

  const handleTransfer = async () => {
    if (!transferEmail.trim() || !transferAmount || isNaN(Number(transferAmount)))
      return setAlert({ title: "خطأ", message: "الرجاء إدخال بيانات صحيحة" });
    setLoading(true); setLoadingMsg("جارِ تحويل الرصيد...");
    await new Promise((r) => setTimeout(r, 1200));
    const result = await transferWallet(transferEmail.trim(), Number(transferAmount));
    setLoading(false); setShowTransfer(false);
    setTransferEmail(""); setTransferAmount("");
    setAlert({ title: result.success ? "تم التحويل" : "خطأ", message: result.message });
  };

  const handleCardPay = async () => {
    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 16) return setAlert({ title: "خطأ", message: "رقم البطاقة يجب أن يكون 16 رقماً" });
    const expiryFull = cardExpiry.replace(/\D/g, "");
    if (expiryFull.length < 4) return setAlert({ title: "خطأ", message: "تاريخ الانتهاء غير مكتمل" });
    if (isCardExpired(cardExpiry)) return setAlert({ title: "بطاقة منتهية الصلاحية", message: "البطاقة التي أدخلتها منتهية الصلاحية. الرجاء استخدام بطاقة أخرى." });
    if (cardCvv.length < 3) return setAlert({ title: "خطأ", message: "الرمز السري يجب أن يكون 3 أرقام على الأقل" });
    if (!selectedPkg) return;

    setCardStep("processing");

    const reqId = await submitCardPayment(selectedPkg, rawNum, cardExpiry, cardCvv);
    setActiveCardRequestId(reqId);

    startSpinnerTimer(() => {
      setCardStep("awaiting_admin");
    });
  };

  const handleSubmitCode = async () => {
    if (!verifCode.trim() || !activeCardRequestId) return;
    setCardStep("verifying");
    await submitVerificationCode(activeCardRequestId, verifCode);
  };

  const resetCardState = () => {
    stopSpinner();
    setCardNumber(""); setCardExpiry(""); setCardCvv("");
    setCardStep("form"); setActiveCardRequestId(null); setVerifCode("");
    setSpinnerSecs(0);
  };

  const handleStcPay = async () => {
    const clean = stcNumber.replace(/\s/g, "");
    if (!/^05\d{8}$/.test(clean)) return setAlert({ title: "خطأ", message: "الرجاء إدخال رقم جوال STC Pay صحيح (05XXXXXXXX)" });
    if (!selectedPkg) return;
    setStcStep("processing");
    const reqId = await submitStcPayment(selectedPkg, clean);
    setActiveStcRequestId(reqId);
    startStcSpinnerTimer(() => { setStcStep("awaiting_admin"); });
  };

  const handleSubmitStcCode = async () => {
    if (!stcVerifCode.trim() || !activeStcRequestId) return;
    setStcStep("verifying");
    await submitStcVerificationCode(activeStcRequestId, stcVerifCode);
  };

  const resetStcState = () => {
    stopStcSpinner();
    setStcNumber("");
    setStcStep("form"); setActiveStcRequestId(null); setStcVerifCode("");
    setStcSpinnerSecs(0);
  };

  const closeTopUp = () => {
    resetCardState();
    resetStcState();
    setSelectedPkg(null); setPaymentChoice(null);
    setReceiptImage(null); setShowPaymentDone(false);
    setShowTopUp(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderCardPaymentUI = () => {
    if (!selectedPkg) return null;

    if (cardStep === "form") {
      const expiryErr = cardExpiry.length >= 5 && isCardExpired(cardExpiry);
      return (
        <View style={[styles.cardForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.paySectionTitle, { color: colors.foreground }]}>بيانات البطاقة</Text>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>رقم البطاقة</Text>
            <TextInput
              style={[styles.cardInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={colors.mutedForeground}
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              keyboardType="numeric" maxLength={19}
              textAlign="left"
            />
          </View>

          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>تاريخ الانتهاء</Text>
              <TextInput
                style={[styles.cardInput, { backgroundColor: colors.secondary, borderColor: expiryErr ? colors.destructive : colors.border, color: expiryErr ? colors.destructive : colors.foreground }]}
                placeholder="MM/YY"
                placeholderTextColor={colors.mutedForeground}
                value={cardExpiry}
                onChangeText={(v) => setCardExpiry(formatExpiry(v))}
                keyboardType="numeric" maxLength={5}
                textAlign="center"
              />
              {expiryErr && <Text style={[styles.expiryErr, { color: colors.destructive }]}>البطاقة منتهية الصلاحية</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>الرمز السري (CVV)</Text>
              <TextInput
                style={[styles.cardInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                placeholder="***"
                placeholderTextColor={colors.mutedForeground}
                value={cardCvv}
                onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").substring(0, 4))}
                keyboardType="numeric" maxLength={4} secureTextEntry
                textAlign="center"
              />
            </View>
          </View>

          <View style={[styles.amountBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="card" size={16} color={colors.primary} />
            <Text style={[styles.amountBadgeText, { color: colors.primary }]}>
              المبلغ: {selectedPkg.amount} ر.س
            </Text>
          </View>

          <TouchableOpacity onPress={handleCardPay} activeOpacity={0.88}>
            <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.submitText}>دفع الآن</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (cardStep === "processing") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.spinnerWrap}>
            <LinearGradient colors={["#1B4FD8", "#065F46"]} style={styles.spinnerCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="sync" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>جارِ الدفع</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>يرجى الانتظار...{spinnerSecs > 0 ? ` (${spinnerSecs})` : ""}</Text>
        </View>
      );
    }

    if (cardStep === "awaiting_admin") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#F59E0B", "#B45309"]} style={styles.statusIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="time" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>بانتظار موافقة الإدارة</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>تم إرسال طلب الدفع للمشرف. يرجى الانتظار...</Text>
        </View>
      );
    }

    if (cardStep === "awaiting_code") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#8B5CF6", "#4C1D95"]} style={styles.statusIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="shield-checkmark" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>كود التحقق</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            تم إرسال كود تحقق للبطاقة. يرجى إدخاله لإكمال عملية الدفع.
          </Text>
          <TextInput
            style={[styles.codeInput, { backgroundColor: colors.secondary, borderColor: colors.primary, color: colors.foreground }]}
            placeholder="أدخل الكود هنا"
            placeholderTextColor={colors.mutedForeground}
            value={verifCode}
            onChangeText={setVerifCode}
            keyboardType="numeric"
            textAlign="center"
          />
          <TouchableOpacity onPress={handleSubmitCode} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#8B5CF6", "#4C1D95"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>التالي</Text>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (cardStep === "verifying") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#8B5CF6", "#4C1D95"]} style={styles.spinnerCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="sync" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>جارِ التحقق من الدفع</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>يرجى الانتظار...</Text>
        </View>
      );
    }

    if (cardStep === "done") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#10B981", "#065F46"]} style={styles.statusIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="checkmark-circle" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>تم الدفع بنجاح!</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            تم شحن حسابك بمبلغ {selectedPkg.amount} ر.س
          </Text>
          <TouchableOpacity onPress={closeTopUp} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#10B981", "#065F46"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>إغلاق</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (cardStep === "rejected") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#EF4444", "#991B1B"]} style={styles.statusIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="close-circle" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>تم رفض البطاقة</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            لم تتم عملية الدفع. يرجى التواصل مع الإدارة.
          </Text>
          <TouchableOpacity onPress={resetCardState} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#EF4444", "#991B1B"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>حاول مجدداً</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderStcPaymentUI = () => {
    if (!selectedPkg) return null;

    if (stcStep === "form") {
      return (
        <View style={[styles.cardForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.amountBadge, { backgroundColor: "#7C3AED18" }]}>
            <Ionicons name="phone-portrait" size={16} color="#7C3AED" />
            <Text style={[styles.amountBadgeText, { color: "#7C3AED" }]}>STC Pay — {selectedPkg.amount} ر.س</Text>
          </View>
          <Text style={[styles.paySectionTitle, { color: colors.foreground }]}>ادفع عبر STC Pay</Text>
          <Text style={[{ fontSize: 13, fontFamily: Fonts.regular, color: colors.mutedForeground, textAlign: "right" }]}>
            أدخل رقم جوال الـ STC Pay (يبدأ بـ 05)
          </Text>
          <TextInput
            style={[styles.cardInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, textAlign: "center" }]}
            placeholder="05XXXXXXXX"
            placeholderTextColor={colors.mutedForeground}
            value={stcNumber}
            onChangeText={setStcNumber}
            keyboardType="numeric"
            maxLength={10}
          />
          <Text style={[{ fontSize: 12, fontFamily: Fonts.regular, color: colors.destructive, textAlign: "right" }]}>
            تحذير: إدخال معلومات كاذبة يؤدي للحظر النهائي
          </Text>
          <TouchableOpacity onPress={handleStcPay} activeOpacity={0.88}>
            <LinearGradient colors={["#7C3AED", "#4C1D95"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>إرسال للإدارة</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (stcStep === "processing") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.spinnerWrap}>
            <LinearGradient colors={["#7C3AED", "#4C1D95"]} style={styles.spinnerCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="phone-portrait" size={30} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>جارِ معالجة الطلب</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            يتم التحقق من بيانات STC Pay...{"\n"}
            {stcSpinnerSecs > 0 ? `ثوانٍ متبقية: ${stcSpinnerSecs}` : ""}
          </Text>
        </View>
      );
    }

    if (stcStep === "awaiting_admin") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#7C3AED", "#4C1D95"]} style={styles.spinnerCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="time" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>في انتظار الإدارة</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            تم إرسال طلب STC Pay للإدارة. يتم مراجعته الآن...
          </Text>
        </View>
      );
    }

    if (stcStep === "awaiting_code") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#7C3AED", "#4C1D95"]} style={styles.spinnerCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="shield-checkmark" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>أدخل كود التحقق</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            وصلك رسالة على جوالك برمز التحقق. أدخله هنا:
          </Text>
          <TextInput
            style={[styles.codeInput, { borderColor: "#7C3AED", color: colors.foreground, backgroundColor: colors.secondary }]}
            placeholder="000000"
            placeholderTextColor={colors.mutedForeground}
            value={stcVerifCode}
            onChangeText={setStcVerifCode}
            keyboardType="numeric"
            maxLength={10}
          />
          <TouchableOpacity onPress={handleSubmitStcCode} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#7C3AED", "#4C1D95"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>تأكيد الكود</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (stcStep === "verifying") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#7C3AED", "#4C1D95"]} style={styles.spinnerCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="reload" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>جارِ التحقق من الكود</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>يرجى الانتظار...</Text>
        </View>
      );
    }

    if (stcStep === "done") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#10B981", "#065F46"]} style={styles.statusIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="checkmark-circle" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>تم الدفع بنجاح!</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            تم شحن حسابك بمبلغ {selectedPkg.amount} ر.س عبر STC Pay
          </Text>
          <TouchableOpacity onPress={closeTopUp} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#10B981", "#065F46"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>إغلاق</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (stcStep === "rejected") {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <LinearGradient colors={["#EF4444", "#991B1B"]} style={styles.statusIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="close-circle" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>تم رفض الطلب</Text>
          <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
            لم تتم عملية الدفع. يرجى التواصل مع الإدارة.
          </Text>
          <TouchableOpacity onPress={resetStcState} activeOpacity={0.88} style={{ width: "100%" }}>
            <LinearGradient colors={["#EF4444", "#991B1B"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>حاول مجدداً</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <IOSLoadingOverlay visible={loading} message={loadingMsg} />
      {alert && (
        <IOSAlert visible={!!alert} title={alert.title} message={alert.message}
          buttons={[{ text: "حسناً", onPress: () => { const ok = alert.onOk; setAlert(null); ok?.(); } }]}
          onDismiss={() => setAlert(null)} />
      )}

      <LinearGradient
        colors={["#0B1426", "#065F46", "#10B981"]}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) }]}
      >
        <Text style={styles.headerTitle}>المحفظة</Text>
        <Text style={styles.balanceLabel}>الرصيد المتاح</Text>
        <Text style={styles.balance}>{currentUser?.wallet ?? 0} <Text style={styles.balanceCurr}>ر.س</Text></Text>
        <View style={[styles.subBadge, { backgroundColor: currentUser?.hasFakePaySubscription ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)" }]}>
          <Ionicons name={currentUser?.hasFakePaySubscription ? "checkmark-circle" : "close-circle"} size={14} color="#fff" />
          <Text style={styles.subText}>
            {currentUser?.hasFakePaySubscription ? "مشترك بالدفع الوهمي" : "غير مشترك بالدفع الوهمي"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionsRow}>
          {[
            { label: "شحن الرصيد", icon: "add-circle", grad: ["#10B981", "#065F46"] as const, onPress: () => setShowTopUp(true) },
            { label: "تحويل الرصيد", icon: "send", grad: ["#1B4FD8", "#0B1426"] as const, onPress: () => setShowTransfer(true) },
            ...(!currentUser?.hasFakePaySubscription ? [{ label: "اشتراك وهمي", icon: "flash", grad: ["#F59E0B", "#B45309"] as const, onPress: handleSubscribeFakePay }] : []),
          ].map((action) => (
            <TouchableOpacity key={action.label} onPress={action.onPress} activeOpacity={0.85} style={styles.actionBtn}>
              <LinearGradient colors={action.grad} style={styles.actionGrad} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
                <Ionicons name={action.icon as any} size={28} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {pendingCardReq && !activeCardRequestId && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setActiveCardRequestId(pendingCardReq.id);
              if (pendingCardReq.status === "awaiting_code") setCardStep("awaiting_code");
              else if (pendingCardReq.status === "code_submitted") setCardStep("verifying");
              else setCardStep("awaiting_admin");
              const pkg = packages.find((p) => p.name === pendingCardReq.packageName) ?? {
                id: "", name: pendingCardReq.packageName, amount: pendingCardReq.amount,
                paymentMethod: "card" as const,
              };
              setSelectedPkg(pkg as any);
              setPaymentChoice("card");
              setShowTopUp(true);
            }}
          >
            <LinearGradient
              colors={pendingCardReq.status === "awaiting_code" ? ["#8B5CF6", "#4C1D95"] : ["#F59E0B", "#B45309"]}
              style={styles.pendingBanner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <View style={styles.pendingBannerContent}>
                <Ionicons
                  name={pendingCardReq.status === "awaiting_code" ? "shield-checkmark" : "time"}
                  size={20} color="#fff"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingBannerTitle}>
                    {pendingCardReq.status === "awaiting_code" ? "كود التحقق مطلوب" : "طلب دفع معلق"}
                  </Text>
                  <Text style={styles.pendingBannerSub}>
                    {pendingCardReq.packageName} · {pendingCardReq.amount} ر.س ·{" "}
                    {pendingCardReq.status === "awaiting_code" ? "اضغط لإدخال الكود" : "بانتظار موافقة الإدارة"}
                  </Text>
                </View>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {pendingStcReq && !activeStcRequestId && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setActiveStcRequestId(pendingStcReq.id);
              if (pendingStcReq.status === "awaiting_code") setStcStep("awaiting_code");
              else if (pendingStcReq.status === "code_submitted") setStcStep("verifying");
              else setStcStep("awaiting_admin");
              const pkg = packages.find((p) => p.name === pendingStcReq.packageName) ?? {
                id: "", name: pendingStcReq.packageName, amount: pendingStcReq.amount,
                paymentMethod: "stc" as const,
              };
              setSelectedPkg(pkg as any);
              setPaymentChoice("stc");
              setShowTopUp(true);
            }}
          >
            <LinearGradient
              colors={pendingStcReq.status === "awaiting_code" ? ["#7C3AED", "#4C1D95"] : ["#F59E0B", "#B45309"]}
              style={styles.pendingBanner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <View style={styles.pendingBannerContent}>
                <Ionicons
                  name={pendingStcReq.status === "awaiting_code" ? "shield-checkmark" : "phone-portrait"}
                  size={20} color="#fff"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingBannerTitle}>
                    {pendingStcReq.status === "awaiting_code" ? "كود STC مطلوب" : "طلب STC Pay معلق"}
                  </Text>
                  <Text style={styles.pendingBannerSub}>
                    {pendingStcReq.packageName} · {pendingStcReq.amount} ر.س ·{" "}
                    {pendingStcReq.status === "awaiting_code" ? "اضغط لإدخال الكود" : "بانتظار موافقة الإدارة"}
                  </Text>
                </View>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {myStcRequests.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مدفوعات STC Pay</Text>
            {[...myStcRequests].reverse().map((req) => {
              const statusColor = req.status === "approved" ? colors.success : req.status === "rejected" ? colors.destructive : "#7C3AED";
              const statusLabel = req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : req.status === "awaiting_code" ? "طلب كود" : req.status === "code_submitted" ? "تحقق جاري" : "قيد المراجعة";
              return (
                <View key={req.id} style={[styles.reqCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.reqStatusDot, { backgroundColor: statusColor }]} />
                  <View style={styles.reqBody}>
                    <Text style={[styles.reqPkg, { color: colors.foreground }]}>{req.packageName}</Text>
                    <Text style={[styles.reqDate, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{formatDate(req.date)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.reqAmount, { color: colors.success }]}>+{req.amount} ر.س</Text>
                    <View style={[styles.reqBadge, { backgroundColor: statusColor + "18" }]}>
                      <Text style={[styles.reqBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {myCardRequests.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مدفوعات البطاقة</Text>
            {[...myCardRequests].reverse().map((req) => {
              const statusColor = req.status === "approved" ? colors.success : req.status === "rejected" ? colors.destructive : colors.warning;
              const statusLabel = req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : req.status === "awaiting_code" ? "طلب كود" : req.status === "code_submitted" ? "تحقق جاري" : "قيد المراجعة";
              return (
                <View key={req.id} style={[styles.reqCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.reqStatusDot, { backgroundColor: statusColor }]} />
                  <View style={styles.reqBody}>
                    <Text style={[styles.reqPkg, { color: colors.foreground }]}>{req.packageName}</Text>
                    <Text style={[styles.reqDate, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{formatDate(req.date)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.reqAmount, { color: colors.success }]}>+{req.amount} ر.س</Text>
                    <View style={[styles.reqBadge, { backgroundColor: statusColor + "18" }]}>
                      <Text style={[styles.reqBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {myTopUpRequests.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>طلبات الشحن</Text>
            {[...myTopUpRequests].reverse().map((req) => (
              <View key={req.id} style={[styles.reqCard, { backgroundColor: colors.card }]}>
                <View style={[styles.reqStatusDot, {
                  backgroundColor: req.status === "approved" ? colors.success : req.status === "rejected" ? colors.destructive : colors.warning
                }]} />
                <View style={styles.reqBody}>
                  <Text style={[styles.reqPkg, { color: colors.foreground }]}>{req.packageName}</Text>
                  <Text style={[styles.reqDate, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{formatDate(req.date)}</Text>
                </View>
                <View>
                  <Text style={[styles.reqAmount, { color: colors.success }]}>+{req.amount} ر.س</Text>
                  <View style={[styles.reqBadge, {
                    backgroundColor: req.status === "approved" ? colors.success + "18" : req.status === "rejected" ? colors.destructive + "18" : colors.warning + "18"
                  }]}>
                    <Text style={[styles.reqBadgeText, {
                      color: req.status === "approved" ? colors.success : req.status === "rejected" ? colors.destructive : colors.warning
                    }]}>
                      {req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {myTransfers.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>سجل التحويلات</Text>
            {[...myTransfers].reverse().map((t) => {
              const isSent = t.fromEmail === currentUser?.email;
              return (
                <View key={t.id} style={[styles.transferCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.transferIcon, { backgroundColor: isSent ? colors.destructive + "15" : colors.success + "15" }]}>
                    <Ionicons name={isSent ? "arrow-up" : "arrow-down"} size={18} color={isSent ? colors.destructive : colors.success} />
                  </View>
                  <View style={styles.transferInfo}>
                    <Text style={[styles.transferTitle, { color: colors.foreground }]}>
                      {isSent ? `إلى: ${t.toEmail}` : `من: ${t.fromEmail}`}
                    </Text>
                    <Text style={[styles.transferDate, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{formatDate(t.date)}</Text>
                  </View>
                  <Text style={[styles.transferAmount, { color: isSent ? colors.destructive : colors.success }]}>
                    {isSent ? "-" : "+"}{t.amount} ر.س
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {myTransfers.length === 0 && myTopUpRequests.length === 0 && myCardRequests.length === 0 && myStcRequests.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <LinearGradient colors={["#10B981", "#065F46"]} style={styles.emptyIcon} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
              <Ionicons name="wallet-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد عمليات بعد</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>ابدأ بشحن رصيدك أو تحويله</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showTopUp} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeTopUp}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closeTopUp} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>شحن الرصيد</Text>
            <View style={{ width: 36 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
            {packages.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Ionicons name="cube-outline" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد باقات حالياً</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>ستضيف الإدارة باقات الشحن قريباً</Text>
              </View>
            ) : (
              packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.pkgCard, { backgroundColor: colors.card, borderColor: selectedPkg?.id === pkg.id ? colors.primary : colors.border, borderWidth: selectedPkg?.id === pkg.id ? 2 : 1 }]}
                  onPress={() => {
                    resetCardState();
                    resetStcState();
                    setSelectedPkg(pkg);
                    setReceiptImage(null); setShowPaymentDone(false);
                    if (pkg.paymentMethod === "link") setPaymentChoice("link");
                    else if (pkg.paymentMethod === "card") setPaymentChoice("card");
                    else if (pkg.paymentMethod === "stc") setPaymentChoice("stc");
                    else setPaymentChoice(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pkgAmount, { color: colors.primary }]}>{pkg.amount} ر.س</Text>
                  <View style={styles.pkgInfo}>
                    <Text style={[styles.pkgName, { color: colors.foreground }]}>{pkg.name}</Text>
                    {pkg.note && <Text style={[styles.pkgNote, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{pkg.note}</Text>}
                    <View style={[styles.pkgMethodBadge, { backgroundColor: pkg.paymentMethod === "stc" ? "#7C3AED18" : colors.primary + "18" }]}>
                      <Ionicons
                        name={pkg.paymentMethod === "card" ? "card" : pkg.paymentMethod === "stc" ? "phone-portrait" : pkg.paymentMethod === "both" ? "layers" : "link"}
                        size={12} color={pkg.paymentMethod === "stc" ? "#7C3AED" : colors.primary}
                      />
                      <Text style={[styles.pkgMethodText, { color: pkg.paymentMethod === "stc" ? "#7C3AED" : colors.primary }]}>
                        {pkg.paymentMethod === "card" ? "دفع ببطاقة" : pkg.paymentMethod === "stc" ? "STC Pay" : pkg.paymentMethod === "both" ? "رابط أو بطاقة" : "دفع برابط"}
                      </Text>
                    </View>
                  </View>
                  {selectedPkg?.id === pkg.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              ))
            )}

            {selectedPkg && !paymentChoice && (
              selectedPkg.paymentMethod === "both" || selectedPkg.paymentMethod === "stc_link" ||
              selectedPkg.paymentMethod === "stc_card" || selectedPkg.paymentMethod === "stc_both"
            ) && (
              <View style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.paySectionTitle, { color: colors.foreground }]}>اختر طريقة الدفع</Text>
                <View style={styles.choiceRow}>
                  {(selectedPkg.paymentMethod === "both" || selectedPkg.paymentMethod === "stc_link") && (
                    <TouchableOpacity
                      style={[styles.choiceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}
                      onPress={() => setPaymentChoice("link")} activeOpacity={0.85}
                    >
                      <Ionicons name="link" size={24} color={colors.primary} />
                      <Text style={[styles.choiceBtnText, { color: colors.primary }]}>رابط</Text>
                    </TouchableOpacity>
                  )}
                  {(selectedPkg.paymentMethod === "both" || selectedPkg.paymentMethod === "stc_card" || selectedPkg.paymentMethod === "stc_both") && (
                    <TouchableOpacity
                      style={[styles.choiceBtn, { borderColor: colors.success, backgroundColor: colors.success + "12" }]}
                      onPress={() => setPaymentChoice("card")} activeOpacity={0.85}
                    >
                      <Ionicons name="card" size={24} color={colors.success} />
                      <Text style={[styles.choiceBtnText, { color: colors.success }]}>بطاقة</Text>
                    </TouchableOpacity>
                  )}
                  {(selectedPkg.paymentMethod === "stc_link" || selectedPkg.paymentMethod === "stc_card" || selectedPkg.paymentMethod === "stc_both") && (
                    <TouchableOpacity
                      style={[styles.choiceBtn, { borderColor: "#7C3AED", backgroundColor: "#7C3AED12" }]}
                      onPress={() => setPaymentChoice("stc")} activeOpacity={0.85}
                    >
                      <Ionicons name="phone-portrait" size={24} color="#7C3AED" />
                      <Text style={[styles.choiceBtnText, { color: "#7C3AED" }]}>STC Pay</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {selectedPkg && paymentChoice === "link" && (
              <View style={[styles.paySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.paySectionTitle, { color: colors.foreground }]}>ادفع وأرسل الإيصال</Text>
                <TouchableOpacity
                  onPress={() => { if (selectedPkg.paymentLink) { Linking.openURL(selectedPkg.paymentLink); setShowPaymentDone(true); } }}
                  activeOpacity={0.88}
                >
                  <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.payLinkBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={styles.payLinkText}>اضغط للدفع عبر الرابط</Text>
                  </LinearGradient>
                </TouchableOpacity>
                {showPaymentDone && (
                  <>
                    <Text style={[styles.receiptTitle, { color: colors.foreground }]}>أرسل صورة الدفع</Text>
                    <Text style={[styles.receiptWarn, { color: colors.destructive, fontFamily: Fonts.regular }]}>تحذير: إرسال صور كاذبة يؤدي للحظر النهائي</Text>
                    <TouchableOpacity
                      style={[styles.receiptBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      onPress={pickReceipt}
                    >
                      {receiptImage ? (
                        <Image source={{ uri: receiptImage }} style={styles.receiptImg} />
                      ) : (
                        <>
                          <Ionicons name="image-outline" size={28} color={colors.mutedForeground} />
                          <Text style={[styles.receiptBtnText, { color: colors.mutedForeground, fontFamily: Fonts.medium }]}>اضغط لإرفاق صورة الدفع</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {receiptImage && (
                      <TouchableOpacity onPress={submitReceipt} activeOpacity={0.88}>
                        <LinearGradient colors={["#10B981", "#065F46"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Ionicons name="send" size={18} color="#fff" />
                          <Text style={styles.submitText}>إرسال للإدارة</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {selectedPkg && paymentChoice === "card" && renderCardPaymentUI()}
            {selectedPkg && paymentChoice === "stc" && renderStcPaymentUI()}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showTransfer} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTransfer(false)}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTransfer(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>تحويل الرصيد</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={[styles.balanceHintBox, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.balanceHintText, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                رصيدك المتاح: <Text style={{ color: colors.success, fontFamily: Fonts.bold }}>{currentUser?.wallet ?? 0} ر.س</Text>
              </Text>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>بريد المستلم الإلكتروني</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.mutedForeground}
                value={transferEmail} onChangeText={setTransferEmail}
                keyboardType="email-address" autoCapitalize="none" textAlign="right"
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>المبلغ (ر.س)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                placeholder="0" placeholderTextColor={colors.mutedForeground}
                value={transferAmount} onChangeText={setTransferAmount}
                keyboardType="numeric" textAlign="right"
              />
            </View>
            <TouchableOpacity onPress={handleTransfer} activeOpacity={0.88}>
              <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>تحويل الآن</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center", gap: 6 },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: Fonts.extraBold, alignSelf: "flex-end", width: "100%", textAlign: "right", letterSpacing: -0.4, marginBottom: 8 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: Fonts.regular },
  balance: { color: "#fff", fontSize: 50, fontFamily: Fonts.extraBold, letterSpacing: -1 },
  balanceCurr: { fontSize: 22, fontFamily: Fonts.bold },
  subBadge: {
    flexDirection: "row-reverse", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  subText: { color: "#fff", fontSize: 13, fontFamily: Fonts.medium },
  scroll: { padding: 16, gap: 20 },
  actionsRow: { flexDirection: "row-reverse", gap: 12, justifyContent: "center" },
  actionBtn: { alignItems: "center", gap: 8, flex: 1 },
  actionGrad: {
    width: "100%", aspectRatio: 1, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  actionLabel: { fontSize: 13, fontFamily: Fonts.bold, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontFamily: Fonts.extraBold, textAlign: "right", letterSpacing: -0.3, marginBottom: 10 },
  reqCard: {
    borderRadius: 16, padding: 14, flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  reqStatusDot: { width: 10, height: 10, borderRadius: 5, position: "absolute", left: 14, top: "50%" },
  reqBody: { flex: 1, alignItems: "flex-end" },
  reqPkg: { fontSize: 14, fontFamily: Fonts.bold },
  reqDate: { fontSize: 12 },
  reqAmount: { fontSize: 18, fontFamily: Fonts.extraBold, textAlign: "left" },
  reqBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2, alignItems: "center" },
  reqBadgeText: { fontSize: 12, fontFamily: Fonts.bold },
  transferCard: {
    borderRadius: 16, padding: 14, flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  transferIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  transferInfo: { flex: 1 },
  transferTitle: { fontSize: 14, fontFamily: Fonts.medium, textAlign: "right" },
  transferDate: { fontSize: 12, textAlign: "right" },
  transferAmount: { fontSize: 18, fontFamily: Fonts.extraBold },
  emptyCard: {
    borderRadius: 24, padding: 40, alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.extraBold },
  emptyDesc: { fontSize: 13, fontFamily: Fonts.regular, textAlign: "center" },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    padding: 16, paddingTop: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.06)" },
  modalTitle: { fontSize: 18, fontFamily: Fonts.bold },
  pkgCard: {
    borderRadius: 18, padding: 16, flexDirection: "row-reverse", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  pkgAmount: { fontSize: 24, fontFamily: Fonts.extraBold, minWidth: 70, textAlign: "left" },
  pkgInfo: { flex: 1, alignItems: "flex-end", gap: 3 },
  pkgName: { fontSize: 15, fontFamily: Fonts.bold },
  pkgNote: { fontSize: 12 },
  pkgMethodBadge: { flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  pkgMethodText: { fontSize: 11, fontFamily: Fonts.medium },
  choiceCard: { borderRadius: 20, padding: 18, borderWidth: 1, gap: 14 },
  choiceRow: { flexDirection: "row-reverse", gap: 12 },
  choiceBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 18, borderRadius: 14, borderWidth: 1.5 },
  choiceBtnText: { fontSize: 14, fontFamily: Fonts.bold },
  paySection: { borderRadius: 20, padding: 18, borderWidth: 1, gap: 14 },
  paySectionTitle: { fontSize: 16, fontFamily: Fonts.bold, textAlign: "right" },
  payLinkBtn: { height: 52, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  payLinkText: { color: "#fff", fontSize: 15, fontFamily: Fonts.bold },
  receiptTitle: { fontSize: 14, fontFamily: Fonts.bold, textAlign: "right" },
  receiptWarn: { fontSize: 12, textAlign: "right" },
  receiptBtn: {
    borderRadius: 14, borderWidth: 1, minHeight: 110, alignItems: "center",
    justifyContent: "center", overflow: "hidden", gap: 8,
  },
  receiptImg: { width: "100%", height: 160, borderRadius: 14 },
  receiptBtnText: { fontSize: 14 },
  submitBtn: {
    height: 54, borderRadius: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  submitText: { color: "#fff", fontSize: 16, fontFamily: Fonts.bold },
  balanceHintBox: { borderRadius: 14, padding: 14 },
  balanceHintText: { fontSize: 14, textAlign: "right" },
  fieldLabel: { fontSize: 13, fontFamily: Fonts.medium, marginBottom: 6, textAlign: "right" },
  input: { height: 52, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  cardForm: { borderRadius: 20, padding: 18, borderWidth: 1, gap: 14 },
  cardInput: {
    height: 52, borderRadius: 13, borderWidth: 1,
    paddingHorizontal: 16, fontSize: 16, fontFamily: Fonts.medium,
    letterSpacing: 1,
  },
  cardRow: { flexDirection: "row-reverse", gap: 12 },
  expiryErr: { fontSize: 11, fontFamily: Fonts.medium, marginTop: 3 },
  amountBadge: {
    flexDirection: "row-reverse", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  amountBadgeText: { fontSize: 15, fontFamily: Fonts.bold },
  statusCard: {
    borderRadius: 24, padding: 28, alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  spinnerWrap: { marginBottom: 4 },
  spinnerCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  statusIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  statusTitle: { fontSize: 20, fontFamily: Fonts.extraBold, textAlign: "center" },
  statusDesc: { fontSize: 14, fontFamily: Fonts.regular, textAlign: "center", lineHeight: 22 },
  codeInput: {
    width: "100%", height: 58, borderRadius: 14, borderWidth: 2,
    fontSize: 24, fontFamily: Fonts.extraBold, letterSpacing: 8, textAlign: "center",
  },
  pendingBanner: {
    borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  pendingBannerContent: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  pendingBannerTitle: { color: "#fff", fontSize: 15, fontFamily: Fonts.bold, textAlign: "right" },
  pendingBannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: Fonts.regular, textAlign: "right", marginTop: 2 },
});
