FROM node:20-alpine AS base

# Build client
FROM base AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build server
FROM base AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ ./
RUN npm run build

# Production
FROM base AS production
WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./server/public

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
ENV GIF_DIR=/data/gifs

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
