# VITMATERNA — API autoalojada (Bun + Hono + PostgreSQL 17)
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json ./
RUN bun install --production

FROM oven/bun:1
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
USER bun
EXPOSE 8080
CMD ["bun", "src/index.ts"]
