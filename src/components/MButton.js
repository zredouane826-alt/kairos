import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, Text, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { buttonVariants, typography, radius, spacing } from '../theme';

export default function MButton({
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  small = false,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const v = buttonVariants[variant] || buttonVariants.primary;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.base,
          v.container,
          small && styles.small,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.text.color} />
        ) : (
          <Text style={[v.text, small && styles.textSmall]}>{children}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  small: {
    minHeight: 36,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  textSmall: {
    fontSize: typography.size.body,
  },
});
