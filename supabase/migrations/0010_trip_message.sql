-- Stufe 10: Admins schreiben den Mitfahrern einer Fahrt eine Nachricht (Mitteilung in der App, auf Wunsch per Mail).

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('allocated', 'waitlisted', 'promoted', 'trip_cancelled', 'new_trip', 'news', 'booking_removed', 'trip_message'));

-- Schickt die Nachricht an alle mit bestätigtem Platz, mit p_everyone auch an Warteliste und Interessenten.
-- Gibt zurück, wie viele Personen sie bekommen haben.
create function public.admin_message_trip(p_trip uuid, p_body text, p_everyone boolean) returns integer
language plpgsql security definer set search_path = public as $$
declare t public.trips; msg text := trim(coalesce(p_body, '')); n integer;
begin
  if not public.is_admin() then raise exception 'Nur für Admins.'; end if;
  if msg = '' then raise exception 'Bitte eine Nachricht eingeben.'; end if;
  if length(msg) > 1000 then raise exception 'Die Nachricht ist zu lang (höchstens 1000 Zeichen).'; end if;
  select * into t from public.trips where id = p_trip;
  if not found then raise exception 'Fahrt nicht gefunden.'; end if;

  insert into public.notifications (user_id, type, title, body, trip_id)
  select b.user_id, 'trip_message', 'Info zur Fahrt: ' || t.title, msg, t.id
    from public.bookings b
   where b.trip_id = p_trip and (b.status = 'confirmed' or coalesce(p_everyone, false));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Bei dieser Fahrt gibt es niemanden, der die Nachricht bekommen würde.'; end if;

  perform public.log_event('trip_message', t.title || ': an ' || n || case when n = 1 then ' Person' else ' Personen' end);
  return n;
end;
$$;

revoke execute on function public.admin_message_trip(uuid, text, boolean) from public, anon;
grant execute on function public.admin_message_trip(uuid, text, boolean) to authenticated;
