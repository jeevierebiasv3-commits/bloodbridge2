/**
 * Pressable with a spring scale micro-interaction and optional haptic.
 * The base for buttons, cards, list rows. See design.md §7 Motion.
 */

import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Spring } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { haptics, type HapticKind } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  scaleTo?: number;
  haptic?: HapticKind | false;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({
  children,
  scaleTo = 0.97,
  haptic = false,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    scale.value = reduceMotion ? 1 : withSpring(scaleTo, Spring);
    if (haptic) haptics[haptic]();
    onPressIn?.(e);
  };

  const onOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    scale.value = reduceMotion ? 1 : withSpring(1, Spring);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable style={[style, animatedStyle]} onPressIn={onIn} onPressOut={onOut} {...rest}>
      {children}
    </AnimatedPressable>
  );
}
