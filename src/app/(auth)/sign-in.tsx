/**
 * Sign in / create account. Mock auth — any valid-looking email continues the
 * flow. New users route to profile setup; returning users land on the app.
 * See design.md §Auth, §5 Components (Input, Button).
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, FadeIn, Input } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signIn } = useAppStore();

  const [email, setEmail] = useState(profile?.email ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address');
      haptics.error();
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      haptics.error();
      return;
    }
    setError(null);
    setSubmitting(true);

    // Returning user: profile already exists and email matches → straight in.
    if (profile && profile.email.toLowerCase() === email.trim().toLowerCase()) {
      await signIn(profile);
      haptics.success();
      router.replace('/(tabs)/home');
      return;
    }

    // New user: carry the email into profile setup.
    haptics.selection();
    router.push({ pathname: '/profile-setup', params: { email: email.trim() } });
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={[styles.mark, { backgroundColor: theme.brandDeep }]}>
            <Ionicons name="water" size={32} color="#fff" />
          </View>
          <ThemedText type="display" style={styles.title}>
            Welcome back
          </ThemedText>
          <ThemedText type="body" color="textSecondary" style={styles.subtitle}>
            Sign in to keep saving lives with Vesta.
          </ThemedText>
        </FadeIn>

        <FadeIn delay={80} style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon="mail-outline"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            icon="lock-closed-outline"
            error={error ?? undefined}
          />
        </FadeIn>

        <FadeIn delay={140} style={styles.actions}>
          <Button
            label="Continue"
            onPress={onContinue}
            loading={submitting}
            fullWidth
            size="lg"
          />
          <View style={styles.hintRow}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <ThemedText type="footnote" color="textTertiary">
              New here? Continue creates your account
            </ThemedText>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { marginBottom: Spacing.xs },
  subtitle: {},
  form: { gap: Spacing.base },
  actions: { gap: Spacing.lg },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
