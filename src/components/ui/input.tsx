import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export type InputProps = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
};

export function Input({ label, icon, error, hint, style, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.brand : theme.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <ThemedText type="subhead" color="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: theme.surfaceSunken, borderColor },
        ]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? theme.brand : theme.textTertiary}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <ThemedText type="footnote" color="danger" style={styles.helper}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="footnote" color="textTertiary" style={styles.helper}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    minHeight: 52,
  },
  icon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 16, paddingVertical: Spacing.md },
  helper: { marginLeft: Spacing.xs },
});
