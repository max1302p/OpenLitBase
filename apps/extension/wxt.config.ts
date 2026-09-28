import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  zip: {
    name: 'openlitbase',
    // Quellcode für die Prüfung bei Mozilla und Opera: Extension samt Workspace-Paketen, die sie nutzt.
    sourcesRoot: resolve(import.meta.dirname, '../..'),
    includeSources: [
      'LICENSE',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig.base.json',
      'apps/extension/**',
      'packages/shared/**',
      'packages/ui/**',
    ],
  },
  vite: () => ({ plugins: [tailwindcss()], build: { chunkSizeWarningLimit: 1000 } }),
  manifest: ({ browser }) => ({
    name: 'OpenLitBase',
    description: 'Titel mit einem Klick von Webseiten und Bibliothekskatalogen in deine OpenLitBase-Literaturverwaltung übernehmen.',
    homepage_url: 'https://openlitbase.de',
    // Keine Host-Berechtigung für den Server nötig: die API erlaubt Extension-Origins per CORS.
    permissions: ['storage'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'extension@openlitbase.org',
          strict_min_version: '140.0',
          // Auf Klick gehen Seiteninhalt (DOI, ISBN, URL, Katalogdaten) und API-Token an den gewählten Server.
          data_collection_permissions: { required: ['websiteContent', 'authenticationInfo'] },
        },
        // Die Datenangabe kennt Firefox für Android erst ab 142.
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
})
