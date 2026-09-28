# Ein Image für alles: baut Web-App und Word-Add-in, die API liefert beide statisch aus.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS build
# Erst nur Lockfile → Abhängigkeiten werden gecacht, solange sich das Lockfile nicht ändert.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile --offline
RUN pnpm build
RUN pnpm --filter @litbase/api deploy --prod --legacy /out

FROM node:22-alpine AS runtime
# openssl erzeugt beim ersten Start die lokale CA für HTTPS (Word lädt Add-ins nur über https),
# pg_dump die nächtliche Datenbank-Sicherung (BACKUP_S3_BUCKET).
RUN apk add --no-cache openssl postgresql17-client
ENV NODE_ENV=production
ENV STYLES_DIR=/app/styles
ENV CERT_DIR=/data/certs
WORKDIR /app
COPY --from=build /out/package.json ./package.json
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/drizzle ./drizzle
COPY --from=build /repo/apps/api/assets ./assets
COPY --from=build /repo/packages/citation/styles ./styles
COPY --from=build /repo/apps/web/dist ./public/web
COPY --from=build /repo/apps/word-addin/dist ./public/addin
RUN mkdir -p /data/uploads /data/certs && chown node:node /data/uploads /data/certs
USER node
VOLUME /data/uploads
VOLUME /data/certs
EXPOSE 1450
CMD ["node", "dist/index.js"]
