import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Fonts } from "@/constants/fonts";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const handleRegister = async () => {
    if (!name.trim()) return setAlert({ title: "خطأ", message: "الرجاء إدخال الاسم" });
    if (!email.trim()) return setAlert({ title: "خطأ", message: "الرجاء إدخال البريد الإلكتروني" });
    if (password.length < 6) return setAlert({ title: "خطأ", message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    if (password !== confirmPass) return setAlert({ title: "خطأ", message: "كلمة المرور غير متطابقة" });
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const result = await register(email.trim(), password, name.trim());
    setLoading(false);
    if (result.success) router.replace("/(tabs)/");
    else setAlert({ title: "خطأ", message: result.message });
  };

  const fields = [
    { label: "الاسم الكامل", value: name, onChange: setName, icon: "person-outline" as const, keyboard: "default" as const, secure: false },
    { label: "البريد الإلكتروني", value: email, onChange: setEmail, icon: "mail-outline" as const, keyboard: "email-address" as const, secure: false },
    { label: "كلمة المرور", value: password, onChange: setPassword, icon: "lock-closed-outline" as const, keyboard: "default" as const, secure: !showPassword },
    { label: "تأكيد كلمة المرور", value: confirmPass, onChange: setConfirmPass, icon: "lock-closed-outline" as const, keyboard: "default" as const, secure: !showPassword },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <IOSLoadingOverlay visible={loading} message="جارِ إنشاء الحساب..." />
      {alert && (
        <IOSAlert
          visible={!!alert}
          title={alert.title}
          message={alert.message}
          buttons={[{ text: "حسناً", onPress: () => setAlert(null) }]}
          onDismiss={() => setAlert(null)}
        />
      )}

      <LinearGradient
        colors={["#0B1426", "#1B3A8C"]}
        style={[
          styles.headerGrad,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10) },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {fields.map((field, i) => (
              <View key={field.label}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Ionicons name={field.icon} size={18} color={colors.mutedForeground} />
                  {i >= 2 && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color={colors.mutedForeground}
                        style={{ marginRight: -4 }}
                      />
                    </TouchableOpacity>
                  )}
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={field.label}
                    placeholderTextColor={colors.mutedForeground}
                    value={field.value}
                    onChangeText={field.onChange}
                    keyboardType={field.keyboard}
                    autoCapitalize="none"
                    secureTextEntry={field.secure}
                    textAlign="right"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={handleRegister} activeOpacity={0.9}>
              <LinearGradient
                colors={["#1B4FD8", "#0B1426"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={styles.submitText}>إنشاء الحساب</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            الإيميلات المدعومة: gmail · hotmail · live · yahoo
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: Fonts.bold },
  scroll: { padding: 16 },
  card: {
    borderRadius: 24,
    padding: 22,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 13, fontFamily: Fonts.medium, marginBottom: 5, textAlign: "right" },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 50,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, height: 50 },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: "#1B4FD8",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 17, fontFamily: Fonts.bold },
  hint: { fontSize: 12, textAlign: "center" },
});
