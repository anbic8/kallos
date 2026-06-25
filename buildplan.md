# JudoApp -- Buildplan

## Vision

Eine Web-App (PWA, mobilfreundlich) fuer Judoka und Trainer.
Schwerpunkt: Kampf-Statistiken, Technik-Analyse, Coaching und Scouting.
Laeuft als Docker-Compose-Stack. Ein Verein, Deutsch.

---

## Datenbankschema (Gesamtuebersicht)

Farb-Konvention: WEISS = erstgenannt, BLAU = zweitgenannt (lokale Wettkampfpraxis)

```
users
  id, email, password_hash, rolle (admin | trainer | athlet), created_at

vereine
  id, name, ort, verband, logo_url

kaempfer
  id
  user_id           FK -> users (nullable -- kein Login = rein externer Kaempfer)
  verein_id         FK -> vereine (nullable -- null wenn Verein unbekannt)
  vorname, nachname, geburtsjahr, geschlecht
  aktueller_guertel (weiss | gelb | orange | gruen | blau | braun | schwarz | dan2 | ...)
  foto_url          (Profilfoto, optional)
  notizen
  HINWEIS: "intern" = verein_id zeigt auf unseren Verein
           "extern" = verein_id null oder anderer Verein
           Kein is_extern-Flag -- wird aus verein_id abgeleitet

gewichtsklassen
  id, bezeichnung (z.B. "U66", "ueber 100"), max_kg
  geschlecht, altersklasse (U15 | U18 | U21 | Senior)

veranstaltungen
  id, name
  typ               (liga | turnier | meisterschaft | kampftag | pokal | sonstiges)
  datum, ort, veranstalter, notizen
  parent_liga_id    FK -> veranstaltungen (nullable, Selbstreferenz)
  HINWEIS: Liga-Saison:  typ=liga,     parent_liga_id=null
           Kampftag:     typ=kampftag, parent_liga_id -> Liga-Saison
           Turnier:      typ=turnier,  parent_liga_id=null
           Ligatabelle wird aus allen Mannschaftskaempfen berechnet,
           deren Veranstaltung.parent_liga_id auf diese Liga-Saison zeigt

techniken
  id, name (z.B. "Seoi-nage", "Uchi-mata", "Osae-komi")
  kategorie (nage-waza | katame-waza | atemi-waza | sonstiges)
  HINWEIS: Gokyo-Katalog als Seed vorbefuellt
           Freitext-Option bei Ersteingabe immer zusaetzlich moeglich

kaempfe
  id
  veranstaltung_id     FK -> veranstaltungen
  kaempfer_weiss_id    FK -> kaempfer (erstgenannt, traegt weissen Guertel/Anzug)
  kaempfer_blau_id     FK -> kaempfer (zweitgenannt, traegt blauen Guertel/Anzug)
  gewichtsklasse_id    FK -> gewichtsklassen
  runde                (Vorrunde | Viertelfinale | Halbfinale | Finale | Gruppenphase | Direktkampf | ...)
  uhrzeit              (nullable -- Uhrzeit des Kampfes an dem Tag, z.B. 10:30)
  sieger               (weiss | blau | unentschieden)
  abschluss            (ippon | waza-ari | yusei-gachi | shido | hansoku-make | aufgabe | sonstiges)
  sieger_technik_id    FK -> techniken (nullable -- aus Gokyo-Katalog)
  sieger_technik_frei  (nullable -- Freitext wenn nicht im Katalog)
  kampfzeit_sek        (tatsaechliche Kampfdauer in Sekunden)
  is_scouting          (Bool -- fremde Kaempfe zur Analyse, kein eigener Athlet beteiligt)
  notizen

kampf_ereignisse
  id
  kampf_id             FK -> kaempfe
  zeitpunkt_sek        (wann im Kampf, z.B. 83 = 1:23 min)
  typ                  (ippon | waza-ari | shido | hansoku-make | golden-score | medizin | sonstiges)
  kaempfer             (weiss | blau)
  technik_id           FK -> techniken (nullable)
  technik_frei         (nullable -- Freitext)
  notiz
  HINWEIS: Ergibt die vollstaendige Kampf-Timeline
           Beispiel: "1:23 Shido Blau | 2:45 Waza-ari Weiss (Seoi-nage) | 3:00 Ippon Weiss"
           Redundanz zur sieger_technik in kaempfe ist gewollt:
           Timeline ist optional, Kampfergebnis immer Pflicht

kampf_medien
  id
  kampf_id             FK -> kaempfe
  typ                  (foto | video)
  datei_pfad           (nullable -- Upload in Docker Volume, z.B. /media/kaempfe/123/clip.mp4)
  externe_url          (nullable -- NAS-Link, YouTube o.ae.)
  timestamp_sek        (nullable -- Coaching-Markierung, Video springt zu dieser Stelle)
  beschriftung         (optional)

erfolge
  id
  kaempfer_id          FK -> kaempfer
  veranstaltung_id     FK -> veranstaltungen
  gewichtsklasse_id    FK -> gewichtsklassen
  platz                (1 | 2 | 3 | ...)
  kategorie            (einzel | mannschaft)
  foto_url             (Siegerehrungsfoto, optional)
  notizen

mannschaftskaempfe
  id
  veranstaltung_id     FK -> veranstaltungen (Kampftag, der auf Liga-Saison zeigt)
  verein_heim_id       FK -> vereine
  verein_gast_id       FK -> vereine
  siege_heim           (Anzahl gewonnener Einzel-Kaempfe durch Heim -- NICHT Ligapunkte!)
  siege_gast           (Anzahl gewonnener Einzel-Kaempfe durch Gast)
  HINWEIS: Gesamtergebnis wird automatisch aus mannschaftskampf_einzelkaempfe berechnet

mannschaftskampf_einzelkaempfe
  id
  mannschaftskampf_id  FK -> mannschaftskaempfe
  gewichtsklasse_id    FK -> gewichtsklassen (noetig auch fuer kampflos-Faelle)
  kampf_id             FK -> kaempfe (nullable -- null wenn kampflos)
  kampflos_sieger      (heim | gast | null)
  HINWEIS: Normal:    kampf_id gesetzt,  kampflos_sieger = null
           Kampflos:  kampf_id = null,   kampflos_sieger = heim oder gast
           Kampflos tritt auf wenn ein Verein in einer Gewichtsklasse keinen Kaempfer stellt

liga_eintraege
  id
  liga_id              FK -> veranstaltungen (typ=liga, die Saison selbst -- nicht Kampftag)
  verein_id            FK -> vereine
  spiele, siege, niederlagen, unentschieden
  punkte               (Liga-Tabellenpunkte, z.B. 2/1/0 -- NICHT Einzel-Kampfsiege!)
  HINWEIS: Automatisch berechnet aus allen Mannschaftskaempfen der Liga-Saison

kampfkonzept_eintraege                -- IKKZ: Individuelles Kampfkonzept
  id
  kaempfer_id          FK -> kaempfer (intern = eigener Plan, extern = Scouting-Profil vom Trainer)
  technik_id           FK -> techniken (nullable)
  technik_frei         (nullable -- Freitext wenn nicht im Katalog)
  richtung             (links | rechts | beide)
  situation            (angriff | konter | aufsetzer | ne-waza-einstieg | sonstiges)
  prioritaet           (1 = Tokui-waza/Hauptwaffe | 2 = Kombinationspartner | 3 = Variante)
  notizen
  erstellt_von         FK -> users (Trainer oder Athlet selbst)
  datum
  HINWEIS: Gilt fuer eigene Kaempfer (dokumentierter Plan) UND externe Kaempfer (Scouting-Profil)
           Wird der automatischen Kampfstruktur-Analyse gegenueberstellt:
           "Plan: Seoi-nage rechts -- tatsaechlich genutzt: 60% Uchi-mata links"

leistungstests                        -- generisch, Testtypen noch offen
  id
  kaempfer_id          FK -> kaempfer
  datum
  testtyp              (Freitext -- z.B. "Uchi-komi 30sek", "Griffkraft", "Cooper")
  messwert_zahl        (nullable -- numerischer Wert, z.B. 42)
  messwert_text        (nullable -- textueller Wert, z.B. "sehr gut")
  einheit              (nullable -- z.B. "Wdh", "kg", "m", "Punkte")
  notizen
  HINWEIS: Bewusst generisch gehalten -- konkrete Testtypen werden spaeter festgelegt
           Ermoeglicht spaetere Korrelation: Leistungstest-Ergebnis vs. Kampferfolg
```

