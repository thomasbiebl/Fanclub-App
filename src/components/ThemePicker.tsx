import { BASE_THEMES, CLUB_THEMES } from '../themes';

/** One list with all designs: the general ones first, then the clubs by league. */
export function ThemeSelect({ id, value, onChange, emptyLabel }: { id: string; value: string; onChange: (id: string) => void; emptyLabel: string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{emptyLabel}</option>
      <optgroup label="Allgemein">
        {BASE_THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </optgroup>
      {(['1. Bundesliga', '2. Bundesliga'] as const).map((group) => (
        <optgroup key={group} label={group}>
          {CLUB_THEMES.filter((t) => t.group === group).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
