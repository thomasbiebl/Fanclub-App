# Offene Punkte

Stand: 24. November 2026. Die Anleitungen zu jedem Punkt stehen in [SUPABASE.md](SUPABASE.md).

## Erledigt

- [x] Supabase-Projekt **Fanclub-App** angelegt (Frankfurt, kostenlos, Projekt-ID `jzzkihubammmbjlfvxiz`)
- [x] Migrationen `0001` bis `0009` eingespielt, automatische Platzvergabe (`pg_cron`) läuft alle 5 Minuten
- [x] GitHub-Variablen `SUPABASE_URL` und `SUPABASE_ANON_KEY` gesetzt, App läuft mit Supabase
- [x] Anmeldung mit Bestätigungsmail über Brevo (SMTP)
- [x] Erster Admin angelegt
- [x] PC-Ansicht und Demo-Modus (`?demo`) online

## Offen

- [ ] **Site URL in Supabase prüfen.** Unter *Authentication → URL Configuration* sollte die Site URL `https://www.thomasbiebl.de/Fanclub-App/` sein. Unter *Redirect URLs* zusätzlich `https://thomasbiebl.github.io/Fanclub-App/` und `http://localhost:5173/` eintragen. Die App läuft unter der eigenen Domain, `thomasbiebl.github.io` leitet nur dorthin weiter.
- [ ] **Backup einrichten** (SUPABASE.md, Schritt 6). In GitHub die Secrets `SUPABASE_DB_URL` (Verbindung „Session pooler“ mit Datenbank-Passwort) und `BACKUP_PASSPHRASE` anlegen. Der kostenlose Tarif hat sonst keine Sicherung.
- [ ] **E-Mail-Benachrichtigungen** (SUPABASE.md, Schritt 7). Edge Function `notify-email` bereitstellen, Secrets setzen (`BREVO_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME`, `APP_URL=https://www.thomasbiebl.de/Fanclub-App/`, `WEBHOOK_SECRET`) und den Webhook auf die Tabelle `notifications` anlegen. Danach mit einer abgesagten Fahrt testen.
- [ ] **Datenschutz.** Impressum und Datenschutzerklärung erstellen, den Auftragsverarbeitungsvertrag in Supabase abschließen (*Organization Settings → Legal*). Muss vor dem Start mit echten Mitgliedern erledigt sein.
- [ ] **Kleine Sicherheits-Nachbesserung** (Migration `0010`). Die Sicherheitsprüfung von Supabase meldet zwei Kleinigkeiten:
  - Interne Hilfsfunktionen (z. B. `trips_audit`, `news_after_insert`) sind ohne Anmeldung aufrufbar. Sie brechen dann zwar nur ab, die Rechte sollten trotzdem entzogen werden.
  - Bei der Funktion `fmt_departure` fehlt `search_path`.
  Danach die Sicherheitsprüfung erneut laufen lassen.
- [ ] **Mitglieder aufnehmen.** Mitgliederliste unter *Admin → Mitgliederliste importieren* einfügen oder unter *Admin → Einstellungen* einen Mitgliedscode festlegen.
- [ ] **Vereinsdesigns prüfen.** Auf dem Branch `ccr-b02d1229-m24ee1` liegen Designs für die 1. und 2. Bundesliga, die noch nicht in `master` sind. Entscheiden, ob sie übernommen werden.
