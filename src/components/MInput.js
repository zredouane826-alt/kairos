import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../theme';

export default function MInput({
  label,
  value,
  placeholder,
  icon,
  type = 'default',
  error,
  hint,
  onChangeText,
  secureTextEntry,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur  = useCallback(() => setFocused(false), []);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        focused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={type}
          style={styles.input}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  containerFocused: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  containerError: {
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  icon: {
    fontSize: typography.size.subheading,
  },
  input: {
    flex: 1,
    fontSize: typography.size.bodyLg,
    color: colors.text,
    padding: 0,
  },
  error: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.red,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: typography.size.caption,
    color: colors.textDim,
    marginTop: spacing.xs,
  },
});