---

## Fremdschluessel-Uebersicht (alle Referenzen)

| Tabelle | Feld | Zeigt auf |
|---|---|---|
| kaempfer | user_id | users.id |
| kaempfer | verein_id | vereine.id |
| veranstaltungen | parent_liga_id | veranstaltungen.id |
| kaempfe | veranstaltung_id | veranstaltungen.id |
| kaempfe | kaempfer_weiss_id | kaempfer.id |
| kaempfe | kaempfer_blau_id | kaempfer.id |
| kaempfe | gewichtsklasse_id | gewichtsklassen.id |
| kaempfe | sieger_technik_id | techniken.id |
| kampf_ereignisse | kampf_id | kaempfe.id |
| kampf_ereignisse | technik_id | techniken.id |
| kampf_medien | kampf_id | kaempfe.id |
| erfolge | kaempfer_id | kaempfer.id |
| erfolge | veranstaltung_id | veranstaltungen.id |
| erfolge | gewichtsklasse_id | gewichtsklassen.id |
| mannschaftskaempfe | veranstaltung_id | veranstaltungen.id |
| mannschaftskaempfe | verein_heim_id | vereine.id |
| mannschaftskaempfe | verein_gast_id | vereine.id |
| mannschaftskampf_einzelkaempfe | mannschaftskampf_id | mannschaftskaempfe.id |
| mannschaftskampf_einzelkaempfe | gewichtsklasse_id | gewichtsklassen.id |
| mannschaftskampf_einzelkaempfe | kampf_id | kaempfe.id |
| liga_eintraege | liga_id | veranstaltungen.id |
| liga_eintraege | verein_id | vereine.id |
| kampfkonzept_eintraege | kaempfer_id | kaempfer.id |
| kampfkonzept_eintraege | technik_id | techniken.id |
| kampfkonzept_eintraege | erstellt_von | users.id |
| leistungstests | kaempfer_id | kaempfer.id |

