import { defineConfig } from 'tsup'

// Bündelt die API inklusive der Workspace-Pakete (@litbase/*) in eine Datei.
// npm-Abhängigkeiten bleiben extern und kommen im Docker-Image aus node_modules.
export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  clean: true,
  noExternal: [/^@litbase\//],
})
