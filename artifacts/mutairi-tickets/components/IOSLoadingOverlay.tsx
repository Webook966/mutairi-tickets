import React, { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";
import IOSSpinner from "./IOSSpinner";

interface IOSLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function IOSLoadingOverlay({ visible, message }: IOSLoadingOverlayProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 220,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.box,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <IOSSpinner size={32} color="#FFFFFF" />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    backgroundColor: "rgba(22,22,28,0.92)",
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 36,
    alignItems: "center",
    gap: 13,
    minWidth: 120,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 18,
    maxWidth: 160,
  },
});
