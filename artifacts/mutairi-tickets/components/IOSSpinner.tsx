import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface IOSSpinnerProps {
  size?: number;
  color?: string;
}

export default function IOSSpinner({ size = 24, color = "#FFFFFF" }: IOSSpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const lines = Array.from({ length: 12 }, (_, i) => i);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          position: "relative",
          transform: [{ rotate: spin }],
        }}
      >
        {lines.map((i) => {
          const angle = (i / 12) * 2 * Math.PI;
          const lineH = size * 0.28;
          const lineW = Math.max(1.5, size * 0.07);
          const distance = size * 0.34;
          const x = Math.sin(angle) * distance + size / 2 - lineW / 2;
          const y = -Math.cos(angle) * distance + size / 2 - lineH / 2;
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: lineW,
                height: lineH,
                borderRadius: lineW / 2,
                backgroundColor: color,
                opacity: (i + 1) / 12,
                transform: [{ rotate: `${(i / 12) * 360}deg` }],
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}
