import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../state/AppContext';
import { buildClubTheme } from './clubTheme';
import { DEFAULT_THEME, clubOf, findTheme, isThemeId, resolveTheme } from './index';

export type ThemeMode = 'auto' | 'light' | 'dark';

const KEY = 'fanclub.theme';
const MODE_KEY = 'fanclub.themeMode';
const CLUB_DEFAULT_KEY = 'fanclub.defaultTheme';

interface ThemeCtx {
  /** The design in use right now. */
  theme: string;
  /** What this person picked, or null when they use the club's default. */
  choice: string | null;
  /** The default design the club's admin set (empty = none). */
  clubDefault: string;
  /** Pass null to go back to the club's default. */
  setTheme: (id: string | null) => void;
  /** Light or dark for club designs: follow the phone, or force one. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: DEFAULT_THEME, choice: null, clubDefault: '', setTheme: () => {}, mode: 'auto', setMode: () => {} });
export const useTheme = () => useContext(Ctx);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
const storedChoice = () => {
  const id = read(KEY);
  return isThemeId(id) ? id : null;
};
const storedDefault = () => {
  const id = read(CLUB_DEFAULT_KEY);
  return isThemeId(id) ? id : '';
};
const storedMode = (): ThemeMode => {
  const m = read(MODE_KEY);
  return m === 'light' || m === 'dark' ? m : 'auto';
};
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;

/** Applies the chosen design: a CSS theme by name, or generated colors for a club. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { snap } = useApp();
  const [choice, setChoice] = useState<string | null>(storedChoice);
  const [clubDefault, setClubDefault] = useState<string>(storedDefault);
  const [mode, setModeState] = useState<ThemeMode>(storedMode);
  const [dark, setDark] = useState<boolean>(systemDark);
  const applied = useRef<string[]>([]);

  // The club's default arrives with the settings. It is remembered so the next start has no flash.
  const settingsDefault = snap?.settings.defaultTheme;
  useEffect(() => {
    if (settingsDefault === undefined) return;
    const id = isThemeId(settingsDefault) ? settingsDefault : '';
    setClubDefault(id);
    write(CLUB_DEFAULT_KEY, id || null);
  }, [settingsDefault]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const onChange = () => setDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = resolveTheme(choice, clubDefault);
  const useDark = mode === 'auto' ? dark : mode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    for (const name of applied.current) root.style.removeProperty(name);
    applied.current = [];
    root.dataset.theme = theme;
    const club = clubOf(theme);
    let bar = findTheme(theme)?.barColor;
    if (club) {
      const generated = buildClubTheme(club, useDark ? 'dark' : 'light');
      for (const [name, value] of Object.entries(generated.vars)) {
        root.style.setProperty(`--${name}`, value);
        applied.current.push(`--${name}`);
      }
      root.style.setProperty('color-scheme', generated.colorScheme);
      applied.current.push('color-scheme');
      bar = generated.barColor;
    }
    if (bar) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar);
  }, [theme, useDark]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      choice,
      clubDefault,
      setTheme: (id) => {
        setChoice(id);
        write(KEY, id);
      },
      mode,
      setMode: (next) => {
        setModeState(next);
        write(MODE_KEY, next === 'auto' ? null : next);
      },
    }),
    [theme, choice, clubDefault, mode],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
