# Einstieg für Agenten

Kurzfassung für alle, die an OpenLitBase weiterarbeiten (Menschen wie Coding-Agenten).

Beitragen und Pull Requests: [CONTRIBUTING.md](../CONTRIBUTING.md); Sicherheitslücken vertraulich
melden: [SECURITY.md](../SECURITY.md).

## Arbeitsweise

- Nach jedem grösseren Schritt anhalten und zusammenfassen (gebaut, wie testen). Rückmeldungen
  zwischendurch gehen vor.
- Unklarheiten: einfache, begründete Entscheidung treffen und im Pull Request festhalten.
- UI-Sprache **Schweizer Hochdeutsch** (immer „ss“, nie „ß“ – auch in E-Mails, Kommentaren und
  Doku); alle Texte in `packages/shared/src/de.ts`.
- Nur shadcn/ui-Komponenten (+ Lucide). Neue Komponenten aus `apps/web` mit
  `pnpm dlx shadcn@latest add <name>` – landen in `packages/ui`.
- Validierung als zod-Schema in `packages/shared/src/schemas`, API-Aufrufe über
  `createApiClient` (`packages/shared/src/api-client.ts`).
- Feature-Ordner (`apps/web/src/features/<bereich>`), eine Komponente pro Datei, ≤ ~250 Zeilen.
- Genau **eine** modusabhängige Auth-Stelle: `apps/api/src/middleware/auth.ts`.
- Alles Inhaltliche ist projektbezogen (`/projects/:projectId/...`); Titel ohne Projekt gibt es nicht.
- Zugriff auf Projekte und Titel nur über `apps/api/src/projects/access.ts` prüfen (geteilte
  Projekte, Rollen Besitzer:in/`editor`/`viewer`) – nie direkt auf `userId` filtern.
- Commits auf Deutsch, knapp, nach Bereich gruppiert.

## Projektkarte

```
apps/api          Hono + Drizzle + better-auth
  src/routes      Endpunkte (items, projects, import-export, admin-*, tokens, styles, settings …)
  src/mcp         MCP-Server für KI-Agenten (/api/mcp, Tools über Projekte und Titel)
  src/resolvers   DOI, ISBN (MARC), arXiv, PubMed, URL → CSL-JSON
  src/exports     BibTeX/RIS/EndNote/CSL-JSON, DOCX, Markdown, OOXML (Add-in)
  src/addin       Manifest für das Word-Add-in
  src/startup     Start-Banner und Checks
  drizzle/        SQL-Migrationen (pnpm db:generate)
apps/web          Vite + React Router + TanStack Query
  src/features    app-shell, auth, projects, items (inkl. add-item/), bookmarklet, citation, settings, admin, …
  src/components  App-eigene Bausteine (ChipInput)
apps/word-addin   Office.js-Taskpane (features/, word/ = Office-Aufrufe)
apps/extension    WXT-Extension: entrypoints/ (background, content, popup), lib/primo.ts (Kataloge)
packages/shared   zod-Schemas, API-Client, de.ts, Identifier-Parser (+ Tests)
packages/citation citeproc-Wrapper, Styles/Locales, ieee-de-Generator (+ Tests)
packages/ui       shadcn-Komponenten, Theme (globals.css), BrandLogo, EmptyState, Avatare,
                  InstitutionLogo, ConfirmDialog, AccountSummary, ProjectSelect, Assets
custom-styles/    eigene .csl-Dateien (in Docker nach /data/styles)
```

## Befehle

```bash
corepack enable && pnpm install
docker compose up -d db              # Postgres
pnpm dev                             # API :1450 + Web :5173 (PORT=3100 pnpm dev, falls 1450 belegt)
pnpm typecheck && pnpm test && pnpm build
pnpm db:generate                     # nach Schemaänderung
docker compose up -d --build         # komplette App (APP_PORT=3100 …)
```

Modus `multi` lokal: `AUTH_MODE=multi AUTH_SECRET=<32+ Zeichen> BASE_URL=http://localhost:5173`;
ohne `SMTP_HOST` stehen Bestätigungslinks im API-Log.

## Prüfen, bevor man „fertig“ sagt

- `pnpm typecheck`, `pnpm test`, `pnpm build` grün; bei Server-Änderungen `docker compose build app`.
- API per `curl` gegen einen eigenen Port (z. B. `PORT=3200`) testen – Achtung: die Shell des
  Agenten ist oft **zsh** (Arrays/`read <<<` verhalten sich anders) → längere Skripte als `bash`.
- UI: Screenshots mit Chrome headless; für Klickstrecken `puppeteer-core` (ausserhalb des Repos
  installieren) mit dem vorhandenen Chrome. Chrome mit `--user-data-dir` beendet sich im
  Headless-Modus nicht selbst.
- Dev und Docker können sich die Datenbank teilen: eigene Testkonten/-domains anlegen und danach
  löschen; fremde Konten, Daten und `.env` nicht anfassen.
