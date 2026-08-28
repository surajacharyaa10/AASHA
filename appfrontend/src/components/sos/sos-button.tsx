import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
  Platform,
  ReturnKeyType,
} from 'react-native';

interface SosButtonProps {
  onTrigger: () => void;
  isTriggered: boolean;
  onCancel: () => void;
  holdDurationMs?: number;
}

export function SosButton({
  onTrigger,
  isTriggered,
  onCancel,
  holdDurationMs = 3000,
}: SosButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation when triggered
  useEffect(() => {
    if (isTriggered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTriggered]);

  const handlePressIn = () => {
    if (isTriggered) return;

    setIsHolding(true);
    setCountdown(3);

    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: holdDurationMs,
      useNativeDriver: false,
    }).start();

    let remaining = 3;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        if (Platform.OS !== 'web') {
          Vibration.vibrate(50);
        }
      }
    }, 1000);

    holdTimerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsHolding(false);
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }
      onTrigger();
    }, holdDurationMs);
  };

  const handlePressOut = () => {
    if (isTriggered) return;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsHolding(false);
    setCountdown(3);
    progressAnim.setValue(0);
  };

  if (isTriggered) {
    return (
      <View style={styles.activeContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.15],
                outputRange: [0.5, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRingInner,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />

        <View style={styles.triggeredButton}>
          <Text style={styles.triggeredTitle}>SOS ACTIVE</Text>
          <Text style={styles.triggeredSub}>BROADCASTING</Text>
          <View style={styles.liveDotRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveDotText}>Mesh Active</Text>
          </View>
        </View>

        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>CANCEL SOS / I AM SAFE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.outerRing, isHolding && styles.outerRingHolding]} />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <View style={styles.buttonInner}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.instructionText}>
            {isHolding ? `HOLD (${countdown}s)...` : 'PRESS & HOLD 3s'}
          </Text>
          <Text style={styles.subText}>EMERGENCY BROADCAST</Text>
        </View>

        {isHolding && (
          <Animated.View
            style={[
              styles.progressOverlay,
              {
                opacity: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.6],
                }),
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  outerRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FEE2E2',
    opacity: 0.6,
  },
  outerRingHolding: {
    backgroundColor: '#FECDD3',
    transform: [{ scale: 1.08 }],
  },
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 6,
    borderColor: '#FFE4E6',
    overflow: 'hidden',
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#BE123C',
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sosText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFE4E6',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    letterSpacing: 1,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#9F1239',
  },
  activeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E11D48',
  },
  pulseRingInner: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFE4E6',
    opacity: 0.8,
  },
  triggeredButton: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#BE123C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#FFFFFF',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  triggeredTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  triggeredSub: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FECDD3',
    letterSpacing: 1,
    marginTop: 2,
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
});