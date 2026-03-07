import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Path,
  Circle,
  Text as SvgText,
  TSpan,
} from "react-native-svg";

interface LogoWordmarkProps {
  width?: number;
  height?: number;
}

export function LogoWordmark({ width = 330, height = 80 }: LogoWordmarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 660 160" fill="none">
      <Defs>
        <LinearGradient id="textFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#E8FBFF" />
          <Stop offset="50%" stopColor="#D6E4FF" />
          <Stop offset="100%" stopColor="#C4B5FD" />
        </LinearGradient>

        <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" />
          <Stop offset="100%" stopColor="#A855F7" />
        </LinearGradient>

        <LinearGradient id="arcOuter" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" />
          <Stop offset="50%" stopColor="#A855F7" />
          <Stop offset="100%" stopColor="#FF6B9D" />
        </LinearGradient>

        <RadialGradient id="dotFill" cx="38%" cy="38%" r="62%">
          <Stop offset="0%" stopColor="#00E5FF" />
          <Stop offset="100%" stopColor="#B07CFF" />
        </RadialGradient>
      </Defs>

      {/* Breath wave arcs */}
      <G opacity={0.9}>
        <Path
          d="M74 64 Q92 80, 74 96"
          stroke="url(#arcGrad)"
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      <G opacity={0.5}>
        <Path
          d="M68 50 Q100 80, 68 110"
          stroke="url(#arcGrad)"
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      <G opacity={0.3}>
        <Path
          d="M62 38 Q106 80, 62 122"
          stroke="url(#arcOuter)"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Center dot with ambient glow */}
      <Circle cx={60} cy={80} r={12} fill="#00D4FF" opacity={0.1} />
      <Circle cx={60} cy={80} r={5.5} fill="url(#dotFill)" />
      <Circle cx={58.5} cy={78} r={2} fill="#FFFFFF" opacity={0.45} />

      {/* Wordmark */}
      <SvgText
        x={130}
        y={100}
        fontFamily="Outfit-Light, Outfit, sans-serif"
        fontSize={54}
        fill="url(#textFill)"
        letterSpacing={0.5}
      >
        <TSpan fontFamily="Outfit-Light, Outfit, sans-serif" fontWeight="300">
          Gentle
        </TSpan>
        <TSpan fontFamily="Outfit-Medium, Outfit, sans-serif" fontWeight="500">
          Wait
        </TSpan>
      </SvgText>
    </Svg>
  );
}

interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 44 }: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Defs>
        <LinearGradient id="lmArcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" />
          <Stop offset="100%" stopColor="#A855F7" />
        </LinearGradient>

        <LinearGradient id="lmArcOuter" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00D4FF" />
          <Stop offset="50%" stopColor="#A855F7" />
          <Stop offset="100%" stopColor="#FF6B9D" />
        </LinearGradient>

        <RadialGradient id="lmDotFill" cx="38%" cy="38%" r="62%">
          <Stop offset="0%" stopColor="#00E5FF" />
          <Stop offset="100%" stopColor="#B07CFF" />
        </RadialGradient>
      </Defs>

      {/* Breath wave arcs */}
      <G opacity={0.9}>
        <Path
          d="M94 64 Q112 80, 94 96"
          stroke="url(#lmArcGrad)"
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      <G opacity={0.5}>
        <Path
          d="M88 48 Q122 80, 88 112"
          stroke="url(#lmArcGrad)"
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      <G opacity={0.3}>
        <Path
          d="M82 34 Q130 80, 82 126"
          stroke="url(#lmArcOuter)"
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Center dot */}
      <Circle cx={78} cy={80} r={16} fill="#00D4FF" opacity={0.1} />
      <Circle cx={78} cy={80} r={8} fill="url(#lmDotFill)" />
      <Circle cx={76} cy={77} r={3} fill="#FFFFFF" opacity={0.45} />
    </Svg>
  );
}
