import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Fonts } from "@/constants/fonts";
import React, { useRef, useState } from "react";
import {
  Animated,
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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;

  const animBtn = (toValue: number) =>
    Animated.spring(btnScale, { toValue, tension: 300, friction: 10, useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email.trim()) return setAlert({ title: "خطأ", message: "الرجاء إدخال البريد الإلكتروني" });
    if (!password) return setAlert({ title: "خطأ", message: "الرجاء إدخال كلمة المرور" });
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)/");
    } else {
      setAlert({ title: "خطأ في تسجيل الدخول", message: result.message });
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <IOSLoadingOverlay visible={loading} message="جارِ تسجيل الدخول..." />
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
        colors={["#0B1426", "#1B3A8C", "#1B4FD8"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[styles.heroGradient, { paddingTop: topPad + 20 }]}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons name="ticket" size={38} color="#FFFFFF" />
            </View>
          </View>
        </View>
        <Text style={styles.heroTitle}>تذكرتك بتجيك ذحين</Text>
        <Text style={styles.heroSub}>مرحباً بك في المطيري للحجز</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1, marginTop: -24 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>تسجيل الدخول</Text>

            <View style={[styles.inputWrap, emailFocused && { borderColor: colors.primary, borderWidth: 1.5 }, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={19} color={emailFocused ? colors.primary : colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={[styles.inputWrap, passFocused && { borderColor: colors.primary, borderWidth: 1.5 }, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={passFocused ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="كلمة المرور"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <Text style={[styles.rememberText, { color: colors.mutedForeground }]}>تذكرني</Text>
              <View
                style={[
                  styles.toggle,
                  { backgroundColor: rememberMe ? colors.primary : colors.muted },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: "#fff",
                      transform: [{ translateX: rememberMe ? 18 : 2 }],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPressIn={() => animBtn(0.96)}
                onPressOut={() => animBtn(1)}
                onPress={handleLogin}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={["#1B4FD8", "#0B1426"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
                  <Ionicons name="arrow-back" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.divRow}>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.divText, { color: colors.mutedForeground }]}>أو</Text>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, { borderColor: colors.primary }]}
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.8}
            >
              <Text style={[styles.registerBtnText, { color: colors.primary }]}>إنشاء حساب جديد</Text>
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
  heroGradient: {
    alignItems: "center",
    paddingBottom: 52,
    paddingHorizontal: 20,
  },
  logoWrap: { marginBottom: 16 },
  logoOuter: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 6,
  },
  heroSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    fontFamily: Fonts.regular,
    textAlign: "center",
  },
  scroll: { paddingHorizontal: 16 },
  card: {
    borderRadius: 26,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 14,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    textAlign: "right",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: 52,
  },
  rememberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberText: { fontSize: 14, fontFamily: Fonts.medium },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  loginBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1B4FD8",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  loginBtnText: { color: "#fff", fontSize: 17, fontFamily: Fonts.bold, letterSpacing: -0.3 },
  divRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 13 },
  registerBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  registerBtnText: { fontSize: 16, fontFamily: Fonts.bold },
  hint: { fontSize: 13, fontFamily: Fonts.regular, textAlign: "center", lineHeight: 20 },
});
