import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts } from "@/constants/fonts";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Ticket } from "@/context/AppContext";
import IOSAlert from "@/components/IOSAlert";

type FilterType = "all" | "real" | "fake";

export default function MyTicketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, tickets, transferTicket, lookupUser } = useApp();
  const [filterPay, setFilterPay] = useState<FilterType>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [lookedUpName, setLookedUpName] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; onOk?: () => void } | null>(null);

  const myTickets = tickets.filter((t) => t.userEmail === currentUser?.email);
  const filtered = myTickets.filter((t) => filterPay === "all" || t.paymentType === filterPay);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleEmailChange = async (text: string) => {
    setTransferEmail(text);
    setLookedUpName(null);
    if (!text.trim()) return;
    if (text.includes("@") && text.includes(".")) {
      setLookupLoading(true);
      const result = await lookupUser(text.trim().toLowerCase());
      setLookupLoading(false);
      if (result) {
        if (result.email === currentUser?.email) {
          setLookedUpName(null);
        } else {
          setLookedUpName(result.name);
        }
      }
    }
  };

  const handleTransfer = async () => {
    if (!selectedTicket || !transferEmail.trim())
      return setAlert({ title: "خطأ", message: "الرجاء إدخال البريد الإلكتروني" });
    if (!lookedUpName)
      return setAlert({ title: "خطأ", message: "البريد الإلكتروني غير موجود في النظام" });
    if (transferEmail.trim().toLowerCase() === currentUser?.email)
      return setAlert({ title: "خطأ", message: "لا يمكن تحويل التذكرة لنفسك" });

    setTransferLoading(true);
    const result = await transferTicket(selectedTicket.id, transferEmail.trim());
    setTransferLoading(false);

    if (result.success) {
      setShowTransferModal(false);
      setSelectedTicket(null);
      setTransferEmail("");
      setLookedUpName(null);
      setAlert({ title: "تم التحويل ✓", message: result.message });
    } else {
      setAlert({ title: "خطأ", message: result.message });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {alert && (
        <IOSAlert
          title={alert.title}
          message={alert.message}
          onOk={() => { alert.onOk?.(); setAlert(null); }}
        />
      )}

      <LinearGradient
        colors={["#0B1426", "#1B3A8C", "#C9A227"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.countBubble}>
            <Text style={styles.countNum}>{myTickets.length}</Text>
            <Text style={styles.countLabel}>تذكرة</Text>
          </View>
          <Text style={styles.headerTitle}>تذاكري</Text>
        </View>

        <View style={styles.filterRow}>
          {[
            { label: "الكل", value: "all" },
            { label: "حقيقي", value: "real" },
            { label: "وهمي", value: "fake" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.filterChip,
                filterPay === opt.value && styles.filterChipActive,
              ]}
              onPress={() => setFilterPay(opt.value as FilterType)}
            >
              <Text style={[styles.filterChipText, filterPay === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={[...filtered].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient colors={["#C9A227", "#7B5E0F"]} style={styles.emptyIcon} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
              <Ionicons name="ticket-outline" size={36} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد تذاكر</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>احجز أول تذكرة لك الآن</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.ticketCard, { backgroundColor: colors.card }]}
            onPress={() => setSelectedTicket(item)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.ticketStripe,
                { backgroundColor: item.paymentType === "real" ? colors.success : colors.warning },
              ]}
            />
            <View style={styles.ticketContent}>
              <View style={styles.ticketTopRow}>
                <Text style={[styles.ticketDate, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
                <View style={[styles.badge, { backgroundColor: item.paymentType === "real" ? colors.success + "20" : colors.warning + "20" }]}>
                  <Text style={[styles.badgeText, { color: item.paymentType === "real" ? colors.success : colors.warning }]}>
                    {item.paymentType === "real" ? "حقيقي" : "وهمي"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.ticketEvent, { color: colors.foreground }]}>{item.eventName}</Text>
              <Text style={[styles.ticketMeta, { color: colors.mutedForeground }]}>
                {item.ticketCount} تذكرة · مربع {item.box}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTicket(null)}
      >
        {selectedTicket && (
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedTicket(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>تفاصيل التذكرة</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <LinearGradient
                colors={selectedTicket.paymentType === "real" ? ["#10B981", "#065F46"] : ["#F59E0B", "#B45309"]}
                style={styles.modalBadgeGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name={selectedTicket.paymentType === "real" ? "checkmark-circle" : "flash"} size={20} color="#fff" />
                <Text style={styles.modalBadgeText}>
                  نوع الحجز: {selectedTicket.paymentType === "real" ? "حقيقي" : "وهمي"}
                </Text>
              </LinearGradient>

              <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                {[
                  { label: "الفعالية", value: selectedTicket.eventName },
                  { label: "عدد التذاكر", value: `${selectedTicket.ticketCount} تذاكر` },
                  { label: "رقم المربع", value: `مربع ${selectedTicket.box}` },
                  { label: "الاسم", value: selectedTicket.userName },
                  { label: "البريد الإلكتروني", value: selectedTicket.userEmail },
                  { label: "تاريخ الحجز", value: formatDate(selectedTicket.date) },
                  { label: "الحالة", value: selectedTicket.status === "confirmed" ? "مؤكد" : "قيد الانتظار" },
                ].map((row, i, arr) => (
                  <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailVal, { color: colors.foreground }]}>{row.value}</Text>
                    <Text style={[styles.detailLbl, { color: colors.mutedForeground }]}>{row.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.transferBtn, { backgroundColor: "#1B3A8C" }]}
                onPress={() => {
                  setTransferEmail("");
                  setLookedUpName(null);
                  setShowTransferModal(true);
                }}
              >
                <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginLeft: 8 }} />
                <Text style={styles.transferBtnText}>تحويل التذكرة</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTransferModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>تحويل التذكرة</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle" size={18} color="#1B3A8C" style={{ marginLeft: 8 }} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                أدخل البريد الإلكتروني للشخص الذي تريد تحويل التذكرة إليه. سيظهر اسمه تلقائياً.
              </Text>
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>البريد الإلكتروني</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="example@gmail.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={transferEmail}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
                {lookupLoading && (
                  <ActivityIndicator size="small" color="#1B3A8C" style={{ marginLeft: 8 }} />
                )}
              </View>
            </View>

            {lookedUpName && (
              <View style={[styles.nameBox, { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 8 }} />
                <Text style={[styles.nameText, { color: "#10B981" }]}>
                  {lookedUpName}
                </Text>
              </View>
            )}

            {transferEmail.length > 3 && !lookupLoading && !lookedUpName && transferEmail.includes("@") && (
              <View style={[styles.nameBox, { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginLeft: 8 }} />
                <Text style={[styles.nameText, { color: "#EF4444" }]}>
                  البريد الإلكتروني غير موجود
                </Text>
              </View>
            )}

            {selectedTicket && (
              <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailVal, { color: colors.foreground }]}>{selectedTicket.eventName}</Text>
                  <Text style={[styles.detailLbl, { color: colors.mutedForeground }]}>الفعالية</Text>
                </View>
                <View style={[styles.detailRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <Text style={[styles.detailVal, { color: colors.foreground }]}>{selectedTicket.ticketCount} تذاكر</Text>
                  <Text style={[styles.detailLbl, { color: colors.mutedForeground }]}>العدد</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: lookedUpName ? "#1B3A8C" : colors.border },
              ]}
              onPress={handleTransfer}
              disabled={!lookedUpName || transferLoading}
            >
              {transferLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  <Text style={styles.confirmBtnText}>تحويل الآن</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 28, fontFamily: Fonts.extraBold, letterSpacing: -0.5 },
  countBubble: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  countNum: { color: "#fff", fontSize: 22, fontFamily: Fonts.extraBold },
  countLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: Fonts.medium },
  filterRow: { flexDirection: "row-reverse", gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  filterChipActive: { backgroundColor: "#fff" },
  filterChipText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: Fonts.bold },
  filterChipTextActive: { color: "#0B1426" },
  list: { padding: 16, gap: 10 },
  ticketCard: {
    borderRadius: 18,
    flexDirection: "row-reverse",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  ticketStripe: { width: 5, alignSelf: "stretch" },
  ticketContent: { flex: 1, padding: 14, gap: 4, alignItems: "flex-end" },
  ticketTopRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", width: "100%" },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontFamily: Fonts.bold },
  ticketDate: { fontSize: 13, fontFamily: Fonts.regular },
  ticketEvent: { fontSize: 16, fontFamily: Fonts.bold, textAlign: "right" },
  ticketMeta: { fontSize: 14, fontFamily: Fonts.regular, textAlign: "right" },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.extraBold },
  emptyDesc: { fontSize: 14, fontFamily: Fonts.regular },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  modalTitle: { fontSize: 18, fontFamily: Fonts.bold },
  modalBadgeGrad: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalBadgeText: { color: "#fff", fontSize: 16, fontFamily: Fonts.bold },
  detailCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  detailRow: { flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14 },
  detailLbl: { fontSize: 14, fontFamily: Fonts.regular },
  detailVal: { fontSize: 14, fontFamily: Fonts.bold },
  transferBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  transferBtnText: { color: "#fff", fontSize: 16, fontFamily: Fonts.bold },
  infoBox: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, textAlign: "right", lineHeight: 22 },
  inputLabel: { fontSize: 15, fontFamily: Fonts.bold, textAlign: "right", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: Fonts.regular },
  nameBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  nameText: { fontSize: 15, fontFamily: Fonts.bold, textAlign: "right" },
  confirmBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontFamily: Fonts.bold },
});
