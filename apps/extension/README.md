# OpenLitBase – Browser-Extension

Titel mit einem Klick von Webseiten und Bibliothekskatalogen in OpenLitBase übernehmen.
Gebaut mit [WXT](https://wxt.dev) aus dem Monorepo (`apps/extension`, `packages/shared`, `packages/ui`).

## Aus dem Quellcode bauen (auch für die Store-Prüfung)

Voraussetzungen: Node.js 22 oder neuer, Corepack (liegt Node bei). Getestet auf macOS und Linux.

```bash
corepack enable
pnpm install --frozen-lockfile --filter @litbase/extension...
pnpm --filter @litbase/extension build
```

Ergebnis in `apps/extension/.output/`:

| Browser | Ordner |
| --- | --- |
| Chrome, Edge, Opera | `chrome-mv3` |
| Firefox | `firefox-mv3` |

Der Code wird nur von Vite gebündelt und verkleinert, nicht verschleiert. Kein entfernter Code,
keine Analyse- oder Tracking-Dienste.

## Build from source (for store reviewers)

This zip contains the extension (`apps/extension`) and the two workspace packages it uses
(`packages/shared`, `packages/ui`). All files are hand-written TypeScript/CSS; nothing in the
sources is minified or generated. Third-party libraries are installed from npm via the lockfile.

**Environment**

- OS: macOS 13+ or Linux (tested on macOS 26 and Debian 12 in the `node:22` Docker image), x64 or arm64
- Node.js 22 (tested with 22.23.2) – install from https://nodejs.org or with
  `nvm install 22`
- pnpm 12.6.0 – pinned in `package.json` (`packageManager`) and activated by Corepack,
  which ships with Node.js

**Steps** (run in the root of the unpacked zip)

```bash
corepack enable
pnpm install --frozen-lockfile --filter @litbase/extension...
pnpm --filter @litbase/extension build:firefox
```

The result in `apps/extension/.output/firefox-mv3/` is identical to the submitted package.
`pnpm --filter @litbase/extension build` builds Chrome (`chrome-mv3`) and Firefox at once.

**Tools used during the build:** WXT (Vite/Rollup: bundling and minification), Tailwind CSS v4
(generates the CSS from the class names in the sources), TypeScript, React.
