/**
 * SnapPrice Design Tokens
 * Cores, tipografia e espaçamentos compartilhados entre mobile e futuros packages.
 */

export const colors = {
  // Backgrounds
  bg: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceOffset: '#242424',
  surfaceDynamic: '#2E2E2E',

  // Borders
  border: '#2A2A2A',
  divider: '#222222',

  // Text
  text: '#F5F5F5',
  textMuted: '#8A8A8A',
  textFaint: '#4A4A4A',
  textInverse: '#0F0F0F',

  // Primary — Âmbar/Laranja (marca SnapPrice)
  primary: '#F59E0B',
  primaryHover: '#D97706',
  primaryActive: '#B45309',
  primaryHighlight: '#2A1F07',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

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
  '5xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};
