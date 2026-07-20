/**
 * Edit profile (modal). A single-page form prefilled from the current profile,
 * saving partial changes via PATCH /api/profile. Distinct from profile-setup,
 * which is the first-run wizard. See design.md §Profile.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, EmptyState, Input, ScreenHeader, SegmentedControl, useToast } from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/hooks/api';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { BLOOD_TYPES, type BloodType, type Gender, type UserProfile } from '@/types/domain';

const AVATAR_COLORS = ['#E5484D', '#3B82F6', '#30A46C', '#8B5CF6', '#D97706', '#EC4899'];

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();

  if (!profile) {
    if (isLoading) return <View style={[styles.flex, { paddingTop: insets.top }]} />;
    return (
      <View style={[styles.flex, { paddingTop: insets.top + Spacing.lg }]}>
        <ScreenHeader title="Edit profile" showBack onBack={() => router.back()} large={false} />
        <EmptyState
          icon="person-outline"
          title="Profile not set up"
          subtitle="Complete your profile setup first."
        />
      </View>
    );
  }

  // Mount the form only once the profile is loaded, so its useState initializers
  // capture the real values rather than empty defaults from a pending query.
  return <EditForm profile={profile} />;
}

function EditForm({ profile }: { profile: UserProfile }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState(profile.fullName);
  const [gender, setGender] = useState<Gender>(profile.gender ?? 'prefer_not');
  const [bloodType, setBloodType] = useState<BloodType | null>(profile.bloodType);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);
  const [weight, setWeight] = useState(profile.health?.weightKg ? String(profile.health.weightKg) : '');
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor ?? AVATAR_COLORS[0]);

  const valid = useMemo(
    () => fullName.trim().length > 1 && bloodType !== null && phone.trim().length >= 6 && city.trim().length > 1,
    [fullName, bloodType, phone, city],
  );

  // Return to wherever we came from, falling back to the profile tab when this
  // screen was opened directly (e.g. a deep link) and there is no history.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const save = async () => {
    if (!valid || !bloodType || updateProfile.isPending) {
      if (!valid) haptics.error();
      return;
    }
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        bloodType,
        phone: phone.trim(),
        city: city.trim(),
        gender,
        avatarColor,
        weightKg: weight ? Number(weight) || undefined : undefined,
      });
      haptics.success();
      toast.show('Profile updated', 'success');
      goBack();
    } catch {
      haptics.error();
      toast.show('Could not save your changes. Please try again.', 'danger');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing['4xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Edit profile" showBack onBack={goBack} large={false} />

        <View style={styles.form}>
          <Input
            label="Full name"
            icon="person-outline"
            placeholder="Alex Rivera"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="Email"
            icon="mail-outline"
            value={profile.email}
            editable={false}
            hint="Linked to your account"
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
              Blood type
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
          </View>

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

          <Input
            label="Weight (kg)"
            icon="barbell-outline"
            placeholder="70"
            value={weight}
            onChangeText={setWeight}
            keyboardType="number-pad"
            hint="Donors usually weigh at least 50 kg."
          />

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

          <Button
            label="Save changes"
            fullWidth
            icon="checkmark"
            disabled={!valid}
            loading={updateProfile.isPending}
            onPress={save}
            style={styles.save}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.base },
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
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  bloodCell: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  save: { marginTop: Spacing.md },
});
