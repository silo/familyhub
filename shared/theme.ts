// shared/theme.ts
// Shared theme constants used by both server and client

export const PRIMARY_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'black',
] as const

export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

export const RADIUS_VALUES = ['0', '0.125', '0.25', '0.375', '0.5'] as const

export const COLOR_MODES = ['light', 'dark', 'system'] as const

export const DEFAULT_THEME = {
  primaryColor: 'indigo',
  neutralColor: 'slate',
  radius: '0.25',
  colorMode: 'system',
} as const

export type PrimaryColor = (typeof PRIMARY_COLORS)[number]
export type NeutralColor = (typeof NEUTRAL_COLORS)[number]
export type RadiusValue = (typeof RADIUS_VALUES)[number]
export type ColorMode = (typeof COLOR_MODES)[number]
