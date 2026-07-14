# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app

# better-sqlite3 / argon2 ship prebuilds for linux x64 glibc; build tools as fallback
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
ENV DATABASE_PATH=/data/starbase.db
ENV PORT=3000
EXPOSE 3000

CMD ["node", "build"]
