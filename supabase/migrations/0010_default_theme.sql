-- Stufe 10: Standard-Design des Vereins. Wer kein eigenes Design wählt, sieht dieses.
-- Die Einstellungen sind schon vor der Anmeldung lesbar, das Design gilt also auch auf der Login-Seite.

alter table public.settings
  add column default_theme text not null default ''
    check (default_theme ~ '^[a-z0-9-]{0,40}$');

-- Das Änderungsprotokoll nennt jetzt auch das Standard-Design.
create or replace function public.settings_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare changed text[] := '{}';
begin
  if new.club_name is distinct from old.club_name then changed := array_append(changed, 'Vereinsname'); end if;
  if new.interest_days is distinct from old.interest_days then changed := array_append(changed, 'Vorlauf für Mitglieder'); end if;
  if new.guests_may_book is distinct from old.guests_may_book then changed := array_append(changed, 'Gäste dürfen buchen'); end if;
  if new.waitlist_enabled is distinct from old.waitlist_enabled then changed := array_append(changed, 'Warteliste'); end if;
  if new.default_seats is distinct from old.default_seats then changed := array_append(changed, 'Standard-Plätze'); end if;
  if new.default_price is distinct from old.default_price then changed := array_append(changed, 'Standard-Preis'); end if;
  if new.default_meeting_point is distinct from old.default_meeting_point then changed := array_append(changed, 'Standard-Treffpunkt'); end if;
  if new.cancel_deadline_hours is distinct from old.cancel_deadline_hours then changed := array_append(changed, 'Stornofrist'); end if;
  if new.max_companions is distinct from old.max_companions then changed := array_append(changed, 'Begleitpersonen'); end if;
  if new.no_show_penalty is distinct from old.no_show_penalty then changed := array_append(changed, 'Abzug bei Nichterscheinen'); end if;
  if new.default_theme is distinct from old.default_theme then changed := array_append(changed, 'Standard-Design'); end if;
  if cardinality(changed) > 0 then
    perform public.log_event('settings_changed', array_to_string(changed, ', '));
  end if;
  return null;
end;
$$;
