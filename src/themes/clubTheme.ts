import type { Club } from './clubs';
import { BLACK, WHITE, contrast, ensureContrast, luminance, mix, readableOn } from './colors';

export type Mode = 'light' | 'dark';

export interface GeneratedTheme {
  /** CSS custom properties without the leading `--`. Same names as in nacht.css, plus a few extras. */
  vars: Record<string, string>;
  colorScheme: Mode;
  /** Color of the browser bar (meta theme-color). */
  barColor: string;
}

const NEUTRAL_BADGE = '#6b7686';

/**
 * Builds all design tokens for a club from its two colors, for light or dark.
 * Text colors are corrected until they reach the WCAG contrast of 4.5 (tests check this for every club).
 */
export function buildClubTheme(club: Club, mode: Mode): GeneratedTheme {
  const [p, s] = club.colors;
  // Tint backgrounds with the main color, or with the second one if the main color is (nearly) black.
  const tint = luminance(p) < 0.03 ? s : p;
  const strongBg = luminance(s) < 0.3 && luminance(s) > 0.001 ? s : luminance(p) < 0.3 ? p : mix(p, BLACK, 0.45);

  if (mode === 'light') {
    const bg = mix(tint, WHITE, 0.94);
    const surface = WHITE;
    const surface2 = mix(tint, WHITE, 0.89);
    const border = mix(tint, WHITE, 0.74);
    const fg = ensureContrast(mix(tint, BLACK, 0.86), [bg, surface, surface2], 7);
    const muted = ensureContrast(mix(fg, WHITE, 0.4), [bg, surface, surface2], 4.5);
    const onPrimary = readableOn(p);
    const hover = mix(p, onPrimary === WHITE ? BLACK : WHITE, 0.12);
    // Text-colored accent: the second color if it is readable on white, otherwise the main color made darker.
    const accent = contrast(s, surface2) >= 4.5 ? s : ensureContrast(p, [bg, surface, surface2], 4.5);
    const error = ensureContrast('#c4122f', [bg, surface, surface2], 4.5);
    const barTrack = mix(tint, WHITE, 0.82);
    const headerMuted = ensureContrast(mix(onPrimary, p, 0.2), p, 4.5);
    return {
      colorScheme: 'light',
      barColor: p,
      vars: {
        bg, surface, 'surface-2': surface2, border, fg, muted,
        primary: p, 'primary-hover': hover, 'on-primary': onPrimary,
        // The main color as text (titles, numbers): the club color itself if readable, else the accent.
        'primary-text': contrast(p, surface2) >= 4.5 ? p : accent,
        accent, 'accent-strong': strongBg, 'on-accent-strong': readableOn(strongBg),
        ok: '#1e9e5a', warn: '#b77a00', error, focus: accent,
        'header-bg': p, 'header-fg': onPrimary, 'header-muted': headerMuted,
        'tabbar-bg': surface, 'tab-active-bg': 'transparent', 'tab-active-fg': accent,
        'badge-bg': NEUTRAL_BADGE, 'on-badge': WHITE,
        'bar-track': barTrack, 'bar-fill': contrast(p, barTrack) >= 3 ? p : accent, 'bar-fill-full': error,
        'highlight-border': accent,
        radius: '14px', 'radius-sm': '12px', shadow: '0 1px 3px rgba(0, 0, 0, 0.08)', 'title-weight': '800',
      },
    };
  }

  const bg = mix(tint, BLACK, 0.88);
  const surface = mix(bg, WHITE, 0.07);
  const surface2 = mix(bg, BLACK, 0.3);
  const border = mix(bg, WHITE, 0.18);
  const fg = ensureContrast(mix(tint, WHITE, 0.92), [bg, surface], 7);
  const muted = ensureContrast(mix(fg, bg, 0.4), [bg, surface], 4.5);
  // Main color of the buttons: the club color, lightened if it is too dark to stand out on the dark ground.
  const primary = contrast(p, surface) >= 3.2 ? p : contrast(s, surface) >= 3.2 && luminance(s) > luminance(p) ? s : ensureContrast(p, surface, 3.2);
  const onPrimary = readableOn(primary);
  const hover = mix(primary, onPrimary === WHITE ? BLACK : WHITE, 0.12);
  const accent = ensureContrast(primary, [bg, surface], 4.5);
  const error = ensureContrast('#ff6b84', [bg, surface], 4.5);
  const badgeBg = mix(bg, WHITE, 0.34);
  const tabbar = mix(bg, BLACK, 0.4);
  return {
    colorScheme: 'dark',
    barColor: bg,
    vars: {
      bg, surface, 'surface-2': surface2, border, fg, muted,
      primary, 'primary-hover': hover, 'on-primary': onPrimary, 'primary-text': accent,
      accent, 'accent-strong': badgeBg, 'on-accent-strong': readableOn(badgeBg),
      ok: '#2bc27a', warn: '#f2b134', error, focus: accent,
      'header-bg': 'transparent', 'header-fg': fg, 'header-muted': muted,
      'tabbar-bg': tabbar, 'tab-active-bg': primary, 'tab-active-fg': onPrimary,
      'badge-bg': badgeBg, 'on-badge': readableOn(badgeBg),
      'bar-track': surface2, 'bar-fill': primary, 'bar-fill-full': error,
      'highlight-border': primary,
      radius: '16px', 'radius-sm': '12px', shadow: 'none', 'title-weight': '800',
    },
  };
}
