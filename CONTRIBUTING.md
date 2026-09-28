# Mitentwickeln

Schön, dass du OpenLitBase verbessern willst! Fehler, Wünsche und Beiträge sind willkommen.

## Fehler und Wünsche

- **Fehler** und **Wünsche** als [Issue](https://github.com/max1302p/OpenLitBase/issues/new/choose) –
  mit Schritten zum Nachstellen, Version (Einstellungen → Version) und Modus (mit oder ohne Login).
- **Sicherheitslücken nie als öffentliches Issue**, sondern vertraulich melden: siehe [SECURITY.md](SECURITY.md).
- Fragen und Ideen gern in den [Discussions](https://github.com/max1302p/OpenLitBase/discussions).

## Loslegen

Voraussetzung: Node 22+, pnpm (über corepack), Docker für Postgres.

```bash
corepack enable && pnpm install
docker compose up -d db              # Postgres
pnpm dev                             # API :1450 + Web :5173
pnpm typecheck && pnpm test && pnpm build
```

Aufbau, Konventionen und Projektkarte: [docs/agents.md](docs/agents.md).

## Konventionen in Kürze

- Oberfläche auf **Schweizer Hochdeutsch** (immer „ss“, nie „ß“), alle Texte in
  `packages/shared/src/de.ts`.
- Nur **shadcn/ui**-Komponenten (+ Lucide), Validierung mit **zod** in `packages/shared/src/schemas`.
- Feature-Ordner (`apps/web/src/features/<bereich>`), eine Komponente pro Datei, lieber klein.
- Zugriff auf Projekte und Titel nur über `apps/api/src/projects/access.ts`.
- Schemaänderung → `pnpm db:generate` (Migration mit sprechendem Namen committen).
- Grössere Entscheidungen im Pull Request kurz begründen.

## Pull Requests

1. Fork anlegen, Branch vom aktuellen `main`.
2. Kleine, in sich geschlossene Änderungen; Commit-Nachrichten gern auf Deutsch, knapp.
3. Vor dem PR: `pnpm typecheck && pnpm test && pnpm build` – die CI prüft dasselbe.
4. Im PR beschreiben, was sich ändert und wie man es testet (bei Oberfläche gern mit Screenshot).

Mit deinem Beitrag stellst du ihn unter die Lizenz des Projekts,
die [GNU Affero General Public License v3.0](LICENSE) oder später.

## Verhalten

Wir gehen respektvoll und freundlich miteinander um – in Issues, Pull Requests und Discussions.
Beleidigungen, Belästigung und Diskriminierung haben hier keinen Platz; Beiträge dieser Art werden
entfernt.
