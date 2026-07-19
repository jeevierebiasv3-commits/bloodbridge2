/**
 * Education hub. Category filter + article cards. Tapping opens the article
 * reader. See design.md §Education.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card, FadeIn, ScreenHeader, SkeletonCard } from '@/components/ui';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Spacing, TabBarClearance } from '@/constants/theme';
import { useArticles } from '@/hooks/api';
import { useTheme } from '@/hooks/use-theme';
import { EducationArticle } from '@/types/domain';

const CATEGORIES: { key: EducationArticle['category'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'process', label: 'Process' },
  { key: 'health', label: 'Health' },
  { key: 'myths', label: 'Myths' },
];

export default function LearnScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<EducationArticle['category'] | 'all'>('all');
  const { data: allArticles = [], isLoading } = useArticles();

  const featured = allArticles[0];

  // The featured article already headlines the screen — keep it out of the
  // "All" list so content never appears twice in one viewport.
  const articles = useMemo(
    () =>
      category === 'all'
        ? allArticles.filter((a) => a.id !== featured?.id)
        : allArticles.filter((a) => a.category === category),
    [category, featured?.id, allArticles],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + TabBarClearance },
      ]}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Learn" subtitle="Everything about giving blood, made simple" />

      {/* Featured */}
      {featured ? (
        <FadeIn>
          <PressableScale
            scaleTo={0.985}
            onPress={() => router.push({ pathname: '/article/[id]', params: { id: featured.id } })}>
            <View style={[styles.featured, { backgroundColor: theme.brandSubtle, borderColor: theme.border }]}>
              <View style={[styles.featuredIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name="sparkles" size={22} color={theme.brand} />
              </View>
              <ThemedText type="footnote" style={[styles.featuredKicker, { color: theme.brand }]}>
                FEATURED · {featured.minutes} MIN READ
              </ThemedText>
              <ThemedText type="title2" style={styles.featuredTitle}>
                {featured.title}
              </ThemedText>
              <ThemedText type="subhead" color="textSecondary" style={styles.featuredSummary}>
                {featured.summary}
              </ThemedText>
            </View>
          </PressableScale>
        </FadeIn>
      ) : null}

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <PressableScale
              key={c.key}
              haptic="selection"
              onPress={() => setCategory(c.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.brand : theme.surface,
                  borderColor: active ? theme.brand : theme.border,
                },
              ]}>
              <ThemedText type="subhead" color={active ? 'onBrand' : 'textSecondary'}>
                {c.label}
              </ThemedText>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Article list */}
      <View style={styles.list}>
        {isLoading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => (
          <FadeIn key={a.id} delay={i * 40}>
            <Card
              onPress={() => router.push({ pathname: '/article/[id]', params: { id: a.id } })}
              padding="base">
              <View style={styles.articleRow}>
                <View style={[styles.articleIcon, { backgroundColor: theme.brandSubtle }]}>
                  <Ionicons
                    name={(a.icon as keyof typeof Ionicons.glyphMap) ?? 'book'}
                    size={22}
                    color={theme.brand}
                  />
                </View>
                <View style={styles.articleBody}>
                  <ThemedText type="headline" numberOfLines={2}>
                    {a.title}
                  </ThemedText>
                  <ThemedText type="footnote" color="textSecondary" numberOfLines={2}>
                    {a.summary}
                  </ThemedText>
                  <ThemedText type="caption" color="textTertiary" style={styles.articleMeta}>
                    {a.minutes} MIN READ
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </View>
            </Card>
          </FadeIn>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.base, gap: Spacing.lg },
  featured: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featuredIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  featuredKicker: { letterSpacing: 0.6, fontWeight: '600' },
  featuredTitle: {},
  featuredSummary: { marginTop: 2 },
  chips: { gap: Spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  list: { gap: Spacing.md },
  articleRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleBody: { flex: 1, gap: 3 },
  articleMeta: { marginTop: 2 },
});
