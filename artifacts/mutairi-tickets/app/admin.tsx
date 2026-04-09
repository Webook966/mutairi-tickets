import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Fonts } from "@/constants/fonts";
import React, { useState } from "react";
import {
  FlatList, Image, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IOSAlert from "@/components/IOSAlert";
import IOSLoadingOverlay from "@/components/IOSLoadingOverlay";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Tab = "users" | "requests" | "cardpay" | "stcpay" | "packages" | "tickets";
type PkgMethod = "link" | "card" | "both" | "stc" | "stc_link" | "stc_card" | "stc_both";

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentUser, users, tickets, packages,
    topUpRequests, cardPaymentRequests, stcPaymentRequests,
    approveTopUp, rejectTopUp,
    banUser, unbanUser, deductWallet, chargeWallet,
    addPackage, editPackage, deletePackage,
    requestCardCode, approveCardPayment, rejectCardPayment,
    requestStcCode, approveStcPayment, rejectStcPayment,
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; onOk?: () => void; cancelable?: boolean; onCancel?: () => void } | null>(null);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [deductAmount, setDeductAmount] = useState("");
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgAmount, setPkgAmount] = useState("");
  const [pkgNote, setPkgNote] = useState("");
  const [pkgLink, setPkgLink] = useState("");
  const [pkgMethod, setPkgMethod] = useState<PkgMethod>("link");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [selectedCardReq, setSelectedCardReq] = useState<string | null>(null);
  const [selectedStcReq, setSelectedStcReq] = useState<string | null>(null);
  const [editingPkg, setEditingPkg] = useState<typeof packages[0] | null>(null);
  const [editPkgName, setEditPkgName] = useState("");
  const [editPkgAmount, setEditPkgAmount] = useState("");
  const [editPkgNote, setEditPkgNote] = useState("");
  const [editPkgLink, setEditPkgLink] = useState("");
  const [editPkgMethod, setEditPkgMethod] = useState<PkgMethod>("link");

  if (!currentUser?.isAdmin) {
    router.replace("/(tabs)/");
    return null;
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const maskCard = (num: string) => {
    const clean = num.replace(/\s/g, "");
    return clean.slice(0, 4) + " **** **** " + clean.slice(-4);
  };

  const handleBan = (email: string, type: "temporary" | "permanent") => {
    setAlert({
      title: `حظر ${type === "permanent" ? "دائم" : "مؤقت"}`,
      message: `هل تريد حظر المستخدم ${email}؟`,
      cancelable: true,
      onOk: () => { banUser(email, type); setSelectedUser(null); },
      onCancel: () => setAlert(null),
    });
  };

  const handleUnban = (email: string) => {
    setAlert({
      title: "رفع الحظر",
      message: `هل تريد رفع الحظر عن ${email}؟`,
      cancelable: true,
      onOk: () => { unbanUser(email); setSelectedUser(null); },
      onCancel: () => setAlert(null),
    });
  };

  const handleDeduct = (email: string) => {
    if (!deductAmount || isNaN(Number(deductAmount))) return setAlert({ title: "خطأ", message: "أدخل مبلغاً صحيحاً" });
    deductWallet(email, Number(deductAmount));
    setDeductAmount(""); setSelectedUser(null);
    setAlert({ title: "✅ تم", message: `تم خصم ${deductAmount} ريال` });
  };

  const handleCharge = (email: string) => {
    if (!deductAmount || isNaN(Number(deductAmount))) return setAlert({ title: "خطأ", message: "أدخل مبلغاً صحيحاً" });
    chargeWallet(email, Number(deductAmount));
    setDeductAmount(""); setSelectedUser(null);
    setAlert({ title: "✅ تم", message: `تم شحن ${deductAmount} ريال` });
  };

  const handleAddPkg = () => {
    if (!pkgName || !pkgAmount) return setAlert({ title: "خطأ", message: "الرجاء ملء الحقول المطلوبة" });
    if ((pkgMethod === "link" || pkgMethod === "stc_link") && !pkgLink)
      return setAlert({ title: "خطأ", message: "رابط الدفع مطلوب" });
    addPackage({
      name: pkgName, amount: Number(pkgAmount),
      note: pkgNote, paymentLink: pkgLink || undefined,
      paymentMethod: pkgMethod,
    });
    setPkgName(""); setPkgAmount(""); setPkgNote(""); setPkgLink(""); setPkgMethod("link");
    setShowAddPkg(false);
    setAlert({ title: "✅ تم", message: "تم إضافة الباقة بنجاح" });
  };

  const handleBanFromCard = (email: string, reqId: string) => {
    setAlert({
      title: "حظر المستخدم",
      message: `هل تريد حظر ${email} نهائياً؟`,
      cancelable: true,
      onOk: () => {
        banUser(email, "permanent");
        rejectCardPayment(reqId);
        setSelectedCardReq(null);
      },
      onCancel: () => setAlert(null),
    });
  };

  const handleBanFromStc = (email: string, reqId: string) => {
    setAlert({
      title: "حظر المستخدم",
      message: `هل تريد حظر ${email} نهائياً؟`,
      cancelable: true,
      onOk: () => {
        banUser(email, "permanent");
        rejectStcPayment(reqId);
        setSelectedStcReq(null);
      },
      onCancel: () => setAlert(null),
    });
  };

  const handleEditPkg = () => {
    if (!editingPkg) return;
    if (!editPkgName || !editPkgAmount) return setAlert({ title: "خطأ", message: "الرجاء ملء الحقول المطلوبة" });
    editPackage(editingPkg.id, {
      name: editPkgName,
      amount: Number(editPkgAmount),
      note: editPkgNote || undefined,
      paymentLink: editPkgLink || undefined,
      paymentMethod: editPkgMethod,
    });
    setEditingPkg(null);
    setAlert({ title: "✅ تم", message: "تم تعديل الباقة بنجاح" });
  };

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "users", label: "المستخدمون", icon: "users" },
    { key: "requests", label: "طلبات الشحن", icon: "inbox", badge: topUpRequests.filter((r) => r.status === "pending").length },
    { key: "cardpay", label: "بطاقة", icon: "credit-card", badge: cardPaymentRequests.filter((r) => r.status === "pending" || r.status === "code_submitted").length },
    { key: "stcpay", label: "STC Pay", icon: "smartphone", badge: stcPaymentRequests.filter((r) => r.status === "pending" || r.status === "code_submitted").length },
    { key: "packages", label: "الباقات", icon: "package" },
    { key: "tickets", label: "التذاكر", icon: "list" },
  ];

  const currentCardReq = selectedCardReq ? cardPaymentRequests.find((r) => r.id === selectedCardReq) : null;
  const currentStcReq = selectedStcReq ? stcPaymentRequests.find((r) => r.id === selectedStcReq) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <IOSLoadingOverlay visible={loading} />
      {alert && (
        <IOSAlert
          visible={!!alert}
          title={alert.title}
          message={alert.message}
          buttons={
            alert.cancelable
              ? [
                  { text: "إلغاء", style: "cancel", onPress: alert.onCancel },
                  { text: "تأكيد", style: "destructive", onPress: alert.onOk },
                ]
              : [{ text: "حسناً", onPress: () => { const ok = alert.onOk; setAlert(null); ok?.(); } }]
          }
          onDismiss={() => setAlert(null)}
        />
      )}

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Feather name="shield" size={20} color={colors.gold} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>لوحة الإدارة</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { borderBottomColor: activeTab === tab.key ? colors.primary : "transparent", borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Feather name={tab.icon as any} size={15} color={activeTab === tab.key ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
              {(tab.badge ?? 0) > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab === "stcpay" ? (
        <FlatList
          data={[...stcPaymentRequests].reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="smartphone" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>لا توجد مدفوعات STC</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = item.status === "approved" ? colors.success : item.status === "rejected" ? colors.destructive : item.status === "awaiting_code" || item.status === "code_submitted" ? "#7C3AED" : colors.warning;
            const statusLabel = item.status === "approved" ? "مكتمل" : item.status === "rejected" ? "مرفوض" : item.status === "awaiting_code" ? "انتظار كود" : item.status === "code_submitted" ? "كود مُرسل" : "قيد المراجعة";
            const actionable = item.status === "pending" || item.status === "code_submitted";
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: actionable ? "#7C3AED40" : colors.border, borderWidth: actionable ? 1.5 : 1 }]}
                onPress={() => actionable ? setSelectedStcReq(item.id) : null}
                activeOpacity={actionable ? 0.8 : 1}
              >
                <View style={styles.cardRight}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.userName}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{item.userEmail}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                    {item.packageName} · {item.amount} ر.س · {formatDate(item.date)}
                  </Text>
                  <Text style={[styles.cardSub, { color: "#7C3AED", fontFamily: Fonts.regular }]}>
                    STC: {item.stcNumber}
                  </Text>
                </View>
                <View style={{ gap: 6, alignItems: "flex-end" }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                  {actionable && <Feather name="chevron-left" size={16} color="#7C3AED" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : activeTab === "cardpay" ? (
        <FlatList
          data={[...cardPaymentRequests].reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="credit-card" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>لا توجد مدفوعات</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = item.status === "approved" ? colors.success : item.status === "rejected" ? colors.destructive : item.status === "awaiting_code" || item.status === "code_submitted" ? "#8B5CF6" : colors.warning;
            const statusLabel = item.status === "approved" ? "مكتمل" : item.status === "rejected" ? "مرفوض" : item.status === "awaiting_code" ? "انتظار كود" : item.status === "code_submitted" ? "كود مُرسل" : "قيد المراجعة";
            const actionable = item.status === "pending" || item.status === "code_submitted";
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: actionable ? colors.primary + "40" : colors.border, borderWidth: actionable ? 1.5 : 1 }]}
                onPress={() => actionable ? setSelectedCardReq(item.id) : null}
                activeOpacity={actionable ? 0.8 : 1}
              >
                <View style={styles.cardRight}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.userName}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{item.userEmail}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                    {item.packageName} · {item.amount} ر.س · {formatDate(item.date)}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                    بطاقة: {maskCard(item.cardNumber)}
                  </Text>
                </View>
                <View style={{ gap: 6, alignItems: "flex-end" }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                  {actionable && <Feather name="chevron-left" size={16} color={colors.primary} />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={
            activeTab === "users" ? users.filter((u) => !u.isAdmin)
            : activeTab === "requests" ? [...topUpRequests].reverse()
            : activeTab === "packages" ? packages
            : tickets
          }
          keyExtractor={(item: any) => item.id || item.email}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
          ListHeaderComponent={
            activeTab === "packages" ? (
              <TouchableOpacity style={[styles.addPkgBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddPkg(true)}>
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.addPkgBtnText}>إضافة باقة</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>لا توجد بيانات</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            if (activeTab === "users") {
              return (
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedUser(item)}
                >
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{item.email}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                      رصيد: {item.wallet} ر · {item.hasFakePaySubscription ? "مشترك ✅" : "غير مشترك"}
                    </Text>
                  </View>
                  <View style={{ gap: 4, alignItems: "flex-end" }}>
                    {item.isBanned && (
                      <View style={[styles.bannedBadge, { backgroundColor: colors.destructive + "20" }]}>
                        <Text style={[styles.bannedText, { color: colors.destructive }]}>محظور</Text>
                      </View>
                    )}
                    <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              );
            }
            if (activeTab === "requests") {
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.userName}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{item.userEmail}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                      {item.packageName} · {item.amount} ر.س · {formatDate(item.date)}
                    </Text>
                    {item.receiptImage && (
                      <TouchableOpacity onPress={() => setReceiptPreview(item.receiptImage)}>
                        <Text style={[styles.viewReceipt, { color: colors.primary }]}>عرض الإيصال</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.status === "pending" ? (
                    <View style={styles.approvalBtns}>
                      <TouchableOpacity style={[styles.approveBtn, { backgroundColor: colors.success }]} onPress={() => approveTopUp(item.id)}>
                        <Feather name="check" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.approveBtn, { backgroundColor: colors.destructive }]} onPress={() => rejectTopUp(item.id)}>
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: item.status === "approved" ? colors.success + "20" : colors.destructive + "20" }]}>
                      <Text style={[styles.statusText, { color: item.status === "approved" ? colors.success : colors.destructive }]}>
                        {item.status === "approved" ? "مقبول" : "مرفوض"}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
            if (activeTab === "packages") {
              const methodLabel = item.paymentMethod === "card" ? "بطاقة" : item.paymentMethod === "stc" ? "STC Pay" : item.paymentMethod === "both" ? "رابط + بطاقة" : item.paymentMethod === "stc_link" ? "STC + رابط" : item.paymentMethod === "stc_card" ? "STC + بطاقة" : item.paymentMethod === "stc_both" ? "الكل" : "رابط";
              const methodColor = item.paymentMethod === "card" ? "#8B5CF6" : item.paymentMethod === "stc" ? "#7C3AED" : item.paymentMethod === "both" ? colors.warning : colors.primary;
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
                    {item.note && <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{item.note}</Text>}
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>المبلغ: {item.amount} ر.س</Text>
                    <View style={[styles.methodBadge, { backgroundColor: methodColor + "18" }]}>
                      <Text style={[styles.methodBadgeText, { color: methodColor }]}>{methodLabel}</Text>
                    </View>
                  </View>
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.deleteBtn, { backgroundColor: colors.primary + "15" }]}
                      onPress={() => {
                        setEditingPkg(item);
                        setEditPkgName(item.name);
                        setEditPkgAmount(String(item.amount));
                        setEditPkgNote(item.note ?? "");
                        setEditPkgLink(item.paymentLink ?? "");
                        setEditPkgMethod(item.paymentMethod as PkgMethod);
                      }}
                    >
                      <Feather name="edit-2" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.destructive + "15" }]} onPress={() => deletePackage(item.id)}>
                      <Feather name="trash-2" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            if (activeTab === "tickets") {
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.eventName}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>{item.userName} · {item.userEmail}</Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: Fonts.regular }]}>
                      {item.ticketCount} تذاكر · مربع {item.box} · {formatDate(item.date)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.paymentType === "real" ? colors.success + "20" : colors.warning + "20" }]}>
                    <Text style={[styles.statusText, { color: item.paymentType === "real" ? colors.success : colors.warning }]}>
                      {item.paymentType === "real" ? "حقيقي" : "وهمي"}
                    </Text>
                  </View>
                </View>
              );
            }
            return null;
          }}
        />
      )}

      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedUser(null)}>
        {selectedUser && (
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Text style={[styles.modalClose, { color: colors.primary, fontFamily: Fonts.medium }]}>إغلاق</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>إدارة المستخدم</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={[styles.userInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "right" }]}>{selectedUser.name}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground, textAlign: "right", fontFamily: Fonts.regular }]}>{selectedUser.email}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground, textAlign: "right", fontFamily: Fonts.regular }]}>
                  رصيد: {selectedUser.wallet} ريال · اشتراك: {selectedUser.hasFakePaySubscription ? "نعم" : "لا"}
                </Text>
              </View>
              <View style={[styles.actionSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.actionSectionTitle, { color: colors.foreground }]}>خصم / شحن رصيد</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                  placeholder="المبلغ بالريال"
                  placeholderTextColor={colors.mutedForeground}
                  value={deductAmount} onChangeText={setDeductAmount}
                  keyboardType="numeric" textAlign="right"
                />
                <View style={styles.twoCol}>
                  <TouchableOpacity style={[styles.halfBtn, { backgroundColor: colors.success }]} onPress={() => handleCharge(selectedUser.email)}>
                    <Text style={styles.halfBtnText}>شحن رصيد</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.halfBtn, { backgroundColor: colors.destructive }]} onPress={() => handleDeduct(selectedUser.email)}>
                    <Text style={styles.halfBtnText}>خصم رصيد</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ gap: 10 }}>
                {selectedUser.isBanned ? (
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.success }]} onPress={() => handleUnban(selectedUser.email)}>
                    <Text style={styles.actionButtonText}>رفع الحظر</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.warning }]} onPress={() => handleBan(selectedUser.email, "temporary")}>
                      <Text style={styles.actionButtonText}>حظر مؤقت</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.destructive }]} onPress={() => handleBan(selectedUser.email, "permanent")}>
                      <Text style={styles.actionButtonText}>حظر دائم</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal visible={!!selectedCardReq && !!currentCardReq} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedCardReq(null)}>
        {currentCardReq && (
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setSelectedCardReq(null)}>
                <Text style={[styles.modalClose, { color: colors.primary, fontFamily: Fonts.medium }]}>إغلاق</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب دفع البطاقة</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={[styles.cardDetailBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardDetailTitle, { color: colors.foreground }]}>معلومات المستخدم</Text>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>الاسم</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground }]}>{currentCardReq.userName}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>البريد</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground }]}>{currentCardReq.userEmail}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>الباقة</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.primary }]}>{currentCardReq.packageName} · {currentCardReq.amount} ر.س</Text>
                </View>
              </View>

              <View style={[styles.cardDetailBox, { backgroundColor: "#8B5CF610", borderColor: "#8B5CF640" }]}>
                <Text style={[styles.cardDetailTitle, { color: "#8B5CF6" }]}>بيانات البطاقة</Text>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>رقم البطاقة</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground, letterSpacing: 1 }]}>{currentCardReq.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>تاريخ الانتهاء</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground }]}>{currentCardReq.cardExpiry}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>الرمز السري</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground }]}>{currentCardReq.cardCvv}</Text>
                </View>
                {currentCardReq.verificationCode && (
                  <View style={styles.cardDetailRow}>
                    <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>كود التحقق</Text>
                    <Text style={[styles.cardDetailVal, { color: "#8B5CF6" }]}>{currentCardReq.verificationCode}</Text>
                  </View>
                )}
              </View>

              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.success }]}
                  onPress={() => { approveCardPayment(currentCardReq.id); setSelectedCardReq(null); setAlert({ title: "✅ تم الشحن", message: `تم شحن حساب ${currentCardReq.userName} بمبلغ ${currentCardReq.amount} ريال` }); }}
                >
                  <Text style={styles.actionButtonText}>✅ شحن المبلغ ({currentCardReq.amount} ر.س)</Text>
                </TouchableOpacity>

                {currentCardReq.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#8B5CF6" }]}
                    onPress={() => { requestCardCode(currentCardReq.id); setSelectedCardReq(null); setAlert({ title: "تم", message: "تم إرسال طلب كود التحقق للمستخدم" }); }}
                  >
                    <Text style={styles.actionButtonText}>🔐 طلب كود تحقق</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                  onPress={() => { rejectCardPayment(currentCardReq.id); setSelectedCardReq(null); setAlert({ title: "تم", message: "تم رفض البطاقة" }); }}
                >
                  <Text style={styles.actionButtonText}>❌ رفض البطاقة</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#1a1a1a" }]}
                  onPress={() => handleBanFromCard(currentCardReq.userEmail, currentCardReq.id)}
                >
                  <Text style={styles.actionButtonText}>🚫 حظر المستخدم</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal visible={showAddPkg} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddPkg(false)}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowAddPkg(false)}>
              <Text style={[styles.modalClose, { color: colors.primary, fontFamily: Fonts.medium }]}>إلغاء</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة باقة شحن</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>اسم الباقة *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                placeholder="مثال: باقة 100 ريال"
                placeholderTextColor={colors.mutedForeground}
                value={pkgName} onChangeText={setPkgName}
                textAlign="right"
              />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>المبلغ بالريال *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                placeholder="100"
                placeholderTextColor={colors.mutedForeground}
                value={pkgAmount} onChangeText={setPkgAmount}
                keyboardType="numeric" textAlign="right"
              />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>ملاحظة (اختياري)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                placeholder="أي ملاحظات..."
                placeholderTextColor={colors.mutedForeground}
                value={pkgNote} onChangeText={setPkgNote}
                textAlign="right"
              />
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>طريقة الدفع *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: "row-reverse" }}>
                {(([
                  ["link", "رابط"], ["card", "بطاقة"], ["stc", "STC Pay"],
                  ["both", "رابط + بطاقة"], ["stc_link", "STC + رابط"],
                  ["stc_card", "STC + بطاقة"], ["stc_both", "الكل"],
                ] as [PkgMethod, string][])).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[{ height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, {
                      backgroundColor: pkgMethod === val ? colors.primary : colors.secondary,
                      borderColor: pkgMethod === val ? colors.primary : colors.border,
                    }]}
                    onPress={() => setPkgMethod(val)}
                  >
                    <Text style={[{ fontSize: 13, fontFamily: Fonts.bold }, { color: pkgMethod === val ? "#fff" : colors.foreground }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {(pkgMethod === "link" || pkgMethod === "both" || pkgMethod === "stc_link" || pkgMethod === "stc_both") && (
              <View>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>رابط الدفع {pkgMethod === "both" ? "(اختياري)" : "*"}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                  placeholder="https://..."
                  placeholderTextColor={colors.mutedForeground}
                  value={pkgLink} onChangeText={setPkgLink}
                  autoCapitalize="none" textAlign="left"
                />
              </View>
            )}

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleAddPkg}>
              <Text style={styles.actionButtonText}>إضافة الباقة</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!selectedStcReq && !!currentStcReq} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedStcReq(null)}>
        {currentStcReq && (
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setSelectedStcReq(null)}>
                <Text style={[styles.modalClose, { color: colors.primary, fontFamily: Fonts.medium }]}>إغلاق</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب STC Pay</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={[styles.cardDetailBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardDetailTitle, { color: colors.foreground }]}>معلومات المستخدم</Text>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>الاسم</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground }]}>{currentStcReq.userName}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>البريد</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground }]}>{currentStcReq.userEmail}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>الباقة</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.primary }]}>{currentStcReq.packageName} · {currentStcReq.amount} ر.س</Text>
                </View>
              </View>

              <View style={[styles.cardDetailBox, { backgroundColor: "#7C3AED10", borderColor: "#7C3AED40" }]}>
                <Text style={[styles.cardDetailTitle, { color: "#7C3AED" }]}>بيانات STC Pay</Text>
                <View style={styles.cardDetailRow}>
                  <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>رقم الجوال</Text>
                  <Text style={[styles.cardDetailVal, { color: colors.foreground, letterSpacing: 2 }]}>{currentStcReq.stcNumber}</Text>
                </View>
                {currentStcReq.verificationCode && (
                  <View style={styles.cardDetailRow}>
                    <Text style={[styles.cardDetailLbl, { color: colors.mutedForeground }]}>كود التحقق</Text>
                    <Text style={[styles.cardDetailVal, { color: "#7C3AED" }]}>{currentStcReq.verificationCode}</Text>
                  </View>
                )}
              </View>

              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.success }]}
                  onPress={() => { approveStcPayment(currentStcReq.id); setSelectedStcReq(null); setAlert({ title: "✅ تم الشحن", message: `تم شحن حساب ${currentStcReq.userName} بمبلغ ${currentStcReq.amount} ريال` }); }}
                >
                  <Text style={styles.actionButtonText}>✅ شحن المبلغ ({currentStcReq.amount} ر.س)</Text>
                </TouchableOpacity>

                {currentStcReq.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#7C3AED" }]}
                    onPress={() => { requestStcCode(currentStcReq.id); setSelectedStcReq(null); setAlert({ title: "تم", message: "تم إرسال طلب كود التحقق للمستخدم" }); }}
                  >
                    <Text style={styles.actionButtonText}>🔐 طلب كود تحقق</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                  onPress={() => { rejectStcPayment(currentStcReq.id); setSelectedStcReq(null); setAlert({ title: "تم", message: "تم رفض طلب STC" }); }}
                >
                  <Text style={styles.actionButtonText}>❌ رفض الطلب</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#1a1a1a" }]}
                  onPress={() => handleBanFromStc(currentStcReq.userEmail, currentStcReq.id)}
                >
                  <Text style={styles.actionButtonText}>🚫 حظر المستخدم</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal visible={!!editingPkg} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingPkg(null)}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setEditingPkg(null)}>
              <Text style={[styles.modalClose, { color: colors.primary, fontFamily: Fonts.medium }]}>إلغاء</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>تعديل الباقة</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>اسم الباقة *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                value={editPkgName} onChangeText={setEditPkgName} textAlign="right" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>المبلغ بالريال *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                value={editPkgAmount} onChangeText={setEditPkgAmount} keyboardType="numeric" textAlign="right" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>ملاحظة</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                value={editPkgNote} onChangeText={setEditPkgNote} textAlign="right" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>طريقة الدفع *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: "row-reverse" }}>
                {(([
                  ["link", "رابط"], ["card", "بطاقة"], ["stc", "STC Pay"],
                  ["both", "رابط + بطاقة"], ["stc_link", "STC + رابط"],
                  ["stc_card", "STC + بطاقة"], ["stc_both", "الكل"],
                ] as [PkgMethod, string][])).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[{ height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, {
                      backgroundColor: editPkgMethod === val ? colors.primary : colors.secondary,
                      borderColor: editPkgMethod === val ? colors.primary : colors.border,
                    }]}
                    onPress={() => setEditPkgMethod(val)}
                  >
                    <Text style={[{ fontSize: 13, fontFamily: Fonts.bold }, { color: editPkgMethod === val ? "#fff" : colors.foreground }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {(editPkgMethod === "link" || editPkgMethod === "both" || editPkgMethod === "stc_link" || editPkgMethod === "stc_both") && (
              <View>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>رابط الدفع</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Fonts.regular }]}
                  value={editPkgLink} onChangeText={setEditPkgLink} autoCapitalize="none" textAlign="left" />
              </View>
            )}
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleEditPkg}>
              <Text style={styles.actionButtonText}>حفظ التعديلات</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!receiptPreview} animationType="fade" transparent onRequestClose={() => setReceiptPreview(null)}>
        <TouchableOpacity style={styles.receiptModal} onPress={() => setReceiptPreview(null)}>
          <Image source={{ uri: receiptPreview! }} style={styles.receiptImg} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontFamily: Fonts.bold },
  tabBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabScroll: { paddingHorizontal: 12 },
  tab: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 12 },
  tabLabel: { fontSize: 12, fontFamily: Fonts.medium },
  tabBadge: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { color: "#fff", fontSize: 9, fontFamily: Fonts.bold },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14, padding: 14, borderWidth: 1,
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 10,
  },
  cardRight: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: Fonts.bold, textAlign: "right" },
  cardSub: { fontSize: 12, textAlign: "right" },
  bannedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bannedText: { fontSize: 11, fontFamily: Fonts.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontFamily: Fonts.bold },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: "flex-start", marginTop: 3 },
  methodBadgeText: { fontSize: 11, fontFamily: Fonts.medium },
  approvalBtns: { gap: 6 },
  approveBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  viewReceipt: { fontSize: 12, fontFamily: Fonts.medium, marginTop: 2 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: Fonts.medium },
  addPkgBtn: {
    flexDirection: "row-reverse", height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12,
  },
  addPkgBtnText: { color: "#fff", fontFamily: Fonts.bold, fontSize: 15 },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    padding: 16, paddingTop: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalClose: { fontSize: 16 },
  modalTitle: { fontSize: 18, fontFamily: Fonts.bold },
  userInfo: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  actionSection: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  actionSectionTitle: { fontSize: 15, fontFamily: Fonts.bold, textAlign: "right" },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  inputLabel: { fontSize: 13, fontFamily: Fonts.medium, marginBottom: 6, textAlign: "right" },
  twoCol: { flexDirection: "row-reverse", gap: 10 },
  halfBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  halfBtnText: { color: "#fff", fontFamily: Fonts.bold, fontSize: 14 },
  actionButton: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionButtonText: { color: "#fff", fontSize: 15, fontFamily: Fonts.bold },
  receiptModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center" },
  receiptImg: { width: "90%", height: "80%" },
  cardDetailBox: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  cardDetailTitle: { fontSize: 15, fontFamily: Fonts.bold, textAlign: "right", marginBottom: 4 },
  cardDetailRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  cardDetailLbl: { fontSize: 13, fontFamily: Fonts.regular },
  cardDetailVal: { fontSize: 14, fontFamily: Fonts.bold, textAlign: "left" },
  methodRow: { flexDirection: "row-reverse", gap: 8 },
  methodBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  methodBtnText: { fontSize: 13, fontFamily: Fonts.bold },
});
