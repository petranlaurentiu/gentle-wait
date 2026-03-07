/**
 * Typography components backed by the shared liquid-glass type scale.
 */
import { Text as RNText, TextProps, TextStyle } from "react-native";
import { fonts, typography } from "@/src/theme/theme";
import { useTheme } from "@/src/theme/ThemeProvider";

type TypographyVariant =
  | "display"
  | "hero"
  | "screenTitle"
  | "title"
  | "sectionTitle"
  | "heading"
  | "bodyLarge"
  | "body"
  | "button"
  | "eyebrow"
  | "label"
  | "caption"
  | "small";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "tertiary"
    | "accent"
    | "inverse";
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
}

export function Text({
  variant = "body",
  color = "default",
  align = "left",
  textTransform,
  style,
  children,
  ...props
}: TypographyProps) {
  const { colors } = useTheme();

  const colorMap = {
    default: colors.textPrimary,
    primary: colors.primary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accent,
    inverse: colors.textInverse,
  };

  const variantStyle = typography[variant];

  const textStyle: TextStyle = {
    fontFamily: variantStyle.fontFamily || fonts.regular,
    fontSize: variantStyle.fontSize,
    lineHeight: variantStyle.lineHeight,
    letterSpacing: variantStyle.letterSpacing,
    color: colorMap[color],
    textAlign: align,
    textTransform:
      textTransform ?? ("textTransform" in variantStyle ? variantStyle.textTransform : undefined),
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
}

export function Heading({ children, style, ...props }: Omit<TypographyProps, "variant">) {
  return (
    <Text variant="screenTitle" {...props} style={style}>
      {children}
    </Text>
  );
}

export function Label({ children, style, ...props }: Omit<TypographyProps, "variant">) {
  return (
    <Text variant="eyebrow" color="secondary" {...props} style={style}>
      {children}
    </Text>
  );
}

export function DisplayNumber({ children, style, ...props }: Omit<TypographyProps, "variant">) {
  return (
    <Text variant="display" color="primary" {...props} style={style}>
      {children}
    </Text>
  );
}
