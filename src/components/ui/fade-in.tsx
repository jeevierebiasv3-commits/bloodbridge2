/**
 * Entrance animation: fade + 8px rise, honoring reduce-motion. Use `index` to
 * stagger reveals across a list (40ms per item, per design.md motion spec).
 */

import { type ReactNode, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/use-reduce-motion';

type FadeInProps = {
  children: ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export function FadeIn({ children, index = 0, delay = 0, style }: FadeInProps) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay + index * 40, withTiming(1, { duration: 320 }));
  }, [progress, index, delay, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
