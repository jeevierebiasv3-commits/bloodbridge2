/**
 * Create emergency blood request (modal). Collects blood type, units, urgency,
 * hospital, location, needed-by, contact, and notes. Adds to the live feed.
 * See design.md §Feed, §5 Components (Input, SegmentedControl).
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  BloodTypeGlyph,
  Button,
  Input,
  ScreenHeader,
  SegmentedControl,
  useToast,
} from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';
import { BLOOD_TYPES, BloodType, EmergencyRequest, Urgency } from '@/types/domain';

export default function NewRequestScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { profile, addRequest } = useAppStore();

  const [bloodType, setBloodType] = useState<BloodType>(profile?.bloodType ?? 'O+');
  const [units, setUnits] = useState('2');
  const [urgency, setUrgency] = useState<Urgency>('urgent');
  const [hospital, setHospital] = useState('');
  const [city, setCity] = useState(profile?.city ?? '');
  const [patientInitials, setPatientInitials] = useState('');
  const [contactName, setContactName] = useState(profile?.fullName ?? '');
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '');
  const [note, setNote] = useState('');

  const valid = useMemo(
    () => hospital.trim().length > 1 && city.trim().length > 1 && contactPhone.trim().length >= 6 && Number(units) > 0,
    [hospital, city, contactPhone, units],
  );

  const submit = () => {
    if (!valid) {
      haptics.error();
      return;
    }
    const now = new Date();
    const neededBy = new Date(now.getTime() + 1000 * 60 * 60 * 12);
    const request: EmergencyRequest = {
      id: `req-${now.getTime()}`,
      patientInitials: patientInitials.trim() || 'A.B.',
      bloodType,
      unitsNeeded: Math.max(1, Number(units) || 1),
      unitsFulfilled: 0,
      urgency,
      hospital: hospital.trim(),
      city: city.trim(),
      distanceKm: 2.5,
      neededBy: neededBy.toISOString(),
      postedAt: now.toISOString(),
      contactName: contactName.trim() || 'Requester',
      contactPhone: contactPhone.trim(),
      note: note.trim() || undefined,
      status: 'open',
      respondersCount: 0,
    };
    void addRequest(request);
    haptics.success();
    toast.show('Request posted to the emergency feed', 'success');
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Request blood"
          subtitle="Post an emergency request to nearby compatible donors"
          showBack
          onBack={() => router.back()}
          large={false}
        />

        {/* Blood type picker */}
        <View style={styles.field}>
          <ThemedText type="subhead" color="textSecondary" style={styles.label}>
            Blood type needed
          </ThemedText>
          <View style={styles.typeGrid}>
            {BLOOD_TYPES.map((t) => {
              const active = t === bloodType;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    haptics.selection();
                    setBloodType(t);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.typeCell,
                    {
                      backgroundColor: active ? theme.brand : theme.surfaceSunken,
                      borderColor: active ? theme.brand : theme.border,
                    },
                  ]}>
                  <ThemedText type="bodyStrong" style={{ color: active ? theme.onColor : theme.text }}>
                    {t}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Units + urgency */}
        <View style={styles.row}>
          <View style={styles.unitsField}>
            <Input label="Units" value={units} onChangeText={setUnits} keyboardType="number-pad" icon="water-outline" />
          </View>
          <View style={styles.glyphPreview}>
            <BloodTypeGlyph type={bloodType} size="md" filled />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="subhead" color="textSecondary" style={styles.label}>
            Urgency
          </ThemedText>
          <SegmentedControl<Urgency>
            value={urgency}
            onChange={(v) => {
              haptics.selection();
              setUrgency(v);
            }}
            options={[
              { label: 'Critical', value: 'critical' },
              { label: 'Urgent', value: 'urgent' },
              { label: 'Moderate', value: 'moderate' },
            ]}
          />
        </View>

        <Input label="Hospital / facility" value={hospital} onChangeText={setHospital} placeholder="e.g. St. Mary's Medical Center" icon="business-outline" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="City" icon="location-outline" />
        <Input label="Patient initials (optional)" value={patientInitials} onChangeText={setPatientInitials} placeholder="A.B." autoCapitalize="characters" icon="person-outline" />
        <Input label="Contact name" value={contactName} onChangeText={setContactName} placeholder="Who should donors reach?" icon="person-circle-outline" />
        <Input label="Contact phone" value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" keyboardType="phone-pad" icon="call-outline" />
        <Input
          label="Additional notes (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Anything donors should know"
          multiline
          numberOfLines={3}
          style={styles.notes}
        />

        <Button label="Post request" fullWidth icon="megaphone" disabled={!valid} onPress={submit} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.base },
  field: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeCell: {
    width: '22%',
    flexGrow: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: Spacing.base, alignItems: 'flex-end' },
  unitsField: { flex: 1 },
  glyphPreview: { paddingBottom: 2 },
  notes: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.md },
  submit: { marginTop: Spacing.sm },
});
