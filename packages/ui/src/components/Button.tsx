import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textInverse : colors.primary}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  // Variants
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },

  // Sizes
  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.md },
  size_md: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  size_lg: { paddingHorizontal: spacing['2xl'], paddingVertical: spacing.base },

  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  // Labels
  label: { fontWeight: fontWeight.bold },
  label_primary: { color: colors.textInverse },
  label_secondary: { color: colors.text },
  label_ghost: { color: colors.primary },
  label_danger: { color: '#fff' },

  labelSize_sm: { fontSize: fontSize.xs },
  labelSize_md: { fontSize: fontSize.sm },
  labelSize_lg: { fontSize: fontSize.base },
});
