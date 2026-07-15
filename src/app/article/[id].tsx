/**
 * Education article detail. Clean reading layout with a tinted hero, meta row,
 * and generous body typography. See design.md §Education.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge, EmptyState, FadeIn, ScreenHeader } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mockEducation } from '@/data/mock';

const CATEGORY_LABEL: Record<string, string> = {
  eligibility: 'Eligibility',
  process: 'The process',
  health: 'Health',
  myths: 'Myths',
};

export default function ArticleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const article = mockEducation.find((a) => a.id === id);

  if (!article) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + Spacing.lg }]}>
        <ScreenHeader title="Article" showBack onBack={() => router.back()} large={false} />
        <EmptyState
          icon="document-outline"
          title="Article not found"
          subtitle="This article may have been moved or is no longer available."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing['3xl'] },
      ]}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title="" showBack onBack={() => router.back()} large={false} />

      <FadeIn>
        <View style={[styles.hero, { backgroundColor: theme.brandSubtle }]}>
          <View style={[styles.heroIcon, { backgroundColor: theme.surface }]}>
            <Ionicons
              name={(article.icon as keyof typeof Ionicons.glyphMap) ?? 'book'}
              size={28}
              color={theme.brand}
            />
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.meta}>
          <Badge label={CATEGORY_LABEL[article.category] ?? article.category} tone="brand" />
          <ThemedText type="footnote" color="textTertiary">
            {article.minutes} min read
          </ThemedText>
        </View>
        <ThemedText type="title" style={styles.title}>
          {article.title}
        </ThemedText>
        <ThemedText type="body" color="textSecondary" style={styles.summary}>
          {article.summary}
        </ThemedText>
      </FadeIn>

      <View style={styles.body}>
        {article.body.map((para, i) => (
          <FadeIn key={i} delay={120 + i * 40}>
            <ThemedText type="body" style={styles.para}>
              {para}
            </ThemedText>
          </FadeIn>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  hero: {
    height: 160,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  title: { marginBottom: Spacing.sm },
  summary: {},
  body: { gap: Spacing.base },
  para: { lineHeight: 26 },
});
