import { useEffect, useState } from 'react';
import { RecoveryButtons } from './RecoveryButtons';

/**
 * Grey placeholders in the shape of the trip list while the data loads, so the app does not look
 * empty on a slow connection. After a while it offers a way out.
 */
export function Loading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="shell skeleton" aria-busy="true">
      <main className="page">
        <p className="sr-only" role="status">Lädt …</p>
        <i className="sk sk-line" aria-hidden="true" />
        <i className="sk sk-title" aria-hidden="true" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="card sk-card" aria-hidden="true">
            <i className="sk sk-badge" />
            <i className="sk sk-text" />
            <i className="sk sk-line" />
            <i className="sk sk-bar" />
          </div>
        ))}
        {slow && (
          <>
            <p className="muted center">Das dauert ungewöhnlich lange. Prüfe deine Internetverbindung oder probiere:</p>
            <RecoveryButtons />
          </>
        )}
      </main>
    </div>
  );
}
