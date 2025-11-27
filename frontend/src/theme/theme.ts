// Unified Design System for Invoice App

export const colors = {
  // Primary Brand Colors
  primary: '#2C3E50',
  primaryDark: '#1a252f',
  primaryLight: '#34495e',

  // Accent Colors
  accent: '#3498db',
  accentDark: '#2980b9',
  accentLight: '#5dade2',

  // Status Colors
  success: '#27ae60',
  successLight: '#2ecc71',
  error: '#e74c3c',
  errorLight: '#ec7063',
  warning: '#f39c12',
  warningLight: '#f1c40f',

  // Neutral Colors
  white: '#FFFFFF',
  background: '#F5F7FA',
  backgroundLight: '#FAFBFC',
  surface: '#FFFFFF',

  // Text Colors
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textDisabled: '#BDC3C7',
  textInverse: '#FFFFFF',

  // Border Colors
  border: '#E0E6ED',
  borderDark: '#BDC3C7',
  borderLight: '#ECF0F1',

  // Shadow Colors
  shadow: '#000000',

  // Input Colors
  inputBackground: '#F9FBFC',
  inputBorder: '#E0E6ED',
  inputPlaceholder: '#95A5A6',
};

export const typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  // Font Weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const borderRadius = {
  sm: 4,
  base: 8,
  md: 10,
  lg: 12,
  xl: 15,
  full: 9999,
};

export const shadows = {
  // Android elevation
  elevation: {
    xs: 1,
    sm: 2,
    base: 3,
    md: 4,
    lg: 5,
    xl: 8,
  },

  // iOS shadows
  ios: {
    xs: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sm: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    base: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    md: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    lg: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  },
};

// Common Component Styles
export const commonStyles = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.base,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      elevation: shadows.elevation.sm,
      ...shadows.ios.sm,
    },
    secondary: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.base,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      elevation: shadows.elevation.sm,
      ...shadows.ios.sm,
    },
    outline: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.base,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: colors.textInverse,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
    },
    textOutline: {
      color: colors.primary,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
    },
  },

  // Card Styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    elevation: shadows.elevation.sm,
    ...shadows.ios.sm,
  },

  // Input Styles
  input: {
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    field: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.inputBackground,
      fontSize: typography.fontSize.base,
      color: colors.textPrimary,
    },
    placeholder: colors.inputPlaceholder,
  },

  // Header Styles
  header: {
    container: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.textInverse,
    },
    subtitle: {
      fontSize: typography.fontSize.base,
      color: colors.textInverse,
      opacity: 0.9,
    },
  },

  // Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Screen padding
  screenPadding: {
    padding: spacing.base,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  commonStyles,
};
