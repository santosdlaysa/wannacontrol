import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { COLORS } from '../lib/constants';

interface PinPadProps {
  onComplete: (pin: string) => void;
  onClear?: () => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

export function PinPad({
  onComplete,
  onClear,
  length = 6,
  disabled = false,
  error = false,
}: PinPadProps) {
  const [pin, setPin] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => setPin(''));
    }
  }, [error, shakeAnim]);

  const handlePress = useCallback(
    (digit: string) => {
      if (disabled) return;
      const newPin = pin + digit;
      if (newPin.length <= length) {
        setPin(newPin);
        if (newPin.length === length) {
          onComplete(newPin);
          setTimeout(() => setPin(''), 500);
        }
      }
    },
    [pin, length, onComplete, disabled],
  );

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setPin((prev) => prev.slice(0, -1));
    onClear?.();
  }, [disabled, onClear]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotActive,
              error && styles.dotError,
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {['1','2','3','4','5','6','7','8','9','','0','back'].map((key, i) => {
          if (key === '') return <View key={i} style={styles.cell} />;
          if (key === 'back') {
            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={handleBackspace}
                activeOpacity={0.5}
                disabled={disabled}
              >
                <Text style={styles.backText}>&#9003;</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={i}
              style={styles.cell}
              onPress={() => handlePress(key)}
              activeOpacity={0.5}
              disabled={disabled}
            >
              <Text style={styles.digit}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 44,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: COLORS.brand,
    transform: [{ scale: 1.1 }],
  },
  dotError: {
    backgroundColor: COLORS.danger,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    justifyContent: 'center',
  },
  cell: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
  },
  digit: {
    fontSize: 30,
    fontWeight: '400',
    color: COLORS.white,
  },
  backText: {
    fontSize: 26,
    color: 'rgba(255,255,255,0.5)',
  },
});
