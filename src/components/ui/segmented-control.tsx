import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Radius, Spacing, Spring } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export type SegmentOption<T extends string> = { label: string; value: T };

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);

  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = width > 0 ? width / options.length : 0;
  const x = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    x.value = (w / options.length) * index;
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const move = (i: number, v: T) => {
    const target = seg * i;
    x.value = reduceMotion ? target : withSpring(target, Spring);
    onChange(v);
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.track, { backgroundColor: theme.surfaceSunken }]}>
      {seg > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            { width: seg - 4, backgroundColor: theme.surface },
            thumbStyle,
          ]}
        />
      ) : null}
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => move(i, o.value)}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <ThemedText
              type="subhead"
              color={active ? 'text' : 'textSecondary'}
              style={styles.label}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: Radius.md,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: Radius.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '600' },
});
