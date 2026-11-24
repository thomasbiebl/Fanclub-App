import { demoForced } from '../config';

/** Shown on every page while `?demo` replaces the real app, so nobody mistakes demo data for real data. */
export function DemoBanner() {
  if (!demoForced) return null;
  return (
    <div className="demo-banner" role="note">
      <b>Demo-Modus:</b> Alle Daten sind erfunden und bleiben in diesem Browser.{' '}
      <a href={location.pathname}>Zur echten App</a>
    </div>
  );
}
