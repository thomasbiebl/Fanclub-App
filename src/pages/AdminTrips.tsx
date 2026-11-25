import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PhaseBadge, StatusBadge, fmtDate } from '../components/ui';
import type { TripInput } from '../data/DataService';
import { TRIP_MESSAGE_MAX, tripMessageRecipients } from '../domain/notifications';
import { byTrip, confirmedCount, addWeeks, copyWeeks, getTripPhase, pastTripCount } from '../domain/rules';
import type { Settings, Trip } from '../domain/types';
import { scrollToTop } from '../lib/scroll';
import { useApp } from '../state/AppContext';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface FormState { title: string; departure: string; meetingPoint: string; price: string; seats: string; kickoff: string; returnTime: string; notes: string; stops: string; buses: string; points: string }

const emptyForm = (s: Settings): FormState => {
  const d = new Date(Date.now() + 14 * 86_400_000);
  d.setHours(8, 0, 0, 0);
  return { title: '', departure: toLocalInput(d.toISOString()), meetingPoint: s.defaultMeetingPoint, price: String(s.defaultPrice), seats: String(s.defaultSeats), kickoff: '', returnTime: '', notes: '', stops: '', buses: '1', points: '1' };
};

const formFromTrip = (t: Trip, weeks = 0): FormState => {
  const shift = (iso?: string) => (iso ? toLocalInput(addWeeks(iso, weeks)) : '');
  return { title: t.title, departure: shift(t.departure), meetingPoint: t.meetingPoint, price: String(t.price), seats: String(t.seats), kickoff: shift(t.kickoff), returnTime: shift(t.returnTime), notes: t.notes, stops: t.stops.join('\n'), buses: String(t.buses), points: String(t.points) };
};

type Editing = { mode: 'new' } | { mode: 'edit'; trip: Trip } | { mode: 'copy'; trip: Trip };

function TripForm({ heading, initial, onSubmit, onCancel }: { heading: string; initial: FormState; onSubmit: (i: TripInput) => void; onCancel: () => void }) {
  const [f, setF] = useState(initial);
  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: f.title.trim(),
      departure: new Date(f.departure).toISOString(),
      meetingPoint: f.meetingPoint.trim(),
      price: Math.max(0, Number(f.price) || 0),
      seats: Math.floor(Number(f.seats) || 0),
      kickoff: f.kickoff ? new Date(f.kickoff).toISOString() : undefined,
      returnTime: f.returnTime ? new Date(f.returnTime).toISOString() : undefined,
      notes: f.notes.trim(),
      stops: [...new Set(f.stops.split('\n').map((x) => x.trim()).filter(Boolean))],
      buses: Math.floor(Number(f.buses) || 1),
      points: Math.floor(Number(f.points)),
    });
  };
  return (
    <form className="card form" onSubmit={submit}>
      <h3>{heading}</h3>
      <label htmlFor="t-title">Titel</label>
      <input id="t-title" required placeholder="z. B. Augsburg (A)" value={f.title} onChange={set('title')} />
      <label htmlFor="t-dep">Abfahrt</label>
      <input id="t-dep" type="datetime-local" required value={f.departure} onChange={set('departure')} />
      <label htmlFor="t-meet">Treffpunkt</label>
      <input id="t-meet" required value={f.meetingPoint} onChange={set('meetingPoint')} />
      <div className="row">
        <div className="grow">
          <label htmlFor="t-price">Preis (€)</label>
          <input id="t-price" type="number" min={0} step="0.5" required value={f.price} onChange={set('price')} />
        </div>
        <div className="grow">
          <label htmlFor="t-seats">Plätze</label>
          <input id="t-seats" type="number" min={1} required value={f.seats} onChange={set('seats')} />
        </div>
      </div>
      <label htmlFor="t-kick">Anstoß (optional)</label>
      <input id="t-kick" type="datetime-local" value={f.kickoff} onChange={set('kickoff')} />
      <label htmlFor="t-ret">Rückfahrt (optional)</label>
      <input id="t-ret" type="datetime-local" value={f.returnTime} onChange={set('returnTime')} />
      <div className="row">
        <div className="grow">
          <label htmlFor="t-buses">Busse</label>
          <input id="t-buses" type="number" min={1} max={10} required value={f.buses} onChange={set('buses')} />
        </div>
        <div className="grow">
          <label htmlFor="t-points">Punkte für die Rangfolge</label>
          <input id="t-points" type="number" min={0} max={10} required value={f.points} onChange={set('points')} />
        </div>
      </div>
      <label htmlFor="t-stops">Zustiegsstellen (eine pro Zeile, optional)</label>
      <textarea id="t-stops" rows={3} placeholder={'Parkplatz Stadion\nBahnhof Nord'} value={f.stops} onChange={set('stops')} />
      <label htmlFor="t-notes">Hinweise für Mitfahrer (optional)</label>
      <textarea id="t-notes" rows={3} value={f.notes} onChange={set('notes')} />
      <button className="btn">Speichern</button>
      <button type="button" className="btn ghost" onClick={onCancel}>Abbrechen</button>
    </form>
  );
}

