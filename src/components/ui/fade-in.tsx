/**
 * Entrance animation: quick fade + 6px rise, honoring reduce-motion. Use
 * `index` to stagger reveals across a list (40ms per item). The total delay is
 * capped so a screen always settles within ~320ms — long staggered cascades
 * read as polish on fast web reloads but as lag on a real device.
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
    progress.value = withDelay(
      Math.min(delay + index * 40, 120),
      withTiming(1, { duration: 200 }),
    );
  }, [progress, index, delay, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
