import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { spacing } from "@/src/theme/theme";

const AnimatedView = Animated.createAnimatedComponent(View);

interface LumiIllustrationProps {
  source: ImageSource;
  maxHeight?: number;
  scale?: number;
}

export function LumiIllustration({
  source,
  maxHeight = 260,
  scale = 1,
}: LumiIllustrationProps) {
  const floatY = useSharedValue(10);
  const breatheScale = useSharedValue(0.96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.ease),
    });

    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, {
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );

    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.97, {
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [breatheScale, floatY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: floatY.value },
      { scale: scale * breatheScale.value },
    ],
  }));

  const styles = StyleSheet.create({
    wrap: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    stage: {
      width: "100%",
      maxWidth: 340,
      minHeight: maxHeight,
      maxHeight,
      alignItems: "center",
      justifyContent: "center",
    },
    imageFrame: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
    },
    image: {
      width: "100%",
      height: "100%",
    },
  });

  return (
    <View style={styles.wrap}>
      <AnimatedView style={[styles.stage, animatedStyle]}>
        <View style={styles.imageFrame}>
          <Image
            source={source}
            style={styles.image}
            contentFit="contain"
            contentPosition="center"
            transition={180}
            cachePolicy="memory-disk"
            allowDownscaling
          />
        </View>
      </AnimatedView>
    </View>
  );
}
