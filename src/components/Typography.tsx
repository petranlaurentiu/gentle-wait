/**
 * Typography Components - Pre-styled text components with Outfit font
 * Ensures consistent typography throughout the app
 */
import { Text as RNText, TextStyle, TextProps } from "react-native";
import { typography, fonts } from "@/src/theme/theme";
import { useTheme } from "@/src/theme/ThemeProvider";

type TypographyVariant =
  | "display"
  | "hero"
  | "title"
  | "heading"
  | "bodyLarge"
  | "body"
  | "button"
  | "label"
  | "caption"
  | "small";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: "primary" | "secondary" | "muted" | "accent" | "default";
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
}

export function Text({
  variant = "body",
  color = "default",
  align = "left",
  textTransform = "none",
  style,
  children,
  ...props
}: TypographyProps) {
  const { colors } = useTheme();

  const colorMap = {
    default: colors.text,
    primary: colors.primary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    accent: colors.accent,
  };

  const variantStyle = typography[variant];

  const textStyle: TextStyle = {
    fontFamily: variantStyle.fontFamily || fonts.regular,
    fontSize: variantStyle.fontSize,
    lineHeight: variantStyle.lineHeight,
    letterSpacing: variantStyle.letterSpacing,
    color: colorMap[color],
    textAlign: align,
    ...(textTransform && {
      textTransform: textTransform,
    }),
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
}

/**
 * Heading component - convenience wrapper for title-level text
 */
export function Heading({
  children,
  style,
  ...props
}: Omit<TypographyProps, "variant">) {
  return (
    <Text variant="title" {...props} style={style}>
      {children}
    </Text>
  );
}

/**
 * Label component - for form labels and section headers
 */
export function Label({
  children,
  style,
  ...props
}: Omit<TypographyProps, "variant">) {
  return (
    <Text variant="label" color="secondary" {...props} style={style}>
      {children}
    </Text>
  );
}

/**
 * DisplayNumber component - for large stat numbers
 */
export function DisplayNumber({
  children,
  style,
  ...props
}: Omit<TypographyProps, "variant">) {
  return (
    <Text variant="display" color="primary" {...props} style={style}>
      {children}
    </Text>
  );
}