---

## Technologie-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React + Vite (PWA, mobilfreundlich) |
| Backend | FastAPI (Python) |
| Datenbank | PostgreSQL |
| DB-Admin | Adminer (Port 9002) |
| Medien | Docker Volume (Upload) + externe URLs (NAS/YouTube) |
| Auth | JWT + Rollen (athlet / trainer / admin) |
| Deployment | Docker Compose (Frontend + Backend + DB + Adminer) |
| Reverse Proxy | Externer Nginx-Container (bereits vorhanden, leitet auf Port 8002) |

---

## Infrastruktur & Ports

| Container | Intern | Extern | Beschreibung |
|---|---|---|---|
| frontend | :80 | **:8002** | React SPA + API-Proxy (Nginx im Container) |
| backend | :8000 | -- | FastAPI (nur internes Docker-Netz) |
| db | :5432 | -- | PostgreSQL (nur internes Docker-Netz) |
| adminer | :8080 | **:9002** | Datenbank-Administration |

Der vorhandene externe Nginx-Container leitet eingehende Requests an Port **8002** weiter.
Backend und Datenbank sind ausschliesslich ueber das interne Docker-Netz erreichbar -- kein direkter Zugriff von aussen.
Der Frontend-Nginx im Container proxied `/api/` und `/media/` transparent an den Backend-Container.

### Start

```bash
cp .env.example .env
# .env bearbeiten: DB_PASSWORD, SECRET_KEY, ADMIN_PASSWORD, HEIMVEREIN_NAME setzen
docker compose up -d --build
```

### Umgebungsvariablen

Pflicht (App startet ohne diese nicht):
```
DB_PASSWORD=
SECRET_KEY=       # min. 32 Zeichen, z.B.: python -c "import secrets; print(secrets.token_hex(32))"
ADMIN_PASSWORD=
```

Optional (Defaults in Klammern):
```
DB_USER=judoapp
DB_NAME=judoapp
ADMIN_EMAIL=admin@judoapp.de
HEIMVEREIN_NAME=Mein Judoverein
ALLOWED_ORIGINS=http://localhost:8002   # kommagetrennt fuer mehrere URLs
```

---

## Statistik- & Coaching-Konzept

### Statistik-Seite (pro Kaempfer, intern und extern)
- Win/Loss/Unentschieden-Quote
- Lieblingstechniken (aus kampf_ereignisse + sieger_technik)
- Ergebnisverteilung (Ippon-Rate, Shido-Quote, Golden-Score-Anteil)
- Kampf-Timeline pro Kampf (interaktiv)
- Alle verknuepften Medien, Fotos, Erfolge

Vereins-Uebersicht: alle internen Kaempfer (verein_id = unser Verein),
sortierbar nach Kaempfen, Siegen, Techniken, Guertelgrad.

