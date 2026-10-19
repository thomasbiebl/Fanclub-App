import { CLUBS } from './clubs';

export interface ThemeInfo {
  id: string;
  label: string;
  description: string;
  /** Color of the browser/status bar (meta theme-color). */
  barColor: string;
  /** Preview swatches. */
  swatches: [string, string, string];
  group: 'Allgemein' | '1. Bundesliga' | '2. Bundesliga';
}

/**
 * General designs are CSS files (src/themes/<id>.css with a `:root[data-theme='<id>']` block that
 * defines the same tokens as nacht.css, imported in main.tsx and listed here).
 * Club designs are generated from src/themes/clubs.ts, see clubTheme.ts.
 */
export const BASE_THEMES: ThemeInfo[] = [
  { id: 'nacht', label: 'Stadion-Nacht', description: 'Dunkel mit roten Highlights', barColor: '#0B1D3A', swatches: ['#0B1D3A', '#13294d', '#DC052D'], group: 'Allgemein' },
  { id: 'klassisch', label: 'Klassisch', description: 'Hell mit rotem Header', barColor: '#DC052D', swatches: ['#F2F4F7', '#ffffff', '#DC052D'], group: 'Allgemein' },
  { id: 'clean', label: 'Clean', description: 'Viel Weiß, Rot als Akzent', barColor: '#FFFFFF', swatches: ['#ffffff', '#f4f6f9', '#DC052D'], group: 'Allgemein' },
  { id: 'ticket', label: 'Ticket', description: 'Fahrten als Tickets, Rot-Blau-Verlauf', barColor: '#DC052D', swatches: ['#DC052D', '#0066B2', '#eef1f6'], group: 'Allgemein' },
];

export const CLUB_PREFIX = 'club-';

export const CLUB_THEMES: ThemeInfo[] = CLUBS.map((c) => ({
  id: `${CLUB_PREFIX}${c.id}`,
  label: c.name,
  description: `${c.league}. Bundesliga, hell und dunkel`,
  barColor: c.colors[0],
  swatches: [c.colors[0], c.colors[1], '#ffffff'],
  group: c.league === 1 ? '1. Bundesliga' : '2. Bundesliga',
}));

export const THEMES: ThemeInfo[] = [...BASE_THEMES, ...CLUB_THEMES];

export const DEFAULT_THEME = 'nacht';

/** The design in use: the person's own choice, else the club's default, else the app's own. */
export const resolveTheme = (choice: string | null, clubDefault: string) => choice ?? (clubDefault || DEFAULT_THEME);

export const findTheme = (id: string) => THEMES.find((t) => t.id === id);
export const isThemeId = (id: unknown): id is string => typeof id === 'string' && THEMES.some((t) => t.id === id);
export const isClubTheme = (id: string) => id.startsWith(CLUB_PREFIX);
export const clubOf = (id: string) => CLUBS.find((c) => `${CLUB_PREFIX}${c.id}` === id);
