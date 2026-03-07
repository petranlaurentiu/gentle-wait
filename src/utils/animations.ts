/**
 * Shared motion helpers for the liquid-glass UI.
 */
import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { animation } from "@/src/theme/theme";

export function useFadeInAnimation(duration: number = animation.enterSoft) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, opacity]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

export function useScaleInAnimation(duration: number = animation.enterSoft) {
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, opacity, scale]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
}

export function useStaggeredFadeIn(
  index: number,
  _totalItems: number,
  duration: number = animation.enterLift,
  staggerDelay: number = 85
) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);
  const scale = useSharedValue(0.985);

  useEffect(() => {
    const delay = index * staggerDelay;
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [duration, index, opacity, scale, staggerDelay, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));
}

export function useSpringAnimation(trigger: boolean, scale: number = 0.97) {
  const springScale = useSharedValue(1);

  useEffect(() => {
    if (!trigger) return;

    springScale.value = withSequence(
      withTiming(scale, {
        duration: animation.pressScale,
        easing: Easing.out(Easing.quad),
      }),
      withSpring(1, {
        damping: 14,
        mass: 0.7,
        stiffness: 180,
      })
    );
  }, [scale, springScale, trigger]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: springScale.value }],
  }));
}

export function useLoopAnimation(
  minScale: number = 1,
  maxScale: number = 1.03,
  cycleDuration: number = animation.breathingCycle
) {
  const loopValue = useSharedValue(minScale);

  useEffect(() => {
    loopValue.value = withRepeat(
      withSequence(
        withTiming(maxScale, {
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(minScale, {
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [cycleDuration, loopValue, maxScale, minScale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: loopValue.value }],
  }));
}

export function useSlideInFromLeft(duration: number = animation.enterLift) {
  const translateX = useSharedValue(-36);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, opacity, translateX]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));
}

export function useSlideInFromBottom(duration: number = animation.enterLift) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [duration, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}
