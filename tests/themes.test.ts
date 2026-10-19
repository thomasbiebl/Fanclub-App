import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLUBS } from '../src/themes/clubs';
import { buildClubTheme, type Mode } from '../src/themes/clubTheme';
import { contrast, ensureContrast, luminance, mix, readableOn } from '../src/themes/colors';

const MODES: Mode[] = ['light', 'dark'];
const HEX = /^#[0-9a-f]{6}$/i;

describe('color helpers', () => {
  it('computes WCAG contrast', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#777777')).toBe(1);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('mixes and corrects colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    const fixed = ensureContrast('#ffee00', '#ffffff', 4.5);
    expect(contrast(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrast('#123456', '#ffffff', 4.5)).toBe('#123456');
    for (const bg of ['#fde100', '#65b32e', '#808080', '#0b1d3a']) expect(contrast(readableOn(bg), bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('club list', () => {
  it('has 18 clubs in each league with unique ids and valid colors', () => {
    expect(CLUBS.filter((c) => c.league === 1)).toHaveLength(18);
    expect(CLUBS.filter((c) => c.league === 2)).toHaveLength(18);
    expect(new Set(CLUBS.map((c) => c.id)).size).toBe(CLUBS.length);
    for (const c of CLUBS) {
      expect(c.id, c.id).toMatch(/^[a-z]+$/);
      expect(c.name.length).toBeGreaterThan(3);
      for (const color of c.colors) expect(color, c.id).toMatch(HEX);
    }
  });
});

describe('generated club themes', () => {
  const nacht = readFileSync('src/themes/nacht.css', 'utf8');
  const tokens = [...nacht.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]!);

  it('define every token the stylesheet uses', () => {
    expect(tokens.length).toBeGreaterThan(20);
    for (const club of CLUBS) for (const mode of MODES) {
      const { vars } = buildClubTheme(club, mode);
      for (const t of tokens) expect(vars, `${club.id} ${mode}: --${t}`).toHaveProperty(t);
      for (const t of ['error', 'on-badge', 'on-accent-strong', 'primary-text']) expect(vars, `${club.id} ${mode}: --${t}`).toHaveProperty(t);
    }
  });

  it('are readable: text, buttons, badges, header and tabs reach a contrast of 4.5', () => {
    const failures: string[] = [];
    const check = (label: string, a: string, b: string, min = 4.5) => {
      if (!HEX.test(a) || !HEX.test(b)) return void failures.push(`${label}: no color (${a}, ${b})`);
      const c = contrast(a, b);
      if (c < min) failures.push(`${label}: ${c.toFixed(2)} (${a} on ${b})`);
    };
    for (const club of CLUBS) for (const mode of MODES) {
      const v = buildClubTheme(club, mode).vars as Record<string, string>;
      const id = `${club.id}/${mode}`;
      for (const bg of ['bg', 'surface', 'surface-2'] as const) {
        check(`${id} fg on ${bg}`, v.fg!, v[bg]!, 7);
        check(`${id} muted on ${bg}`, v.muted!, v[bg]!);
        check(`${id} accent on ${bg}`, v.accent!, v[bg]!);
        check(`${id} error on ${bg}`, v.error!, v[bg]!);
        check(`${id} primary-text on ${bg}`, v['primary-text']!, v[bg]!);
      }
      check(`${id} on-primary on primary`, v['on-primary']!, v.primary!);
      check(`${id} on-primary on hover`, v['on-primary']!, v['primary-hover']!);
      check(`${id} on-accent-strong on accent-strong`, v['on-accent-strong']!, v['accent-strong']!);
      check(`${id} on-badge on badge-bg`, v['on-badge']!, v['badge-bg']!);
      check(`${id} ok badge text`, '#04130b', v.ok!);
      check(`${id} tab text on tab bar`, mode === 'light' ? v['tab-active-fg']! : v.muted!, v['tabbar-bg']!);
      if (mode === 'light') {
        check(`${id} header text`, v['header-fg']!, v['header-bg']!);
        check(`${id} header muted`, v['header-muted']!, v['header-bg']!);
      } else {
        check(`${id} active tab text`, v['tab-active-fg']!, v['tab-active-bg']!);
        check(`${id} header text on bg`, v['header-fg']!, v.bg!);
      }
      check(`${id} bar fill on track`, v['bar-fill']!, v['bar-track']!, 3);
      check(`${id} primary on surface (shape)`, v.primary!, v.surface!, mode === 'dark' ? 3 : 1);
    }
    expect(failures).toEqual([]);
  });

  it('give each club a recognizable look (main color is used for the header or the buttons)', () => {
    for (const club of CLUBS) {
      const light = buildClubTheme(club, 'light');
      expect(light.vars['header-bg']).toBe(club.colors[0]);
      expect(light.colorScheme).toBe('light');
      expect(buildClubTheme(club, 'dark').colorScheme).toBe('dark');
    }
  });
});

describe('theme registry and choice', () => {
  it('lists general and club designs with unique ids', async () => {
    const { THEMES, BASE_THEMES, CLUB_THEMES, isThemeId, isClubTheme, resolveTheme } = await import('../src/themes');
    expect(THEMES).toHaveLength(BASE_THEMES.length + CLUB_THEMES.length);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    expect(CLUB_THEMES.every((t) => isClubTheme(t.id) && /^club-[a-z]+$/.test(t.id))).toBe(true);
    expect(isThemeId('club-bayern')).toBe(true);
    expect(isThemeId('club-gibtsnicht')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
    // own choice beats the club's default, which beats the app's default
    expect(resolveTheme('ticket', 'club-bayern')).toBe('ticket');
    expect(resolveTheme(null, 'club-bayern')).toBe('club-bayern');
    expect(resolveTheme(null, '')).toBe('nacht');
  });

  it('has a stylesheet for every general design', async () => {
    const { BASE_THEMES } = await import('../src/themes');
    const css = ['nacht', 'klassisch', 'clean', 'ticket'].map((n) => readFileSync(`src/themes/${n}.css`, 'utf8')).join('\n');
    for (const t of BASE_THEMES) expect(css, t.id).toContain(`data-theme='${t.id}'`);
  });
});
