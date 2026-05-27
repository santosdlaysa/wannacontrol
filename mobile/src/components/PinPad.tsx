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

  // Trigger shake when error changes to true
  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPin('');
      });
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
          // Reset pin after a short delay to allow re-entry
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

  const renderDots = () => (
    <Animated.View
      style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}
    >
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderButton = (label: string, onPress: () => void) => (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderDots()}

      <View style={styles.pad}>
        <View style={styles.row}>
          {renderButton('1', () => handlePress('1'))}
          {renderButton('2', () => handlePress('2'))}
          {renderButton('3', () => handlePress('3'))}
        </View>
        <View style={styles.row}>
          {renderButton('4', () => handlePress('4'))}
          {renderButton('5', () => handlePress('5'))}
          {renderButton('6', () => handlePress('6'))}
        </View>
        <View style={styles.row}>
          {renderButton('7', () => handlePress('7'))}
          {renderButton('8', () => handlePress('8'))}
          {renderButton('9', () => handlePress('9'))}
        </View>
        <View style={styles.row}>
          <View style={styles.button} />
          {renderButton('0', () => handlePress('0'))}
          <TouchableOpacity
            style={styles.button}
            onPress={handleBackspace}
            activeOpacity={0.6}
            disabled={disabled}
          >
            <Text style={styles.backspaceText}>&#9003;</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dotError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger,
  },
  pad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.primary,
  },
  backspaceText: {
    fontSize: 24,
    color: COLORS.primary,
  },
});
