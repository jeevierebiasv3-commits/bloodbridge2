/**
 * Profile creation wizard. Collects identity, blood type, contact, location,
 * and health info across elegant steps, then persists the profile and enters
 * the app. See design.md — multi-step, one decision per screen, clear progress.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, Input, SegmentedControl, useToast } from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useCreateProfile } from '@/hooks/api';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';
import { BLOOD_TYPES, type BloodType, type Gender } from '@/types/domain';

const AVATAR_COLORS = ['#E5484D', '#3B82F6', '#30A46C', '#8B5CF6', '#D97706', '#EC4899'];
const STEPS = ['You', 'Blood type', 'Contact', 'Health'] as const;

export default function ProfileSetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { completeOnboarding } = useAppStore();
  const createProfile = useCreateProfile();
  // Name + email come from the account created at sign-up — prefill both.
  const { data: session } = authClient.useSession();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(session?.user.name ?? '');
  const [gender, setGender] = useState<Gender>('prefer_not');
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [email] = useState(session?.user.email ?? '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [weight, setWeight] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const canAdvance = useMemo(() => {
    if (step === 0) return fullName.trim().length > 1;
    if (step === 1) return bloodType !== null;
    if (step === 2) return phone.trim().length >= 6 && city.trim().length > 1;
    return true;
  }, [step, fullName, bloodType, phone, city]);

  const finish = async () => {
    if (!bloodType || createProfile.isPending) return;
    try {
      await createProfile.mutateAsync({
        fullName: fullName.trim(),
        bloodType,
        phone: phone.trim(),
        city: city.trim(),
        gender,
        avatarColor,
        weightKg: weight ? Number(weight) || undefined : undefined,
      });
      await completeOnboarding();
      haptics.success();
      router.replace('/(tabs)/home');
    } catch {
      haptics.error();
      toast.show('Could not save your profile. Please try again.', 'danger');
    }
  };

  const next = () => {
    if (!canAdvance) return;
    haptics.selection();
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void finish();
  };

  const back = () => {
    if (step === 0) {
      router.back();
      return;
    }
    haptics.selection();
    setStep((s) => s - 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.topBar}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </PressableScale>
        <View style={styles.progressTrack}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressPip,
                { backgroundColor: i <= step ? theme.brand : theme.border },
              ]}
            />
          ))}
        </View>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="caption" color="brand" style={styles.stepTag}>
            STEP {step + 1} OF {STEPS.length}
          </ThemedText>

          {step === 0 && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepBody}>
              <ThemedText type="title">What should we call you?</ThemedText>
              <ThemedText type="body" color="textSecondary">
                This appears on your donor card and requests.
              </ThemedText>
              <View style={styles.form}>
                <Input
                  label="Full name"
                  icon="person-outline"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChangeText={setFullName}
                  autoFocus
                  returnKeyType="next"
                />
                <View>
                  <ThemedText type="subhead" color="textSecondary" style={styles.fieldLabel}>
                    Gender
                  </ThemedText>
                  <SegmentedControl
                    options={[
                      { label: 'Female', value: 'female' },
                      { label: 'Male', value: 'male' },
                      { label: 'Other', value: 'other' },
                    ]}
                    value={gender}
                    onChange={(v) => setGender(v as Gender)}
                  />
                </View>
                <View>
                  <ThemedText type="subhead" color="textSecondary" style={styles.fieldLabel}>
                    Card color
                  </ThemedText>
                  <View style={styles.swatches}>
                    {AVATAR_COLORS.map((c) => (
                      <PressableScale
                        key={c}
                        accessibilityRole="button"
                        accessibilityLabel={`Select color ${c}`}
                        onPress={() => {
                          haptics.selection();
                          setAvatarColor(c);
                        }}
                        style={[
                          styles.swatch,
                          { backgroundColor: c, borderColor: avatarColor === c ? theme.text : 'transparent' },
                        ]}>
                        {avatarColor === c ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                      </PressableScale>
                    ))}
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepBody}>
              <ThemedText type="title">What&apos;s your blood type?</ThemedText>
              <ThemedText type="body" color="textSecondary">
                We use this to match you with compatible requests. Not sure? You can update it later.
              </ThemedText>
              <View style={styles.bloodGrid}>
                {BLOOD_TYPES.map((bt) => {
                  const selected = bloodType === bt;
                  return (
                    <PressableScale
                      key={bt}
                      accessibilityRole="button"
                      accessibilityLabel={`Blood type ${bt}`}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        haptics.selection();
                        setBloodType(bt);
                      }}
                      style={[
                        styles.bloodCell,
                        {
                          backgroundColor: selected ? theme.brandSubtle : theme.surface,
                          borderColor: selected ? theme.brand : theme.border,
                        },
                      ]}>
                      <ThemedText type="title2" color={selected ? 'brand' : 'text'}>
                        {bt}
                      </ThemedText>
                    </PressableScale>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepBody}>
              <ThemedText type="title">How can donors reach you?</ThemedText>
              <ThemedText type="body" color="textSecondary">
                Shared only with hospitals and matched requests.
              </ThemedText>
              <View style={styles.form}>
                <Input
                  label="Email"
                  icon="mail-outline"
                  placeholder="you@example.com"
                  value={email}
                  editable={false}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  hint="Linked to your account"
                />
                <Input
                  label="Phone"
                  icon="call-outline"
                  placeholder="+63 917 123 4567"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <Input
                  label="City"
                  icon="location-outline"
                  placeholder="San Francisco"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepBody}>
              <ThemedText type="title">A few health details</ThemedText>
              <ThemedText type="body" color="textSecondary">
                Optional, but they help us tailor your eligibility reminders.
              </ThemedText>
              <View style={styles.form}>
                <Input
                  label="Weight (kg)"
                  icon="barbell-outline"
                  placeholder="70"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="number-pad"
                  hint="Donors usually weigh at least 50 kg."
                />
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base, borderTopColor: theme.border }]}>
          <Button
            label={step === STEPS.length - 1 ? 'Create profile' : 'Continue'}
            onPress={next}
            disabled={!canAdvance}
            loading={step === STEPS.length - 1 && createProfile.isPending}
            fullWidth
            size="lg"
            icon={step === STEPS.length - 1 ? 'checkmark' : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.base,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, flexDirection: 'row', gap: Spacing.xs },
  progressPip: { flex: 1, height: 4, borderRadius: Radius.full },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },
  stepTag: { letterSpacing: 1 },
  stepBody: { gap: Spacing.md },
  form: { gap: Spacing.base, marginTop: Spacing.sm },
  fieldLabel: { marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  swatches: { flexDirection: 'row', gap: Spacing.md },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  bloodCell: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  footer: {
    padding: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
