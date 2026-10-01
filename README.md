# OpenLitBase

Offene Literaturverwaltung für Studium und Forschung – die Open-Source-Alternative zu Citavi.
Titel sammeln, in Word zitieren (Standard: IEEE Deutsch), Recherche protokollieren und Suchbegriffe
in der Begriffsmatrix ordnen. In der Cloud oder selbst gehostet.

- **Web-App** mit Projekten, Literaturverzeichnis, Rechercheprotokoll, Begriffsmatrix und
  Forschungsdreisatz; Projekte lassen sich teilen.
- **Word-Add-in** für Mac, Windows und Word im Web.
- **Browser-Extension** für [Chrome, Edge, Opera](https://chromewebstore.google.com/detail/cpfmgcfcdmfglfpfeacdlkpoobblibce)
  und [Firefox](https://addons.mozilla.org/addon/openlitbase/); für Safari, iPhone und
  iPad das [Lesezeichen „Zu OpenLitBase“](#lesezeichen-für-safari-iphone-und-ipad).
- **KI-Agenten** (Claude, ChatGPT, Cursor …) greifen per [MCP](#ki-agenten-mcp) auf die Projekte zu.

Website und Anleitung: [openlitbase.de](https://openlitbase.de) · Gehostete Version:
[cloud.openlitbase.de](https://cloud.openlitbase.de)

## Quickstart

### Lokal / self-hosted (`AUTH_MODE=single`)

Am einfachsten mit dem Installer (holt das fertige Image, richtet HTTPS und das Word-Add-in ein):
`curl -fsSL https://get.openlitbase.de/install | bash` bzw. unter Windows
`irm https://get.openlitbase.de/install.ps1 | iex`. Eigener Server mit Login:
`curl -fsSL https://get.openlitbase.de/server | sudo bash`. Aus dem Quellcode:

Voraussetzung: Docker (Desktop) auf Mac, Windows oder Linux.

```bash
docker compose up --build
```

Danach läuft die App auf <https://localhost:1450>. Es gibt kein Login, ein lokaler User wird beim
ersten Start automatisch angelegt. Eine `.env` ist nicht nötig. Ist Port 1450 belegt:
`APP_PORT=3100 BASE_URL=https://localhost:3100 docker compose up --build`.

#### HTTPS lokal

Word lädt Add-ins nur über https. Deshalb erzeugt der Container beim ersten Start eine **eigene
lokale CA** und damit ein Zertifikat für `localhost` (im Volume `certs`, das Serverzertifikat
erneuert sich selbst). Das Start-Banner zeigt die Befehle, um der CA **einmal** zu vertrauen:

```bash
# macOS
curl -o /tmp/openlitbase-ca.crt http://localhost:1450/openlitbase-ca.crt
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/openlitbase-ca.crt

# Windows (PowerShell)
curl.exe -o $env:TEMP\openlitbase-ca.crt http://localhost:1450/openlitbase-ca.crt
certutil -user -addstore Root $env:TEMP\openlitbase-ca.crt
```

Danach Browser und Word neu starten. Die CA darf nur Zertifikate für die eigenen Adressen
ausstellen (Name Constraints) – mit ihrem Schlüssel lassen sich keine fremden Websites fälschen.

- **http bleibt erreichbar:** Auf demselben Port nimmt der Server auch http an. Der Browser wird
  auf https umgeleitet, API-Aufrufe (z. B. die Browser-Extension mit `http://localhost:1450`)
  laufen weiter über http.
- **Im Heimnetz** (z. B. `BASE_URL=https://192.168.1.20:1450`) gilt dasselbe, das Zertifikat
  enthält dann auch diese Adresse. Für einen Hostnamen ohne `.local` `TLS=on` setzen.
- **Ändert sich der Host in `BASE_URL`**, entsteht eine neue CA, der man erneut vertrauen muss.
- `TLS=off` schaltet das ab (nur http). Gehostet hinter einem Reverse-Proxy ist es ohnehin aus.

### Gehostet (`AUTH_MODE=multi`)

```bash
cp .env.example .env
# In .env setzen:
#   AUTH_MODE=multi
#   BASE_URL=https://lit.example.com
#   AUTH_SECRET=$(openssl rand -base64 32)
#   ADMIN_EMAILS=du@example.com
#   POSTGRES_PASSWORD=<sicheres Passwort>
#   SMTP_* für E-Mail-Verifikation
docker compose up -d --build
```

Hinter Coolify/Traefik: Der Container lauscht auf Port 1450, alle Hosts kommen aus `BASE_URL`
(daraus werden auch die Links in E-Mails gebaut – also die öffentliche HTTPS-Adresse eintragen).

**Ablauf im Modus `multi`:**

1. Registrieren (Name, E-Mail, Passwort ≥ 8 Zeichen) – nur mit E-Mail-Adressen freigegebener
   Domains, Subdomains inklusive (`student.hochschule.ch` → `hochschule.ch`). Es ist **keine Domain
   voreingestellt**: Admins (`ADMIN_EMAILS`) können sich immer registrieren und geben danach unter
   **Administration** die Institutionen frei. Bis ein Logo hochgeladen ist, zeigt die Login-Seite
   die Initialen.
2. Bestätigungslink aus der E-Mail anklicken → angemeldet.
3. „Passwort vergessen?“ schickt einen Reset-Link (1 Stunde gültig, beendet alle Sessions).
4. Einstellungen → **API-Tokens** für Browser-Extension und Word-Add-in (werden nur gehasht
   gespeichert und nur einmal angezeigt).

5. **Administration** (Sidebar, nur für `ADMIN_EMAILS`): Institutionen anlegen, bearbeiten,
   deaktivieren und löschen (nur ohne Konten), Logos hochladen (quadratisch 1:1, beliebiges Bildformat bis 5 MB, Transparenz wird weiss hinterlegt) sowie alle
   Konten einsehen (nur lesend). **Deaktivieren sperrt** Registrierung und Zugriff aller Konten
   dieser Domain sofort (Web, API-Tokens); Admins sind ausgenommen und dürfen sich auch ohne
   freigegebene Domain registrieren.

Avatare für Konten, Projekte und Institutionen ohne Logo kommen von
[DiceBear](https://www.dicebear.com) (`AVATAR_URL`, siehe unten; Seed = Konto-ID bzw. Name).

Ohne `SMTP_HOST` werden E-Mails nicht verschickt, sondern ins Log geschrieben
(`docker compose logs app`) – praktisch zum Testen.

Datenbank-Migrationen laufen bei jedem Start automatisch. Hochgeladene Dateien liegen im Volume
`uploads` (`/data/uploads`), die Datenbank im Volume `pgdata`.

**S3 und Sicherung (optional, empfohlen für gehostete Instanzen):**

- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` gesetzt → PDFs
  und Logos liegen im Bucket (AWS, Garage, MinIO …). Vorhandene Dateien aus `uploads` werden beim
  ersten Start übernommen und bleiben im Volume liegen (danach löschbar).
- `BACKUP_S3_BUCKET` gesetzt → jede Nacht um `BACKUP_HOUR` Uhr UTC ein `pg_dump` in diesen Bucket,
  Aufbewahrung `BACKUP_RETENTION_DAYS` (Standard 14). Fehlt die Sicherung der letzten 24 Stunden,
  läuft sie eine Minute nach dem Start. Wiederherstellen:
  `pg_restore --clean --if-exists -d <DATABASE_URL> litbase-<zeit>.dump`.
- Täglich werden abgelaufene Sessions (mit IP-Adresse) und verwaiste Dateien ohne Datensatz gelöscht.
- Das Start-Banner zeigt Ablage und letzte Sicherung.

**Rechtstexte (optional):** `LEGAL_IMPRINT_URL`, `LEGAL_PRIVACY_URL`, `LEGAL_TERMS_URL` erscheinen auf der
Login-Seite, im Konto-Menü und in allen E-Mails. Mit Nutzungsbedingungen oder Datenschutzerklärung muss
man bei der Registrierung zustimmen (Zeitpunkt in `user.terms_accepted_at`).

**Avatare:** kommen von DiceBear (`AVATAR_URL`, Standard `https://api.dicebear.com/10.x`, Seed =
Konto-ID bzw. Name). Wer keine Anfragen an DiceBear möchte, betreibt den DiceBear-Server selbst
(`dicebear/api`) und trägt ihn hier ein.

**Update-Prüfung:** Beim Start und täglich fragt die Instanz `https://get.openlitbase.de/version.json`
nach der neuesten Version und sendet dabei nur Version, Modus und eine zufällige Instanz-ID (keine
Inhalte, keine Personendaten; die IP wird dort nicht gespeichert). Admins sehen den Hinweis unter
Einstellungen → Version. `UPDATE_CHECK=off` schaltet die Prüfung ab.

**Konto löschen:** unter Einstellungen (Passwort nötig). Eigene Projekte, Titel und PDFs werden gelöscht;
Titel in geteilten Projekten anderer gehen an deren Besitzer:in über.

## Aufbau der Oberfläche

Alles passiert **innerhalb eines Projekts** (z. B. einer Abschlussarbeit): Titel,
Literaturverzeichnis, Rechercheprotokoll und Begriffsmatrix. Oben in der Sidebar wechselt der
**Projekt-Umschalter** zwischen Projekten und legt neue an; die Sidebar zeigt die Bereiche des
aktiven Projekts. Die fixierte Topbar zeigt den Pfad (Projekt › Seite) und rechts das Konto-Menü
(Einstellungen, Administration, Abmelden). Ein Titel kann in mehreren Projekten liegen; wird er aus
seinem letzten Projekt entfernt, wird er gelöscht.

## Funktionen

- **Titel hinzufügen:** DOI, ISBN, arXiv-ID, PMID oder URL einfügen – Typ wird erkannt, Metadaten
  kommen von doi.org/Crossref/OpenAlex, DNB/swisscovery/OpenLibrary, arXiv, PubMed bzw. den
  Metatags der Seite. Oder manuell nach Typ (Buch, Artikel, Webseite, Konferenzbeitrag, Norm,
  Abschlussarbeit) erfassen.
- **Import:** BibTeX, RIS, EndNote Tagged (.enw), CSL-JSON – getestet mit Citavi-Exporten
  (Herausgeber, Untertitel, Schlagwörter → Tags). Als **ZIP** samt Ordner `Attachments/` werden
  die verknüpften PDFs angehängt (bis 300 MB). Duplikate (gleiche DOI bzw. Titel + ISBN/Jahr)
  werden nicht doppelt angelegt, sondern um fehlende Angaben (DOI, Abstract, Tags …) ergänzt.
- **Export:** BibTeX, RIS, CSL-JSON (alle Titel oder pro Projekt).
- **Detailansicht:** Metadaten bearbeiten, Tags, Notizen, PDF-Anhänge (Anzeige im Browser),
  formatierte Vorschau in jedem Stil.
- **Literaturverzeichnis pro Projekt:** Vorschau, Kopieren (mit Formatierung), Export als DOCX,
  Markdown oder BibTeX.

### Zitierstile

Standard ist **IEEE (Deutsch)** (`packages/citation/styles/ieee-de.csl`, erzeugt aus dem
offiziellen `ieee.csl` mit `python3 packages/citation/scripts/build-ieee-de.py`). Die Ausgabe
entspricht Citavis „IEEE Editorial (German, As of 2024)“, z. B. für einen Sammelbandbeitrag:
`E. Twain und P. Singer, "Structuring your knowledge," in The art of writing (Scientific Publishing 14),
F. Frey, Hg., 2. Aufl. Sheffield: Quickpress, 2004, S. 88–170.` Mitgeliefert
sind ausserdem IEEE, APA 7, DIN 1505-2, Harvard, Chicago und **IEEE (Deutsch, Seite im
Verzeichnis)** nach verbreiteten Hochschul-Merkblättern: Im Text steht nur „[1]“, die Seite
erscheint im Verzeichnis („… 2008, S. 56.“), und derselbe Titel mit anderer Seite bekommt eine
eigene Nummer. Online-Quellen enden auf „[Online] Available: URL (Abrufdatum 18.11.2015)“.

- **Standard pro Account:** Einstellungen → Zitierstil.
- **Pro Projekt:** Projektmenü (⋯) → Zitierstil; „Account-Standard“ übernimmt die Einstellung.
- **Weitere Stile ohne Code:** `.csl`-Datei in `custom-styles/` legen (siehe
  [custom-styles/README.md](custom-styles/README.md)).

## Entwicklung

Voraussetzung: Node 22+, Docker für Postgres.

```bash
corepack enable          # stellt pnpm in der Version aus package.json bereit
pnpm install
docker compose up -d db  # nur Postgres (localhost:5432)
pnpm dev                 # API auf :1450 (http und https), Web-App auf http://localhost:5173
```

Die Web-App leitet `/api` per Vite-Proxy an die API weiter. Ist Port 1450 belegt:
`PORT=3100 pnpm dev` (API und Proxy nutzen dann beide 3100).

Multi-Modus lokal testen: in `.env` `AUTH_MODE=multi`, `AUTH_SECRET=…` und
`BASE_URL=http://localhost:5173` setzen (damit die Links in den geloggten E-Mails auf die
Vite-Web-App zeigen).

Weitere Befehle:

| Befehl | Zweck |
| --- | --- |
| `pnpm typecheck` | TypeScript-Prüfung aller Pakete |
| `pnpm build` | Web-App, Add-in und API bauen |
| `pnpm build:extension` | Browser-Extension für Chromium (Chrome, Edge, Opera …) und Firefox bauen (`apps/extension/.output`) |
| `pnpm dev:extension` | Extension mit Hot Reload in einem eigenen Chrome-Profil |
| `pnpm dev:addin` | Add-in-Taskpane mit Vite (Port 5174, HTTPS mit Dev-Zertifikat) |
| `pnpm test` | Tests (Citation-Formatter, Identifier-Parser, Suchstring-Generator, Forschungsdreisatz, Katalogtexte, Lesezeichen, Primo-Übernahme der Extension) |
| `pnpm db:generate` | Nach Schemaänderung in `apps/api/src/db/schema` eine SQL-Migration erzeugen |
| `pnpm db:migrate` | Migrationen manuell ausführen (passiert sonst beim API-Start) |

Neue shadcn-Komponenten aus `apps/web` heraus hinzufügen (`pnpm dlx shadcn@latest add <name>`),
sie landen in `packages/ui`.

## Struktur

```
apps/api          Hono-API (Drizzle, better-auth), liefert web/ und addin/ statisch aus
apps/web          Web-App (Vite, React, React Router, TanStack Query, shadcn/ui)
apps/word-addin   Word-Add-in (Office.js-Taskpane)
apps/extension    Browser-Extension (WXT, MV3): Picker, Übernehmen-Symbol, Popup
packages/shared   zod-Schemas, Typen, API-Client, UI-Texte (de.ts)
packages/ui       gemeinsame shadcn/ui-Komponenten
packages/citation citeproc-js mit Zitierstilen und Locales
```

Konventionen und Projektkarte (auch für Coding-Agenten): [docs/agents.md](docs/agents.md).

## Projektübersicht und Zusammenarbeit

- **Übersicht** (Startseite jedes Projekts): Forschungsdreisatz und Forschungsfrage, nächste Schritte,
  Kennzahlen zu Titeln, Literaturverzeichnis, Recherchen und Begriffsmatrix, zuletzt hinzugefügte Titel.
- **Forschungsdreisatz-Assistent:** In vier Schritten (Thema → Erkenntnisinteresse → Relevanz →
  Forschungsfrage) mit Satzanfängen, Tipps und Live-Vorschau entsteht „Ich untersuche …, weil ich
  herausfinden möchte, …, um …“. Die Forschungsfrage wird live geprüft (Fragezeichen, offen
  formuliert, sinnvolle Länge).
- **Projekte teilen** (nur Modus `multi`): Die Besitzerin bzw. der Besitzer lädt per E-Mail ein – mit
  Recht **Bearbeiten** oder **Lesen**, nur Adressen freigegebener Domains. Registrierte sehen das
  Projekt sofort (plus Info-Mail), alle anderen erhalten eine Einladung und sehen es nach der
  Registrierung automatisch. Geteilte Projekte tragen ein Symbol, im Projekt zeigt ein Avatar-Fächer,
  wer Zugriff hat. Mitglieder können ein Projekt verlassen.

## Rechercheprotokoll und Begriffsmatrix

- **Rechercheprotokoll** (pro Projekt, Aufbau der gängigen Vorlage): Fragestellungs-Dreisatz,
  Begriffsmatrix, **Liste der recherchierten Titel** und Bibliografie. Pro Titel füllt man *Zitation im
  Text*, *Themeneinordnung/Schlüsselbegriffe* und *Fachliche Eignung für die Fragestellung* aus –
  in der Protokollseite oder in der Titelansicht. Nummer und Dokumententyp kommen automatisch (wie im
  Literaturverzeichnis). Download als **Word** (Anhang der Arbeit) oder Markdown.
- **Begriffsmatrix** (nach gängiger Bibliotheksvorlage): Spalten = Teilthemen, Zeilen = Synonyme, Ober-,
  Unter-, verwandte, gegensätzliche Begriffe und englische Übersetzungen. Begriffe per Enter (mehrere
  mit „;“), Klick schaltet die Trunkierung (`*`). Der **Suchstring** verknüpft Begriffe einer Spalte
  mit OR und Spalten mit AND (Phrasen in Anführungszeichen, Zeilen per Checkbox wählbar, Standard
  ohne gegensätzliche Begriffe) und lässt sich kopieren. Export als DOCX und Markdown. Speichert
  automatisch.

## Browser-Extension

- **Picker:** Neben jeder DOI, ISBN, arXiv-ID und PMID auf einer Webseite (auch doi.org-, arXiv-
  und PubMed-Links) erscheint ein kleines „+“. Klick → Titel landet im aktiven Projekt.
- **Übernehmen-Symbol:** Ist eine Seite ein einzelner Titel (DOI, arXiv, PubMed, ISBN oder
  Verlags-Metatags, dazu Detailseiten von Primo-Katalogen wie swisscovery), schwebt unten links ein
  pulsierendes Symbol. Beim Überfahren klappt es auf zu
  „Titel erkannt“ mit „Übernehmen“ – auf anderen Seiten erscheint nichts.
- **Popup:** Konto, aktives Projekt, zuletzt übernommene Titel, Einstellungen (Server-URL, API-Token,
  Picker und Übernehmen-Symbol an/aus).

### Bauen und installieren

```bash
pnpm build:extension
```

| Browser | Build | Laden (Entwicklung) |
| --- | --- | --- |
| Chrome, Edge, Opera (und Brave, Vivaldi, Arc …) | `chrome-mv3` | `chrome://extensions`, `edge://extensions` bzw. `opera://extensions` → Entwicklermodus → *Entpackte Erweiterung laden* → `apps/extension/.output/chrome-mv3` |
| Firefox (ab 128) | `firefox-mv3` | `about:debugging#/runtime/this-firefox` → *Temporäres Add-on laden* → `apps/extension/.output/firefox-mv3/manifest.json` (bis zum Neustart; dauerhaft nur signiert) |

- Beim ersten Öffnen fragt ein **Assistent**: *OpenLitBase Cloud* (`https://cloud.openlitbase.de`) oder
  *Selbst gehostet* (vorbelegt `http://localhost:1450`). Läuft der Server mit Login, folgt der
  **API-Token** (Einstellungen → API-Tokens in OpenLitBase). Ändern später unter ⚙.

ZIP-Pakete für die Stores: `pnpm --filter @litbase/extension zip` (Chrome Web Store, Edge Add-ons und
Opera Add-ons nehmen dasselbe Chromium-Paket, addons.mozilla.org das Firefox-Paket).

### Lesezeichen für Safari, iPhone und iPad

Eine Safari-Erweiterung gibt es nicht. Stattdessen gibt es ein **Lesezeichen „Zu OpenLitBase“**
(Bookmarklet), das in jedem Browser funktioniert, auch auf iPhone und iPad. Es steht in der Web-App
unter **Einstellungen**:

- **Mac und PC:** den Knopf „Zu OpenLitBase“ in die Lesezeichenleiste ziehen.
- **iPhone und iPad:** Code kopieren, eine beliebige Seite als Lesezeichen sichern, das Lesezeichen
  bearbeiten und die Adresse durch den Code ersetzen.

Auf einer Titelseite antippen → OpenLitBase öffnet sich in einem kleinen Fenster mit dem erkannten
Titel (DOI, arXiv, PubMed, ISBN aus den Metatags oder der Adresse, sonst die Seite selbst), Projekt
wählen, **Übernehmen**. Ist vorher eine DOI oder ISBN markiert, gilt diese – praktisch in
Bibliothekskatalogen. Die Angaben gehen nur an die eigene OpenLitBase-Instanz, und zwar im
`#`-Teil der Adresse (nicht in Server-Logs); angemeldet wird über die normale Sitzung, ein
API-Token ist nicht nötig. Gegenüber der Extension fehlen das „+“ neben Nummern und das
automatische Übernehmen-Symbol.

## Word-Add-in

Zitieren direkt in Word (Mac, Windows, Web): Projekt wählen, Titel suchen. Ein Klick zeigt die
Angaben des Titels mit Seitenfeld und **An dieser Stelle einfügen**, ein Doppelklick fügt direkt an
der Cursorposition ein. Jedes Zitat ist ein Inhaltssteuerelement. Neben der Projektauswahl
nummeriert das Reload-Symbol alle Zitate nach erstem Vorkommen im Text neu und aktualisiert das
Literaturverzeichnis (gleiche Reihenfolge); das Listen-Symbol fügt das Literaturverzeichnis nach
Rückfrage an der Cursorposition ein. Stil ist der des Projekts (z. B. IEEE Deutsch); das Dokument
merkt sich sein Projekt.

Word lädt Add-ins nur über **HTTPS**. Das Manifest erzeugt der Server passend zu `BASE_URL`:
`<BASE_URL>/addin/manifest.xml`. Lokal mit Docker genügt es, der mitgelieferten CA einmal zu
vertrauen (siehe [HTTPS lokal](#https-lokal)), dann `https://localhost:1450/addin/manifest.xml`.

### Installieren (Sideloading)

- **Word für Mac:** Manifest in
  `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/` speichern (Ordner ggf. anlegen),
  Word neu starten → einmalig **Start → Add-Ins → Entwicklertool-Add-Ins → OpenLitBase**, danach
  steht **Start → Zitieren** direkt im Menüband.
- **Word für Windows:** Ordner mit dem Manifest freigeben, in Word unter *Datei → Optionen →
  Trust Center → Einstellungen → Kataloge vertrauenswürdiger Add-Ins* den Netzwerkpfad
  (`\\rechner\freigabe`) eintragen und „Im Menü anzeigen“ aktivieren, Word neu starten →
  *Einfügen → Meine Add-Ins → Freigegebener Ordner*.
- **Word im Web:** *Einfügen → Add-Ins → Meine Add-Ins verwalten → Eigenes Add-In hochladen*.
- **Für eine ganze Organisation:** Microsoft 365 Admin Center → *Integrierte Apps* →
  *Benutzerdefinierte Apps hochladen* (Manifest-URL angeben).

Im Modus `multi` fragt das Add-in beim ersten Start nach einem **API-Token** (Einstellungen →
API-Tokens). Im Modus `single` ist nichts einzurichten.

### Add-in-Oberfläche entwickeln (Vite mit Hot Reload)

```bash
npx office-addin-dev-certs install          # einmalig: lokales Zertifikat erzeugen und vertrauen
BASE_URL=https://localhost:5174 pnpm dev    # API + Web (Manifest zeigt dann auf 5174)
pnpm dev:addin                              # Taskpane unter https://localhost:5174/addin/
curl -k https://localhost:5174/addin/manifest.xml \
  -o ~/Library/Containers/com.microsoft.Word/Data/Documents/wef/openlitbase.xml
```

Die Add-in-Vite leitet `/api` wie die Web-App an die API weiter (`PORT=3100 pnpm dev:addin`, falls
die API auf 3100 läuft). Im Browser geöffnet zeigt die Taskpane eine Vorschau ohne Word-Funktionen.

## KI-Agenten (MCP)

OpenLitBase ist selbst ein [MCP-Server](https://modelcontextprotocol.io) (Streamable HTTP) unter
`<BASE_URL>/api/mcp` – kein zusätzlicher Dienst. Agenten arbeiten mit den Rechten der angemeldeten
Person (geteilte Projekte, Rolle „Lesen“ bleibt nur lesend) und können nichts löschen.

| Tool | Zweck |
| --- | --- |
| `list_projects`, `get_project` | Projekte; Dreisatz, Forschungsfrage, Begriffsmatrix mit Suchstring |
| `search_items`, `get_item` | Titel suchen, vollständige CSL-Daten mit formatiertem Eintrag |
| `add_item_by_identifier`, `create_item`, `update_item` | Titel per DOI/ISBN/arXiv/PMID/URL oder CSL-JSON anlegen, Tags/Notizen ändern |
| `get_bibliography` | Literaturverzeichnis als Text, Markdown oder BibTeX |
| `update_research`, `update_term_matrix` | Forschungsdreisatz und Begriffsmatrix bearbeiten |

Im Modus `multi` braucht der Agent einen **API-Token** (Einstellungen → API-Tokens); die Adresse
und den Befehl zeigt auch die Web-App unter Einstellungen → KI-Agenten.

```bash
# Claude Code
claude mcp add --transport http openlitbase https://lit.example.com/api/mcp \
  --header "Authorization: Bearer <TOKEN>"
# lokal (single): ohne Header, per http – so muss der Agent der lokalen CA nicht vertrauen
claude mcp add --transport http openlitbase http://localhost:1450/api/mcp
```

Clients, die nur lokale Server (stdio) starten, z. B. Claude Desktop über
`claude_desktop_config.json`, binden den Endpunkt mit
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote) ein:

```json
{
  "mcpServers": {
    "openlitbase": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://lit.example.com/api/mcp", "--header", "Authorization: Bearer <TOKEN>"]
    }
  }
}
```

## Lizenz

[GNU Affero General Public License v3.0](LICENSE) oder später (AGPL-3.0-or-later),
© 2026 devolta UG (haftungsbeschränkt). Du darfst OpenLitBase frei nutzen, selbst betreiben und
verändern. Wer eine veränderte Version als Dienst im Netz anbietet, muss den Nutzenden den Quellcode
dieser Version zugänglich machen – dafür `SOURCE_URL` auf den eigenen Code setzen (die App verlinkt
ihn unter „Quellcode“). Mitgelieferte Zitierstile (CSL) stehen unter CC BY-SA 3.0, `citeproc-js`
unter CPAL 1.0 oder AGPL (nach Wahl).

## Mitentwickeln

Fehler und Wünsche als [Issue](https://github.com/max1302p/OpenLitBase/issues), Beiträge als Pull
Request – siehe [CONTRIBUTING.md](CONTRIBUTING.md). Sicherheitslücken bitte vertraulich melden:
[SECURITY.md](SECURITY.md).
