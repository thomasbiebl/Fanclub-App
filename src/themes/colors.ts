/** Small color helpers for generating themes. All colors are `#rrggbb`. */

export const WHITE = '#ffffff';
export const BLACK = '#000000';

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const toHex = ([r, g, b]: [number, number, number]) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** `t` is the share of `b`: 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Relative luminance as defined by WCAG. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, from 1 (same) to 21 (black on white). Text needs 4.5, large shapes 3. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on `bg` (always at least 4.5). */
export const readableOn = (bg: string) => (contrast(WHITE, bg) >= contrast(BLACK, bg) ? WHITE : BLACK);

/** Moves `color` toward black or white until it has at least `min` contrast against every background given. */
export function ensureContrast(color: string, backgrounds: string | string[], min: number): string {
  const bgs = Array.isArray(backgrounds) ? backgrounds : [backgrounds];
  const ok = (c: string) => bgs.every((bg) => contrast(c, bg) >= min);
  if (ok(color)) return color;
  // Go toward whichever end (white or black) reads better on all backgrounds.
  const white = Math.min(...bgs.map((bg) => contrast(WHITE, bg)));
  const black = Math.min(...bgs.map((bg) => contrast(BLACK, bg)));
  const target = white >= black ? WHITE : BLACK;
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = mix(color, target, t);
    if (ok(c)) return c;
  }
  return target;
}
