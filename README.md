# MoveSet

A personal workout tracker web app. Build exercise routines by scraping exercise data and GIFs from [fitnessprogramer.com](https://fitnessprogramer.com), organize them into workouts, and track your sessions with per-set completion tracking.

![Dark mode](https://img.shields.io/badge/theme-dark_mode-000000) ![Docker](https://img.shields.io/badge/docker-ready-blue) ![PWA](https://img.shields.io/badge/PWA-installable-green)

## Features

- **Exercise Scraping** — Paste a fitnessprogramer.com URL to import exercise name, GIF, muscles worked, and equipment
- **Workout Builder** — Create workouts with drag-and-drop exercise ordering, sets, reps, and notes
- **Per-Set Session Tracking** — Track individual set completions during active sessions with visual progress indicators
- **Muscle Group Tags** — 15 predefined muscle groups with colored pills displayed on workouts
- **Stats Dashboard** — Total workouts, weekly count, streak tracker, completion rate, 7-day chart, and muscle group breakdown
- **Exercise Detail** — Full-size GIF, muscles worked percentages, equipment info, and complete session history per exercise
- **Workout History** — Browse past sessions with completion stats and duration
- **GIF Lightbox** — Tap any exercise GIF for a full-screen view
- **Swipe-to-Delete** — Swipe left on mobile to delete workouts and sessions
- **PWA** — Installable on mobile, works offline with cached GIFs
- **Dark Mode** — Apple-inspired dark UI, mobile-first responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite with Drizzle ORM |
| Auth | JWT (httpOnly cookie, 7-day expiry) |
| Scraping | Cheerio, proxy-aware fetch |
| Drag & Drop | @dnd-kit |
| PWA | vite-plugin-pwa |
| Deployment | Docker (single container) |

## Quick Start (Development)

```bash
# Clone
git clone https://github.com/YOUR_USER/move_set.git
cd move_set

# Configure environment
cp .env.example .env
# Edit .env with your values

# Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Start server (terminal 1)
cd server && npx tsx src/index.ts

# Start client (terminal 2)
cd client && npx vite
```

The app will be available at `http://localhost:5173` (client proxies API to `localhost:3000`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOVESET_USERNAME` | `admin` | Login username |
| `MOVESET_PASSWORD` | `changeme` | Login password |
| `JWT_SECRET` | `super-secret-change-me` | Secret for JWT signing |
| `PORT` | `3000` | Server port |
| `DATA_DIR` | `./data` | Directory for SQLite database |
| `GIF_DIR` | `./data/gifs` | Directory for downloaded GIFs |
| `PROXY_URL` | *(empty)* | Optional HTTP proxy for scraping |

## Docker

### Build locally

```bash
docker build -t moveset .
docker run -d \
  --name moveset \
  -p 3000:3000 \
  -e MOVESET_USERNAME=admin \
  -e MOVESET_PASSWORD=yourpassword \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -v moveset-data:/data \
  moveset
```

### Docker Compose

```bash
docker-compose up -d
```

### Pre-built image (from Docker Hub)

```bash
docker pull alehh69/moveset:latest
```

## Unraid Deployment

1. **Docker tab** → **Add Container**
2. **Repository**: `alehh69/moveset:latest`
3. **Port**: `3000` → `3000`
4. **Volume**: `/mnt/user/appdata/moveset` → `/data`
5. **Environment variables**: `MOVESET_USERNAME`, `MOVESET_PASSWORD`, `JWT_SECRET`
6. **Apply** — access at `http://YOUR_UNRAID_IP:3000`

## CI/CD

A GitHub Actions workflow (`.github/workflows/docker.yml`) automatically builds and pushes the Docker image to Docker Hub on:
- Push to `main` (tagged `latest`)
- Version tags like `v1.0.0`
- Manual dispatch

## Adding Exercises

1. Find an exercise on [fitnessprogramer.com](https://fitnessprogramer.com)
2. Copy the exercise URL
3. In the app, create or edit a workout → click **Add** → paste the URL → click **Scrape**
4. The exercise GIF, name, muscles, and equipment are imported automatically

> **Note**: If the site is behind Cloudflare protection, you may need to set the `PROXY_URL` environment variable to a proxy that can bypass it.

## License

Personal use project.