### Kampfstruktur-Analyse (automatisch aus kampf_ereignisse berechnet)
Kein extra Datenbankfeld noetig -- wird on-the-fly berechnet:
- Scoring-Zeitpunkt: erzielt der Kaempfer frueh (0-60s), spaet (>120s) oder im Golden Score?
- Shido-Muster: wann und wie haeufig kommen Strafen?
- Golden-Score-Quote und Bilanz in der Verlaengerung
- Angriffs-Frequenz: Wertungsversuche pro Minute
- Technik-Erfolgsrate: Seoi-nage versucht X mal, davon Y Punkte erzielt

### IKKZ -- Individuelles Kampfkonzept
Manuell gepflegtes taktisches Profil (Tabelle: kampfkonzept_eintraege):
- Tokui-waza (Hauptwaffe) pro Richtung und Situation
- Kombinationstechniken und Konter
- Gilt fuer eigene Kaempfer (Trainingsplan) und Gegner (Scouting)

Abgleich Plan vs. Realitaet:
  IKKZ-Eintrag: "Seoi-nage rechts als Hauptwaffe"
  Kampfstruktur-Analyse: "Uchi-mata links in 60% der Scoring-Ereignisse"
  -> Coach sieht Abweichung sofort

### Leistungstests
Generische Tabelle fuer physische/technische Testergebnisse.
Spaetere Korrelation moeglich: hoehe Griffkraft-Werte -> bessere Ippon-Rate?

---

## Phase 1 -- Fundament & Auth ✓ ABGESCHLOSSEN

**Ziel:** App laeuft in Docker, Login funktioniert, Stammdaten pflegbar.

### Aufgaben
- [x] Docker Compose Setup: PostgreSQL, FastAPI, React/Nginx
- [x] Datenbankschema anlegen (Migrations mit Alembic)
- [x] Tabellen: `users`, `vereine`, `kaempfer`, `gewichtsklassen`, `techniken` (mit Gokyo-Seed)
- [x] Auth-Endpoints: Register, Login, JWT-Token, Rollen
- [x] Frontend: Login-Screen, Navigation, Dashboard-Skeleton
- [x] Kaempfer-Profil: anlegen, bearbeiten, Guertelgrad setzen, Profilfoto hochladen
- [x] Vereins-Kaempfer-Uebersicht (nur interne Kaempfer mit verein_id = unser Verein)

### Verifikation
- [x] Du und dein Sohn koennt euch einloggen (eigene Accounts, eigene Profile)
- [x] Kaempfer-Profile mit aktuellem Guertelgrad und Foto angelegt
- [x] Trainer-Account sieht alle internen Kaempfer, Athlet-Account nur das eigene Profil
- [x] App erreichbar und bedienbar im Handy-Browser

---

## Phase 2 -- Kampf-Erfassung & Timeline

**Ziel:** Kaempfe erfassen mit vollstaendiger Timeline, erste Statistiken sehen.

### Aufgaben
- [ ] Tabellen: `veranstaltungen`, `kaempfe`, `kampf_ereignisse`
- [ ] Veranstaltungen anlegen (Name, Typ, Datum, Ort)
- [ ] Kampf erfassen:
  - Gegner (extern anlegen oder aus Kaempfer-Datenbank waehlen)
  - Weiss/Blau-Zuweisung (wer ist erstgenannt?)
  - Veranstaltung, Gewichtsklasse, Runde, Uhrzeit
  - Ergebnis: Sieger (weiss/blau), Abschlussart, Technik (Dropdown Gokyo + Freitext), Kampfzeit
- [ ] Kampf-Ereignisse erfassen (Timeline):
  - Zeitpunkt, Ereignistyp (Wertung/Strafe), Kaempfer (weiss/blau), Technik
  - Darstellung als chronologische Zeitleiste auf der Kampf-Detailseite
- [ ] Kampf-Detailseite: alle Infos + Timeline auf einen Blick
- [ ] Statistik pro Kaempfer: Win/Loss, Technik-Verteilung, Ergebnis-Typen
- [ ] Filter: nach Gewichtsklasse, Veranstaltungstyp, Zeitraum

### Verifikation
- [ ] Kampf mit Weiss/Blau und Ereignis-Timeline erfassen -> Timeline sichtbar auf Detailseite
- [ ] Technik per Dropdown oder Freitext waehlbar
- [ ] Statistik-Seite zeigt Win-Rate und Lieblingstechniken
- [ ] Turnier mit mehreren Runden vollstaendig abbildbar

---

## Phase 3 -- Medien & Erfolge

**Ziel:** Kaempfe mit Fotos/Videos verknuepfen, Erfolge festhalten.

