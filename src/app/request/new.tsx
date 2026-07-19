/**
 * Create emergency blood request (modal). Collects blood type, units, urgency,
 * hospital, location, needed-by, contact, and notes. Adds to the live feed.
 * See design.md §Feed, §5 Components (Input, SegmentedControl).
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
import { useCreateRequest, useProfile } from '@/hooks/api';
import { useEnableLocation, useLocationState } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { BLOOD_TYPES, BloodType, Urgency } from '@/types/domain';

export default function NewRequestScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: profile } = useProfile();
  const createRequest = useCreateRequest();

  const [bloodType, setBloodType] = useState<BloodType>(profile?.bloodType ?? 'O+');
  const [units, setUnits] = useState('2');
  const [urgency, setUrgency] = useState<Urgency>('urgent');
  const [hospital, setHospital] = useState('');
  const [city, setCity] = useState(profile?.city ?? '');
  const [patientInitials, setPatientInitials] = useState('');
  const [contactName, setContactName] = useState(profile?.fullName ?? '');
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '');
  const [note, setNote] = useState('');

  // The requester is usually standing in the hospital, so attaching coords is
  // opt-out once location is granted — but it stays strictly optional.
  const { data: location } = useLocationState();
  const enableLocation = useEnableLocation();
  const [wantsLocation, setWantsLocation] = useState(true);
  const canAttachLocation = location?.status === 'granted' || location?.status === 'undetermined';
  const attachedCoords =
    location?.status === 'granted' && wantsLocation ? location.coords : undefined;

  const toggleLocation = () => {
    if (location?.status === 'granted') {
      haptics.selection();
      setWantsLocation((on) => !on);
      return;
    }
    // Undetermined: the most justified moment to ask for the grant.
    enableLocation.mutate();
  };

  const valid = useMemo(
    () => hospital.trim().length > 1 && city.trim().length > 1 && contactPhone.trim().length >= 6 && Number(units) > 0,
    [hospital, city, contactPhone, units],
  );

  const submit = async () => {
    if (!valid || createRequest.isPending) {
      if (!valid) haptics.error();
      return;
    }
    try {
      const created = await createRequest.mutateAsync({
        patientInitials: patientInitials.trim() || undefined,
        bloodType,
        unitsNeeded: Math.max(1, Number(units) || 1),
        urgency,
        hospital: hospital.trim(),
        city: city.trim(),
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim(),
        note: note.trim() || undefined,
        ...attachedCoords,
      });
      haptics.success();
      toast.show('Request posted to the emergency feed', 'success');
      router.replace({ pathname: '/request/[id]', params: { id: created.id } });
    } catch {
      haptics.error();
      toast.show('Could not post your request. Please try again.', 'danger');
    }
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
                  <ThemedText type="bodyStrong" style={{ color: active ? theme.onBrand : theme.text }}>
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

        {/* Hidden entirely once location is declined — the request posts fine
            without coords, and a dead row would only advertise a lost option. */}
        {canAttachLocation ? (
          <Pressable
            onPress={toggleLocation}
            disabled={enableLocation.isPending}
            accessibilityRole="switch"
            accessibilityLabel="Attach my current location to this request"
            accessibilityState={{ checked: Boolean(attachedCoords) }}
            style={[
              styles.locationRow,
              {
                backgroundColor: attachedCoords ? theme.brandSubtle : theme.surfaceSunken,
                borderColor: attachedCoords ? theme.brand : theme.border,
              },
            ]}>
            {enableLocation.isPending ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Ionicons
                name={attachedCoords ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={attachedCoords ? theme.brand : theme.borderStrong}
              />
            )}
            <View style={styles.locationBody}>
              <ThemedText type="bodyStrong">
                {attachedCoords ? 'Using your current location' : 'Attach my current location'}
              </ThemedText>
              <ThemedText type="caption" color="textSecondary">
                Helps donors see the real distance to the hospital.
              </ThemedText>
            </View>
          </Pressable>
        ) : null}

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

        <Button label="Post request" fullWidth icon="megaphone" disabled={!valid} loading={createRequest.isPending} onPress={submit} style={styles.submit} />
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  locationBody: { flex: 1, gap: 2 },
  unitsField: { flex: 1 },
  glyphPreview: { paddingBottom: 2 },
  notes: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.md },
  submit: { marginTop: Spacing.sm },
});