export function AdminTrips() {
  const { snap, now, act, data, notify } = useApp();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [everyone, setEveryone] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  if (!snap) return null;

  const save = async (id: string | null, input: TripInput) => {
    if (await act(() => data.saveTrip(id, input), id ? 'Fahrt gespeichert.' : `Fahrt erstellt. Mitglieder haben ${snap.settings.interestDays === 1 ? '1 Tag' : `${snap.settings.interestDays} Tage`} Vorlauf.`)) setEditing(null);
  };

  const trips = [...snap.trips].sort((a, b) => b.departure.localeCompare(a.departure));
  const users = new Map(snap.users.map((u) => [u.id, u]));

  return (
    <>
      <h1 className="title">Fahrten</h1>
      {editing ? (
        <TripForm
          key={editing.mode === 'new' ? 'new' : `${editing.mode}-${editing.trip.id}`}
          heading={editing.mode === 'new' ? 'Neue Fahrt' : editing.mode === 'edit' ? 'Fahrt bearbeiten' : `Kopie von ${editing.trip.title}`}
          initial={editing.mode === 'new' ? emptyForm(snap.settings) : editing.mode === 'edit' ? formFromTrip(editing.trip) : formFromTrip(editing.trip, copyWeeks(editing.trip.departure, now))}
          onSubmit={(i) => void save(editing.mode === 'edit' ? editing.trip.id : null, i)}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button className="btn" onClick={() => setEditing({ mode: 'new' })}>+ Neue Fahrt</button>
      )}

      <div className="stack list cards">
        {trips.map((t) => {
          const phase = getTripPhase(t, now);
          const list = byTrip(snap.bookings, t.id);
          const isOpen = open === t.id;
          return (
            <section key={t.id} className="card">
              <div className="row between">
                <PhaseBadge phase={phase} />
                <span className="muted">{confirmedCount(snap.bookings, t.id)} / {t.seats} bestätigt</span>
              </div>
              <h3>{t.title}</h3>
              <div className="muted">{fmtDate(t.departure)} · {list.filter((b) => b.status === 'interested').length} Interessenten · {list.filter((b) => b.status === 'waitlist').length} Warteliste</div>
              <div className="chips">
                <button className="chip" onClick={() => setOpen(isOpen ? null : t.id)}>{isOpen ? 'Teilnehmer ausblenden' : 'Teilnehmer'}</button>
                <Link className="chip" to={`/admin/trips/${t.id}/list`}>Liste &amp; Kasse</Link>
                <button className="chip" onClick={() => setEditing({ mode: 'edit', trip: t })}>Bearbeiten</button>
                <button className="chip" onClick={() => { setEditing({ mode: 'copy', trip: t }); scrollToTop(); }}>Kopieren</button>
                <button className="chip" onClick={() => { setMessageId(messageId === t.id ? null : t.id); setMessage(''); setEveryone(false); }}>Nachricht an Mitfahrer</button>
                {phase === 'interest' && <button className="chip" onClick={() => void act(() => data.endInterestNow(t.id), 'Plätze vergeben.')}>Interessensphase beenden</button>}
                {(phase === 'interest' || phase === 'open') && <button className="chip" onClick={() => { setCancelId(cancelId === t.id ? null : t.id); setReason(''); }}>Fahrt absagen</button>}
                {confirmId === t.id ? (
                  <>
                    <button className="chip danger" onClick={() => { setConfirmId(null); void act(() => data.deleteTrip(t.id), 'Fahrt gelöscht.'); }}>Wirklich löschen</button>
                    <button className="chip" onClick={() => setConfirmId(null)}>Abbrechen</button>
                  </>
                ) : (
                  <button className="chip" onClick={() => setConfirmId(t.id)}>Löschen</button>
                )}
              </div>
              {messageId === t.id && (() => {
                const count = tripMessageRecipients(snap.bookings, t.id, everyone).length;
                const send = async () => {
                  const res = await data.messageTrip(t.id, message, everyone);
                  if (!res.ok) return notify(res.error);
                  setMessageId(null);
                  await act(async () => ({ ok: true }), `Nachricht an ${res.sent} ${res.sent === 1 ? 'Person' : 'Personen'} geschickt.`);
                };
                return (
                  <div className="form">
                    <label htmlFor={`m-${t.id}`}>Nachricht (kommt als Mitteilung „Info zur Fahrt“, auf Wunsch auch per Mail)</label>
                    <textarea id={`m-${t.id}`} rows={3} maxLength={TRIP_MESSAGE_MAX} placeholder="z. B. Der Bus steht heute am Hintereingang." value={message} onChange={(e) => setMessage(e.target.value)} />
                    <label className="check" htmlFor={`m-all-${t.id}`}>
                      <input id={`m-all-${t.id}`} type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} />
                      Auch an Warteliste und Interessenten
                    </label>
                    <p className="muted">Geht an {count} {count === 1 ? 'Person' : 'Personen'}.</p>
                    <div className="chips">
                      <button className="chip danger" disabled={count === 0 || !message.trim()} onClick={() => void send()}>Nachricht senden</button>
                      <button className="chip" onClick={() => setMessageId(null)}>Abbrechen</button>
                    </div>
                  </div>
                );
              })()}
              {cancelId === t.id && (
                <div className="form">
                  <label htmlFor={`c-${t.id}`}>Grund der Absage (optional, sehen alle)</label>
                  <input id={`c-${t.id}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="chips">
                    <button className="chip danger" onClick={() => { setCancelId(null); void act(() => data.cancelTrip(t.id, reason), 'Fahrt abgesagt.'); }}>Fahrt jetzt absagen</button>
                    <button className="chip" onClick={() => setCancelId(null)}>Abbrechen</button>
                  </div>
                </div>
              )}
              {isOpen && (
                <ul className="people">
                  {list.length === 0 && <li className="muted">Noch keine Einträge.</li>}
                  {[...list]
                    .sort((a, b) => a.status.localeCompare(b.status) || a.createdAt.localeCompare(b.createdAt))
                    .map((b) => {
                      const u = users.get(b.userId);
                      return (
                        <li key={b.id}>
                          <span>
                            {u?.name ?? 'Unbekannt'}
                            <small className="muted">
                              {' '}· {u ? pastTripCount(u, snap.trips, snap.bookings, now) : 0} Fahrten{u && !u.isMember ? ' · Gast' : ''}
                              {b.companions > 0 ? ` · +${b.companions}${b.companionNames ? ` (${b.companionNames})` : ''}` : ''}
                              {b.stop ? ` · ${b.stop}` : ''}
                            </small>
                          </span>
                          <span className="chips">
                            {b.status === 'confirmed' && t.buses > 1 && (
                              <select
                                aria-label={`Bus für ${u?.name ?? 'Buchung'}`}
                                value={b.bus ?? ''}
                                onChange={(e) => void act(() => data.setBookingBus(b.id, e.target.value ? Number(e.target.value) : null))}
                              >
                                <option value="">Bus?</option>
                                {Array.from({ length: t.buses }, (_, i) => <option key={i + 1} value={i + 1}>Bus {i + 1}</option>)}
                              </select>
                            )}
                            <StatusBadge status={b.status} />
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <Link className="muted center" to="/admin">‹ Admin-Übersicht</Link>
    </>
  );
}
