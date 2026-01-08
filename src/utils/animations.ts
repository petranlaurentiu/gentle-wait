/**
 * Animation utilities and hooks using react-native-reanimated
 */
import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { animation } from '@/src/theme/theme';

/**
 * Hook for fade-in animation when component mounts
 * @param duration - Animation duration in ms (default: 300)
 */
export function useFadeInAnimation(duration: number = animation.screenFade) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.ease),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Hook for scale animation (grows from small to full size)
 * @param duration - Animation duration in ms (default: 300)
 */
export function useScaleInAnimation(duration: number = animation.screenFade) {
  const scale = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.ease),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for staggered fade-in animations (for lists/grids)
 * @param index - Index of the item in the list
 * @param totalItems - Total number of items
 * @param duration - Animation duration in ms (default: 300)
 * @param staggerDelay - Delay between each item in ms (default: 50)
 */
export function useStaggeredFadeIn(
  index: number,
  totalItems: number,
  duration: number = animation.screenFade,
  staggerDelay: number = 50
) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * staggerDelay;
    // Stagger each item's animation
    setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    }, delay);
  }, [opacity, translateY, index, duration, staggerDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for spring animation (bouncy effect)
 * Used for button presses and emphasis
 */
export function useSpringAnimation(
  trigger: boolean,
  scale: number = 0.95
) {
  const springScale = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      springScale.value = withSpring(scale, {
        damping: 10,
        mass: 1,
        stiffness: 100,
      });
      // Reset after brief delay
      setTimeout(() => {
        springScale.value = withSpring(1);
      }, 100);
    }
  }, [trigger, springScale, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: springScale.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for continuous loop animation (breathing effect)
 * @param minScale - Minimum scale value (default: 1)
 * @param maxScale - Maximum scale value (default: 1.3)
 * @param cycleDuration - Full cycle duration in ms (default: 8000 for breathing)
 */
export function useLoopAnimation(
  minScale: number = 1,
  maxScale: number = 1.3,
  cycleDuration: number = animation.breathingCycle
) {
  const loopValue = useSharedValue(minScale);

  useEffect(() => {
    loopValue.value = withTiming(maxScale, {
      duration: cycleDuration / 2,
      easing: Easing.inOut(Easing.ease),
    });

    const interval = setInterval(() => {
      loopValue.value = withTiming(
        loopValue.value === maxScale ? minScale : maxScale,
        {
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.ease),
        }
      );
    }, cycleDuration / 2);

    return () => clearInterval(interval);
  }, [loopValue, minScale, maxScale, cycleDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loopValue.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for slide-in from left animation
 * @param duration - Animation duration in ms
 */
export function useSlideInFromLeft(duration: number = animation.screenFade) {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  }, [translateX, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for slide-in from bottom animation
 * @param duration - Animation duration in ms
 */
export function useSlideInFromBottom(duration: number = animation.screenFade) {
  const translateY = useSharedValue(100);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  }, [translateY, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}
