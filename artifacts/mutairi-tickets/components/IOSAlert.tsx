import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface IOSAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export default function IOSAlert({
  visible,
  title,
  message,
  buttons = [{ text: "حسناً" }],
  onDismiss,
}: IOSAlertProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 280,
          friction: 18,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.alertBox,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
            ) : null}
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.buttonsRow}>
            {buttons.map((btn, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <View style={[styles.vertDivider, { backgroundColor: colors.border }]} />
                )}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    onDismiss?.();
                    btn.onPress?.();
                  }}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color:
                          btn.style === "destructive"
                            ? colors.destructive
                            : btn.style === "cancel"
                            ? colors.mutedForeground
                            : colors.primary,
                        fontWeight: buttons.length === 1 || btn.style !== "cancel" ? "700" : "400",
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertBox: {
    width: 275,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  textSection: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  divider: { height: StyleSheet.hairlineWidth },
  buttonsRow: { flexDirection: "row" },
  vertDivider: { width: StyleSheet.hairlineWidth },
  button: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
  },
});