### Aufgaben
- [ ] Tabellen: `kampf_medien`, `erfolge`
- [ ] Foto/Video-Upload in Docker Volume (Dateigroessen-Limit per Umgebungsvariable)
- [ ] Alternativ: externe URL / NAS-Pfad hinterlegen
- [ ] Medien-Galerie pro Kampf (Fotos + Video-Player)
- [ ] Video-Player mit klickbaren Timestamp-Markierungen (Coaching-Kommentare)
  - Timeline -> Video: benoetigt kampf_start_sek auf kampf_medien
    (zeitpunkt_sek im Kampf != Position im Video -- eigener Offset-Wert noetig, Phase 6)
- [ ] Erfolge eintragen: Platz, Veranstaltung, Gewichtsklasse, Siegerehrungsfoto
- [ ] Erfolgs-Uebersicht pro Kaempfer (Pokale-Seite)

### Verifikation
- [ ] Kampf hat Foto/Video -> oeffnet sich direkt im Browser
- [ ] Coaching-Timestamp gesetzt -> Video springt zur richtigen Stelle
- [ ] Siegerehrungsfoto auf Erfolgs-Seite sichtbar
- [ ] Upload und externe URL beide funktionsfaehig

---

## Phase 4 -- Mannschaftskaempfe & Liga ✓ ABGESCHLOSSEN

**Ziel:** Teamkaempfe vollstaendig abbilden inkl. Kampflos, Ligatabelle automatisch berechnen.

### Aufgaben
- [x] Tabellen: `mannschaftskaempfe`, `mannschaftskampf_einzelkaempfe` (liga_eintraege on-the-fly berechnet)
- [x] Liga-Saison als Veranstaltung anlegen (typ=liga)
- [x] Kampftag als Unter-Veranstaltung anlegen (typ=kampftag, parent_liga_id -> Liga-Saison)
- [x] Mannschaftskampf erfassen: Heim/Gast-Verein, Kampftag, Einzel-Kaempfe pro Gewichtsklasse
- [x] Kampflos erfassen: Gewichtsklasse ohne Kaempfer -> Punkt geht automatisch an Gegner
- [x] Mannschafts-Ergebnis automatisch aus Einzel-Kaempfen berechnet ODER direkt eintragbar
- [x] Liga-Tabelle automatisch aus allen Mannschaftskaempfen der Saison berechnen (2/1/0 Punkte)
- [x] Ansicht: Ligatabelle, Kampftage-Uebersicht, einzelne Begegnung mit Einzel-Kaempfen

### Verifikation
- [x] Liga-Saison mit zwei Kampftagen -> Tabelle korrekt
- [x] Kampflos -> Punkt korrekt vergeben
- [x] Mannschafts-Gesamtergebnis stimmt (berechnet oder direkt eingetragen)
- [x] Einzelkaempfe eines Mannschaftskampfs einsehbar mit Timeline

---

## Phase 5 -- Coaching, IKKZ & Scouting ✓ ABGESCHLOSSEN

**Ziel:** Trainer analysiert alle Athleten, pflegt Kampfkonzepte, wertet fremde Kaempfe aus.

### Aufgaben
- [x] Tabellen: `kampfkonzept_eintraege`, `leistungstests`
- [x] Trainer-Dashboard: alle Vereins-Athleten mit Schnellzugriff (Profil, Statistik, IKKZ)
- [x] Kampfstruktur-Analyse pro Kaempfer (berechnet aus kampf_ereignisse):
  - Scoring-Zeitpunkt-Verteilung (frueh 0-60s / mitte 61-120s / spaet / Golden Score)
  - Shido-Muster (erhalten), Golden-Score-Bilanz
- [x] IKKZ-Pflege: Kampfkonzept pro Kaempfer eintragen
  - Technik, Richtung (links/rechts), Situation, Prioritaet (Tokui-waza / Kombination / Variante)
  - Abgleich-Ansicht: IKKZ-Plan vs. tatsaechliche Siegtechniken
- [x] Gegner-Profile: externe Kaempfer mit IKKZ aus Scouting (/scouting Seite)
- [x] Scouting-Kaempfe: Kaempfe mit is_scouting=true, gefiltert auf /scouting Seite
- [x] Athleten-Vergleich: zwei Kaempfer gegenueberstellen (/vergleich Seite)
  - Statistiken, Kampfstruktur-Analyse, Ergebnistypen, Techniken
