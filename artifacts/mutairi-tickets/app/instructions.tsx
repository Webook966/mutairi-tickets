import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Section {
  title: string;
  icon: string;
  steps: string[];
}

const sections: Section[] = [
  {
    title: "كيفية حجز تذكرة",
    icon: "tag",
    steps: [
      "1. اضغط على تبويب «حجز تذاكر» في الشريط السفلي",
      "2. أدخل اسم المباراة أو الفعالية واضغط «متابعة»",
      "3. انتظر 5 ثواني ثم أدخل عدد التذاكر المطلوبة",
      "4. أدخل رقم المربع ثم اضغط «تحقق من التوفر»",
      "5. انتظر 5 ثواني للتحقق من توفر التذاكر",
      "6. اختر طريقة الدفع (حقيقي أو وهمي)",
      "7. بعد التأكيد ستظهر رسالة نجاح الحجز",
    ],
  },
  {
    title: "الدفع الوهمي — التعليمات الكاملة",
    icon: "zap",
    steps: [
      "⚠️ الدفع الوهمي هو دفع وهمي. ستحصل على تذكرة حقيقية.",
      "⚠️ يمكن أن يُبند حسابك لأنك قمت بالشراء غير القانوني.",
      "⚠️ نحن نخلي أي مسؤولية عن استخدام الدفع الوهمي.",
      "—",
      "للاشتراك في الدفع الوهمي:",
      "1. اذهب إلى تبويب «المحفظة»",
      "2. اضغط «اشتراك وهمي» (50 ريال أسبوعياً)",
      "3. بعد خصم المبلغ من رصيدك سيتم تفعيل الاشتراك",
      "4. عند الحجز اضغط «دفع وهمي» وأكد الموافقة",
    ],
  },
  {
    title: "شحن رصيد المحفظة",
    icon: "credit-card",
    steps: [
      "1. اذهب إلى تبويب «المحفظة»",
      "2. اضغط «شحن الرصيد»",
      "3. اختر الباقة المناسبة (تظهر الباقات التي أضافها المدير)",
      "4. اضغط «اضغط للدفع» وسيتم تحويلك لرابط الدفع",
      "5. بعد الدفع ارفع صورة الإيصال/الخصم",
      "⚠️ ذا ترسل صور كاذبة سوف تنحظر نهائياً من التطبيق",
      "6. انتظر موافقة الإدارة لإضافة الرصيد لحسابك",
    ],
  },
  {
    title: "تحويل الرصيد",
    icon: "send",
    steps: [
      "1. اذهب إلى تبويب «المحفظة»",
      "2. اضغط «تحويل الرصيد»",
      "3. أدخل بريد المستلم والمبلغ",
      "4. اضغط «تحويل الآن» لإتمام العملية",
      "5. يمكن مشاهدة آخر التحويلات في صفحة المحفظة",
    ],
  },
  {
    title: "تغيير كلمة المرور",
    icon: "lock",
    steps: [
      "1. اذهب إلى تبويب «حسابي»",
      "2. ابحث عن قسم «تغيير كلمة المرور»",
      "3. أدخل كلمة المرور الحالية",
      "4. أدخل كلمة المرور الجديدة (6 أحرف على الأقل)",
      "5. أعد إدخال كلمة المرور الجديدة للتأكيد",
      "6. اضغط «تغيير كلمة المرور»",
    ],
  },
  {
    title: "الإيميلات المدعومة",
    icon: "mail",
    steps: [
      "يدعم التطبيق الإيميلات التالية فقط:",
      "✉️ gmail.com",
      "✉️ hotmail.com",
      "✉️ live.com",
      "✉️ yahoo.com",
      "الإيميلات الأخرى لن تُقبل عند التسجيل",
    ],
  },
];

export default function InstructionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>التعليمات</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
        ]}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          دليل الاستخدام الشامل لتطبيق المطيري لحجز التذاكر
        </Text>

        {sections.map((section, idx) => (
          <View key={idx} style={[styles.accordion, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpanded(expanded === idx ? null : idx)}
            >
              <View style={[styles.accordionIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={section.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.accordionTitle, { color: colors.foreground }]}>{section.title}</Text>
              <Feather
                name={expanded === idx ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {expanded === idx && (
              <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                {section.steps.map((step, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.step,
                      {
                        color: step.startsWith("⚠️")
                          ? colors.destructive
                          : step === "—"
                          ? colors.border
                          : colors.foreground,
                        fontWeight: step.startsWith("⚠️") ? "600" : "400",
                      },
                    ]}
                  >
                    {step === "—" ? "──────────" : step}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { padding: 16, gap: 12 },
  intro: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 4 },
  accordion: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  accordionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionTitle: { flex: 1, fontSize: 15, fontWeight: "700", textAlign: "right" },
  accordionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  step: {
    fontSize: 14,
    textAlign: "right",
    lineHeight: 22,
  },
});
