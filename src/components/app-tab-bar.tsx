/**
 * Custom animated bottom tab bar. Floating, rounded, soft-shadowed with an
 * animated pill indicator and press micro-interactions. See design.md §6, §7.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Shadow, Spacing, Spring } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  home: { on: 'home', off: 'home-outline' },
  feed: { on: 'pulse', off: 'pulse-outline' },
  donor: { on: 'water', off: 'water-outline' },
  learn: { on: 'book', off: 'book-outline' },
  profile: { on: 'person', off: 'person-outline' },
};

const LABELS: Record<string, string> = {
  home: 'Home',
  feed: 'Feed',
  donor: 'Donor',
  learn: 'Learn',
  profile: 'Profile',
};

/** Minimal shape of the props expo-router's Tabs passes to `tabBar`. */
type TabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function AppTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.host, { paddingBottom: insets.bottom || Spacing.base }]} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          Shadow.lg,
        ]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabButton
              key={route.key}
              routeName={route.name}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  routeName,
  focused,
  onPress,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const icon = ICONS[routeName] ?? ICONS.home;

  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    progress.value = reduceMotion ? (focused ? 1 : 0) : withSpring(focused ? 1 : 0, Spring);
  }, [focused, reduceMotion, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + progress.value * 0.2 }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.9}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={LABELS[routeName]}
      style={styles.tab}>
      <View style={styles.tabInner}>
        <Animated.View
          style={[styles.pill, { backgroundColor: theme.brandSubtle }, pillStyle]}
        />
        <Ionicons
          name={focused ? icon.on : icon.off}
          size={22}
          color={focused ? theme.brand : theme.textTertiary}
        />
      </View>
      <ThemedText
        type="caption"
        color={focused ? 'brand' : 'textTertiary'}
        style={styles.label}>
        {LABELS[routeName]}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    width: '100%',
    maxWidth: 480,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  tabInner: {
    width: 48,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.full,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