- [x] Leistungstests eintragen und Verlauf pro Kaempfer visualisieren (Balkendiagramm + Trend)
- [x] Coaching-Video-Kommentare mit Timestamp (Phase 3 vorhanden)
- [ ] PDF-Export: Wettkampf-Vorbereitungszettel -- VERSCHOBEN (benoetigt externe Library wie reportlab)

### Verifikation
- [x] Kampfstruktur-Analyse zeigt korrekte Zeitverteilung aus erfassten Ereignissen
- [x] IKKZ-Eintrag fuer eigenen Kaempfer und Gegner pflegbar
- [x] Abgleich-Ansicht zeigt tatsaechliche Siegtechniken neben IKKZ-Plan
- [x] Leistungstest eintragen -> Verlaufsdiagramm sichtbar
- [ ] PDF-Export -- verschoben auf Phase 6/spaeter

---

## Phase 6 -- Rangliste, PWA & Backup ✓ ABGESCHLOSSEN

**Ziel:** App poliert und bereit fuer den Vereinseinsatz.

### Aufgaben
- [x] Vereinsinterne Rangliste (konfigurierbar: Siege, Siegquote, Ippons, Turniersiege, Erfolge-Punkte)
- [x] Guertel-Uebersicht aller Vereinskaempfer (nach Guertelgrad gruppiert)
- [x] PWA-Manifest + Service Worker (App auf Handy-Homescreen installierbar)
- [x] Admin-Panel: User anlegen, Rollen zuweisen, Kaempfer-Accounts verknuepfen
- [x] Backup-Skript: backup.sh (Datenbank-Dump + Media-Volume, behaelt letzte 10)

### Verifikation
- [x] App auf Handy-Homescreen installierbar (Manifest + Service Worker vorhanden)
- [x] Admin kann neuen User anlegen, Rolle setzen, Kaempfer-Profil verknuepfen
- [x] Backup erfolgreich: bash backup.sh /ziel-pfad
- [x] Rangliste zeigt korrekten Stand nach gewaehltem Kriterium

---

## Entschiedene Punkte

| Thema | Entscheidung |
|---|---|
| Farben im Kampf | Weiss (erstgenannt) und Blau (zweitgenannt) -- kein Rot |
| Guerteltracking | Nur aktueller Guertel am Kaempfer-Profil, keine Pruefungshistorie |
| Kaempfer-Fotos | foto_url direkt auf kaempfer, ein Profilfoto |
| Extern-Kennzeichnung | Kein Flag, wird aus verein_id abgeleitet |
| Techniken | Gokyo-Katalog als Dropdown-Seed + Freitext immer zusaetzlich moeglich |
| Medien | Upload in Docker Volume + externe URLs (NAS / YouTube) |
| Sprache | Deutsch |
| Vereine | Ein Verein (keine Mandantenfaehigkeit noetig) |
| Statistik | Pro Kaempfer (intern + extern) + Vereins-Gesamtuebersicht (nur interne) |
| Liga-Struktur | Kampftag -> parent_liga_id -> Liga-Saison; Tabelle aus Mannschaftskaempfen berechnet |
| Kampf-Timeline | Eigene Tabelle kampf_ereignisse (Zeitpunkt, Typ, Kaempfer weiss/blau, Technik) |
| Kampflos | mannschaftskampf_einzelkaempfe.kampf_id nullable + kampflos_sieger fuer Punktberechnung |
| Punkte-Trennung | siege_heim/gast = Einzel-Kampfsiege; liga_eintraege.punkte = Ligapunkte (getrennt!) |
| IKKZ | Eigene Tabelle kampfkonzept_eintraege (Technik, Richtung, Situation, Prioritaet) |
| Kampfstruktur-Analyse | Kein extra Feld -- on-the-fly aus kampf_ereignisse berechnet |
| Leistungstests | Generische Tabelle, Testtyp als Freitext -- konkrete Tests noch offen |
| Reverse Proxy | Externer Nginx-Container vorhanden -- kein eigener Nginx-Service im Compose-Stack |
| Ports | Frontend :8002 (extern), Adminer :9002 (extern), Backend und DB nur intern |
| CORS | Konfigurierbar per ALLOWED_ORIGINS -- niemals allow_origins=["*"] mit credentials |
| Admin-Passwort | Pflichtfeld ohne Default -- unsicherer Defaultwert "admin123" entfernt |
| Heimverein | Wird beim ersten Start automatisch per Seed angelegt (Name via HEIMVEREIN_NAME) |
| Foto-Upload-Limit | 50 MB pro Datei (nginx client_max_body_size + Backend-Pruefung) |
