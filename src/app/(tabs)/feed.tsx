/**
 * Emergency feed. Real-time-style list of blood requests with compatibility
 * filtering, urgency sorting, and empty/skeleton states. See design.md §Feed.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RequestCard } from '@/components/request-card';
import {
  Badge,
  EmptyState,
  FadeIn,
  ScreenHeader,
  SegmentedControl,
  SkeletonCard,
} from '@/components/ui';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useProfile, useRequests } from '@/hooks/api';
import { canDonateTo } from '@/lib/blood';
import { URGENCY_RANK } from '@/types/domain';

type Filter = 'all' | 'compatible' | 'critical';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: requests = [], refetch, isLoading } = useRequests();
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const bloodType = profile?.bloodType;

  const visible = useMemo(() => {
    const active = requests.filter((r) => r.status !== 'expired');
    const filtered = active.filter((r) => {
      if (filter === 'compatible')
        return r.ownerId !== profile?.id && (bloodType ? canDonateTo(bloodType, r.bloodType) : true);
      if (filter === 'critical') return r.urgency === 'critical' || r.urgency === 'urgent';
      return true;
    });
    return filtered.sort((a, b) => {
      const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (u !== 0) return u;
      return new Date(a.neededBy).getTime() - new Date(b.neededBy).getTime();
    });
  }, [requests, filter, bloodType, profile?.id]);

  const compatibleCount = useMemo(
    () =>
      bloodType
        ? requests.filter(
            (r) => r.status !== 'expired' && r.ownerId !== profile?.id && canDonateTo(bloodType, r.bloodType),
          ).length
        : 0,
    [requests, bloodType, profile?.id],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: BottomTabInset + Spacing['3xl'] },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ScreenHeader
        title="Emergency feed"
        subtitle={
          bloodType
            ? `${compatibleCount} request${compatibleCount === 1 ? '' : 's'} you can help with`
            : 'Live blood requests near you'
        }
        trailing={<Badge label="Live" tone="danger" dot />}
      />

      <View style={styles.filter}>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Can help', value: 'compatible' },
            { label: 'Critical', value: 'critical' },
          ]}
        />
      </View>

      {isLoading || refreshing ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="No matching requests"
          subtitle={
            filter === 'compatible'
              ? 'There are no open requests compatible with your blood type right now. We will notify you the moment one appears.'
              : 'Nothing here at the moment. Pull down to refresh the feed.'
          }
        />
      ) : (
        <View style={styles.list}>
          {visible.map((req, i) => (
            <FadeIn key={req.id} index={i}>
              <RequestCard
                request={req}
                viewerType={bloodType}
                viewerId={profile?.id}
                onPress={() => router.push({ pathname: '/request/[id]', params: { id: req.id } })}
              />
            </FadeIn>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  filter: { marginTop: Spacing.xs },
  list: { gap: Spacing.md },
});
