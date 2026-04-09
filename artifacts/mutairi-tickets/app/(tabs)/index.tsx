import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Fonts } from "@/constants/fonts";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, tickets } = useApp();

  const myTickets = tickets.filter((t) => t.userEmail === currentUser?.email);
  const recentTickets = myTickets.slice(-3).reverse();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0B1426", "#1B3A8C", "#1B4FD8"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/account")}
            style={styles.avatarBtn}
          >
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>مرحباً بك</Text>
            <Text style={styles.userName}>{currentUser?.name}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيد المحفظة</Text>
          <Text style={styles.balanceValue}>{currentUser?.wallet ?? 0} <Text style={styles.balanceCurrency}>ر.س</Text></Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatNum}>{myTickets.length}</Text>
              <Text style={styles.balanceStatLabel}>تذاكر</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatNum}>{myTickets.filter((t) => t.paymentType === "real").length}</Text>
              <Text style={styles.balanceStatLabel}>حقيقية</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatNum}>{myTickets.filter((t) => t.paymentType === "fake").length}</Text>
              <Text style={styles.balanceStatLabel}>وهمية</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الخدمات</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: "حجز تذكرة", icon: "ticket", route: "/(tabs)/book", grad: ["#1B4FD8", "#0B1426"] as const },
            { label: "تذاكري", icon: "albums", route: "/(tabs)/my-tickets", grad: ["#C9A227", "#7B5E0F"] as const },
            { label: "المحفظة", icon: "wallet", route: "/(tabs)/wallet", grad: ["#10B981", "#065F46"] as const },
            { label: "حسابي", icon: "person-circle", route: "/(tabs)/account", grad: ["#6B7A99", "#3B4561"] as const },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={action.grad} style={styles.actionGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={action.icon as any} size={30} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {recentTickets.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => router.push("/(tabs)/my-tickets")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>آخر الحجوزات</Text>
            </View>
            {recentTickets.map((ticket) => (
              <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.card }]}>
                <View style={[styles.ticketAccent, { backgroundColor: ticket.paymentType === "real" ? colors.success : colors.warning }]} />
                <View style={styles.ticketBody}>
                  <View style={[styles.ticketBadge, { backgroundColor: ticket.paymentType === "real" ? colors.success + "20" : colors.warning + "20" }]}>
                    <Text style={[styles.ticketBadgeText, { color: ticket.paymentType === "real" ? colors.success : colors.warning }]}>
                      {ticket.paymentType === "real" ? "حقيقي" : "وهمي"}
                    </Text>
                  </View>
                  <Text style={[styles.ticketEvent, { color: colors.foreground }]}>{ticket.eventName}</Text>
                  <Text style={[styles.ticketMeta, { color: colors.mutedForeground }]}>
                    {ticket.ticketCount} تذكرة · مربع {ticket.box}
                  </Text>
                </View>
                <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.emptyIconBg} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
              <Ionicons name="ticket-outline" size={36} color="#fff" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد تذاكر بعد</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>ابدأ بحجز تذكرتك الأولى الآن</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/book")} activeOpacity={0.85}>
              <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.emptyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.emptyBtnText}>احجز الآن</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {currentUser?.isAdmin && (
          <TouchableOpacity onPress={() => router.push("/admin")} activeOpacity={0.88} style={[styles.adminCard, { borderColor: colors.gold + "60" }]}>
            <LinearGradient colors={["#C9A227", "#7B5E0F"]} style={styles.adminGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
              <Text style={styles.adminText}>لوحة الإدارة</Text>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 22, gap: 12 },
  avatarBtn: {},
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, alignItems: "flex-end" },
  greeting: { color: "rgba(255,255,255,0.65)", fontSize: 14, fontFamily: Fonts.medium },
  userName: { color: "#fff", fontSize: 20, fontFamily: Fonts.extraBold, letterSpacing: -0.3 },
  balanceCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    gap: 6,
  },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: Fonts.regular, textAlign: "right" },
  balanceValue: { color: "#fff", fontSize: 42, fontFamily: Fonts.extraBold, textAlign: "right", letterSpacing: -1 },
  balanceCurrency: { fontSize: 20, fontFamily: Fonts.bold },
  balanceRow: { flexDirection: "row-reverse", marginTop: 8, gap: 0 },
  balanceStat: { flex: 1, alignItems: "center", gap: 2 },
  balanceStatNum: { color: "#fff", fontSize: 20, fontFamily: Fonts.bold },
  balanceStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: Fonts.regular },
  balanceDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },
  scroll: { padding: 16, gap: 20 },
  sectionTitle: { fontSize: 18, fontFamily: Fonts.extraBold, textAlign: "right", letterSpacing: -0.3, marginBottom: 12 },
  sectionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 14, fontFamily: Fonts.bold },
  actionsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", alignItems: "center", gap: 10 },
  actionGrad: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  actionLabel: { fontSize: 14, fontFamily: Fonts.bold, textAlign: "center" },
  ticketCard: {
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  ticketAccent: { width: 5, alignSelf: "stretch" },
  ticketBody: { flex: 1, padding: 14, gap: 4, alignItems: "flex-end" },
  ticketBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-end" },
  ticketBadgeText: { fontSize: 12, fontFamily: Fonts.bold },
  ticketEvent: { fontSize: 15, fontFamily: Fonts.bold, textAlign: "right" },
  ticketMeta: { fontSize: 13, fontFamily: Fonts.regular, textAlign: "right" },
  emptyCard: {
    borderRadius: 24,
    padding: 36,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.extraBold },
  emptyDesc: { fontSize: 14, fontFamily: Fonts.regular, textAlign: "center" },
  emptyBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: "#1B4FD8",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emptyBtnText: { color: "#fff", fontFamily: Fonts.bold, fontSize: 16 },
  adminCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    shadowColor: "#C9A227",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  adminGrad: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  adminText: { flex: 1, color: "#fff", fontSize: 16, fontFamily: Fonts.bold, textAlign: "right" },
});
