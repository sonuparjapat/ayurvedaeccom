export const Colors = {
  forest: '#1a2e1e',
  moss: '#2d5a3d',
  sage: '#4a7c5e',
  mint: '#e8f5ee',
  cream: '#f7f4eb',
  gold: '#c9a84c',
  goldLight: '#f0e4bc',
  white: '#ffffff',
  dark: '#0d120d',
  darkCard: '#111711',
  textDim: 'rgba(26,46,30,0.55)',
  emerald: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  // Extended premium palette
  surface: '#ffffff',
  surfaceElevated: '#fafaf7',
  border: 'rgba(26,46,30,0.10)',
  borderLight: 'rgba(26,46,30,0.06)',
  overlay: 'rgba(13,18,13,0.55)',
  shimmer1: '#e8e8e4',
  shimmer2: '#f2f2ee',
} as const

export const Fonts = {
  bold: 'DMSans_700Bold',
  medium: 'DMSans_500Medium',
  regular: 'DMSans_400Regular',
  displayBold: 'CormorantGaramond_700Bold',
  displayRegular: 'CormorantGaramond_400Regular',
} as const

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
} as const

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
} as const

export const Gradients = {
  forest: [Colors.forest, '#0f2018'] as [string, string],
  forestDeep: ['#0a1f14', Colors.forest] as [string, string],
  gold: [Colors.gold, '#a07830'] as [string, string],
  emerald: ['#059669', '#0d9488'] as [string, string],
  dark: ['#0d120d', '#111711'] as [string, string],
  hero: ['#0a1f14', '#1a3a2a'] as [string, string],
} as const

export const CATEGORY_THEMES = [
  { accent: '#0f3d2e', light: '#e8f5e9', ring: '#bbf7d0', grad: ['#0f3d2e', '#10b981'] as [string, string] },
  { accent: '#92400e', light: '#fffbeb', ring: '#fde68a', grad: ['#92400e', '#f59e0b'] as [string, string] },
  { accent: '#134e4a', light: '#f0fdfa', ring: '#99f6e4', grad: ['#134e4a', '#14b8a6'] as [string, string] },
  { accent: '#7c2d12', light: '#fff7ed', ring: '#fed7aa', grad: ['#7c2d12', '#f97316'] as [string, string] },
]
