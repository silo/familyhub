// app/composables/useTheme.ts
// Composable for managing theme settings

import { DEFAULT_THEME, type PrimaryColor, type NeutralColor, type ColorMode } from '~/types'

export interface ThemeSettings {
  primaryColor: PrimaryColor
  neutralColor: NeutralColor
  radius: string
  colorMode: ColorMode
}

/**
 * Apply theme settings to the app
 */
export function applyTheme(settings: Partial<ThemeSettings>) {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()

  // Apply colors to app config
  if (appConfig.ui && (settings.primaryColor || settings.neutralColor)) {
    appConfig.ui.colors = {
      ...appConfig.ui.colors,
      primary: settings.primaryColor || appConfig.ui.colors?.primary || DEFAULT_THEME.primaryColor,
      neutral: settings.neutralColor || appConfig.ui.colors?.neutral || DEFAULT_THEME.neutralColor,
    }
  }

  // Apply radius as CSS variable
  if (settings.radius !== undefined && typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--ui-radius', `${settings.radius}rem`)
  }

  // Apply color mode
  if (settings.colorMode) {
    colorMode.preference = settings.colorMode
  }
}

/**
 * Normalize radius value from database (removes trailing zeros)
 */
export function normalizeRadius(radius: string | undefined | null): string {
  if (!radius) return DEFAULT_THEME.radius
  return parseFloat(radius).toString()
}

/**
 * Get Tailwind background class for a color name
 * Uses static class names so Tailwind can detect them at build time
 */
export function getColorClass(color: string): string {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
    black: 'bg-neutral-900 dark:bg-white',
    slate: 'bg-slate-500',
    gray: 'bg-gray-500',
    zinc: 'bg-zinc-500',
    neutral: 'bg-neutral-500',
    stone: 'bg-stone-500',
  }
  return colorClasses[color] || 'bg-gray-500'
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
