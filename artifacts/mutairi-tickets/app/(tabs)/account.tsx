import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Fonts } from "@/constants/fonts";
import React, { useState } from "react";
import {
  Image,
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

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, updateProfile, changePassword, logout, deleteAccount } = useApp();

  const [editName, setEditName] = useState(currentUser?.name ?? "");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [alert, setAlert] = useState<{ title: string; message: string; onOk?: () => void; cancelable?: boolean; onCancel?: () => void } | null>(null);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setLoading(true); setLoadingMsg("جارِ تحديث الصورة...");
      await new Promise((r) => setTimeout(r, 1000));
      await updateProfile({ avatar: result.assets[0].uri });
      setLoading(false);
      setAlert({ title: "تم", message: "تم تحديث الصورة الشخصية بنجاح" });
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return setAlert({ title: "خطأ", message: "الاسم لا يمكن أن يكون فارغاً" });
    setLoading(true); setLoadingMsg("جارِ حفظ التغييرات...");
    await new Promise((r) => setTimeout(r, 800));
    await updateProfile({ name: editName.trim() });
    setLoading(false);
    setAlert({ title: "تم", message: "تم حفظ التغييرات بنجاح" });
  };

  const handleChangePass = async () => {
    if (!oldPass || !newPass || !confirmNewPass) return setAlert({ title: "خطأ", message: "الرجاء ملء جميع الحقول" });
    if (newPass !== confirmNewPass) return setAlert({ title: "خطأ", message: "كلمة المرور الجديدة غير متطابقة" });
    if (newPass.length < 6) return setAlert({ title: "خطأ", message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    setLoading(true); setLoadingMsg("جارِ تغيير كلمة المرور...");
    await new Promise((r) => setTimeout(r, 1000));
    const result = await changePassword(oldPass, newPass);
    setLoading(false);
    if (result.success) { setOldPass(""); setNewPass(""); setConfirmNewPass(""); }
    setAlert({ title: result.success ? "تم" : "خطأ", message: result.message });
  };

  const handleLogout = () => {
    setAlert({ title: "تسجيل الخروج", message: "هل تريد تسجيل الخروج؟", cancelable: true, onOk: () => { logout(); router.replace("/(auth)/"); }, onCancel: () => setAlert(null) });
  };

  const handleDeleteAccount = () => {
    setAlert({ title: "حذف الحساب", message: "هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.", cancelable: true, onOk: () => { if (currentUser) { deleteAccount(currentUser.email); router.replace("/(auth)/"); } }, onCancel: () => setAlert(null) });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <IOSLoadingOverlay visible={loading} message={loadingMsg} />
      {alert && (
        <IOSAlert visible={!!alert} title={alert.title} message={alert.message}
          buttons={alert.cancelable
            ? [{ text: "إلغاء", style: "cancel", onPress: alert.onCancel }, { text: "تأكيد", style: "destructive", onPress: alert.onOk }]
            : [{ text: "حسناً", onPress: () => { const ok = alert.onOk; setAlert(null); ok?.(); } }]}
          onDismiss={() => setAlert(null)} />
      )}

      <LinearGradient
        colors={["#0B1426", "#1B3A8C", "#1B4FD8"]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) }]}
      >
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrap}>
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          <View style={[styles.cameraBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="camera" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerName}>{currentUser?.name}</Text>
        <Text style={styles.headerEmail}>{currentUser?.email}</Text>
        {currentUser?.isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.gold} />
            <Text style={[styles.adminBadgeText, { color: colors.gold }]}>مدير النظام</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          {[
            { label: "رصيد المحفظة", value: `${currentUser?.wallet ?? 0} ر.س`, icon: "wallet", color: colors.success },
            { label: "الاشتراك الوهمي", value: currentUser?.hasFakePaySubscription ? "نشط" : "غير مشترك", icon: "flash", color: colors.warning },
            { label: "آخر دخول", value: formatDate(currentUser?.lastLogin ?? ""), icon: "time", color: colors.primary },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.infoRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: row.color + "15" }]}>
                <Ionicons name={row.icon as any} size={17} color={row.color} />
              </View>
              <Text style={[styles.infoVal, { color: colors.foreground }]}>{row.value}</Text>
              <Text style={[styles.infoLbl, { color: colors.mutedForeground }]}>{row.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تعديل الاسم</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
            value={editName} onChangeText={setEditName}
            placeholder="الاسم الكامل" placeholderTextColor={colors.mutedForeground} textAlign="right"
          />
          <TouchableOpacity onPress={handleSaveName} activeOpacity={0.88}>
            <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تغيير كلمة المرور</Text>
          {[
            { label: "كلمة المرور الحالية", value: oldPass, onChange: setOldPass },
            { label: "كلمة المرور الجديدة", value: newPass, onChange: setNewPass },
            { label: "تأكيد كلمة المرور الجديدة", value: confirmNewPass, onChange: setConfirmNewPass },
          ].map((field) => (
            <TextInput key={field.label}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder={field.label} placeholderTextColor={colors.mutedForeground}
              value={field.value} onChangeText={field.onChange} secureTextEntry textAlign="right"
            />
          ))}
          <TouchableOpacity onPress={handleChangePass} activeOpacity={0.88}>
            <LinearGradient colors={["#1B4FD8", "#0B1426"]} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.saveBtnText}>تغيير كلمة المرور</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 10 }}>
          {currentUser?.isAdmin && (
            <MenuRow icon="shield-checkmark" label="لوحة الإدارة" onPress={() => router.push("/admin")} colors={colors} iconColor={colors.gold} />
          )}
          <MenuRow icon="book-outline" label="التعليمات" onPress={() => router.push("/instructions" as any)} colors={colors} />
          <MenuRow icon="log-out-outline" label="تسجيل الخروج" onPress={handleLogout} colors={colors} iconColor={colors.destructive} danger />
          <MenuRow icon="trash-outline" label="حذف الحساب" onPress={handleDeleteAccount} colors={colors} iconColor={colors.destructive} danger />
        </View>
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, label, onPress, colors, iconColor, danger }: { icon: string; label: string; onPress: () => void; colors: any; iconColor?: string; danger?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { backgroundColor: colors.card }]}
      onPress={onPress} activeOpacity={0.85}
    >
      <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
      <Text style={[styles.menuLabel, { color: danger ? iconColor || colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={[styles.menuIcon, { backgroundColor: (iconColor || colors.primary) + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor || colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center", gap: 6 },
  avatarWrap: { position: "relative", marginTop: 8, marginBottom: 6 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute", bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  headerName: { color: "#fff", fontSize: 24, fontFamily: Fonts.extraBold, letterSpacing: -0.4 },
  headerEmail: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  adminBadge: {
    flexDirection: "row-reverse", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(201,162,39,0.4)",
  },
  adminBadgeText: { fontSize: 12, fontFamily: Fonts.bold },
  scroll: { padding: 16, gap: 14 },
  infoCard: {
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  infoRow: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 10 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLbl: { flex: 1, fontSize: 14, textAlign: "right" },
  infoVal: { fontSize: 14, fontFamily: Fonts.bold },
  section: {
    borderRadius: 20, padding: 20, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  sectionTitle: { fontSize: 17, fontFamily: Fonts.extraBold, textAlign: "right", letterSpacing: -0.3 },
  input: { height: 50, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  saveBtn: {
    height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center",
    shadowColor: "#1B4FD8", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: Fonts.bold },
  menuRow: {
    borderRadius: 16, padding: 16, flexDirection: "row-reverse", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: Fonts.medium, textAlign: "right" },
});
