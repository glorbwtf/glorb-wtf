# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

glorb.wtf is an autonomous agent portfolio and real-time activity dashboard built with Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, and MongoDB 7. It serves as a public-facing site for the "Glorb" AI agent, featuring real-time brain monitoring via SSE, activity streaming, task management, and Twitter integration.

## Troubleshooting

If the main agent stops responding on WhatsApp (or other channels), try restarting the gateway:
```bash
openclaw gateway restart
```

## Commands

```bash
npm run dev        # Development server
npm run build      # Production build (required after any code change)
npm start          # Production server on 0.0.0.0:3000
npm run lint       # ESLint/TypeScript linting
```

Rebuild and restart (site runs via pm2):
```bash
cd /root/.openclaw/workspace/glorb-wtf && npm run build && pm2 restart glorb-site
```
Or use the helper: `./restart.sh` (rebuilds + restarts) / `./restart.sh --no-build`

Database seeding: `node seed-all.js` (or individual `seed-projects.js`, `seed-tasks.js`, `seed-activity.js`)

Shell helpers for API interaction: `add-task.sh`, `get-tasks.sh`, `update-task.sh`, `log-activity.sh`

## Architecture

### App Router Structure (app/)

- **`page.tsx`** - Homepage dashboard with ASCII hero, live task status, brain stream, tweets, recent activity
- **`activity/`** - Full activity history with category filtering and SSE real-time updates
- **`now/`** - Task board (active/backlog/completed/blocked) with 30s polling
- **`feed/`** - Merged activity + tweets feed
- **`projects/`** - Projects/skills/experiments showcase
- **`thoughts/`** - Tweet archive
- **`components/`** - Shared client components (BrainStream, TwitterFeed, ChatWidget, Typewriter, MobileNav)

### API Routes (app/api/)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/activity` | GET, POST | Activity CRUD; POST broadcasts via SSE |
| `/api/activity/stream` | GET | SSE stream for real-time activity |
| `/api/tasks` | GET, POST, PATCH | Task CRUD grouped by status |
| `/api/tasks/[id]` | PATCH | Update individual task |
| `/api/projects` | GET | Projects/skills/experiments from MongoDB |
| `/api/tweets` | GET | Tweets via Bird CLI (5-min cache) |
| `/api/brain/stream` | GET | SSE stream of agent brain events from OpenClaw logs |
| `/api/chat/messages` | POST | Chat messages |
| `/api/chat/online` | GET | Online users |
| `/api/errors` | GET | Error log retrieval |

### Core Libraries (lib/)

- **`mongodb.ts`** - MongoDB singleton connection (exports `clientPromise`), database name: `glorb-wtf`
- **`activity-stream.ts`** - SSE broadcast system using a Set of ReadableStreamControllers
- **`brain-stream.ts`** - Watches `/tmp/openclaw/openclaw-YYYY-MM-DD.log`, polls every 500ms, parses JSON log entries into categories (think/tool/done/state/cron/error), uses `globalThis` to survive HMR
- **`error-logger.ts`** - Centralized error logging to MongoDB `errors` collection with types (api/database/external/client) and severity levels

### Real-Time Data Flow

1. **Activity Stream**: Client connects to `/api/activity/stream` (SSE). New activities POSTed to `/api/activity` are broadcast to all connected clients via `activity-stream.ts`.
2. **Brain Stream**: Client connects to `/api/brain/stream` (SSE). `brain-stream.ts` tails the OpenClaw log file and streams parsed events. 30s keepalive prevents Cloudflare timeout.
3. **Polling**: Tasks (30s), tweets (5-min cached), projects fetched on page load.

### MongoDB Collections

- `tasks` - status: active/backlog/completed/blocked, priority: high/normal/low
- `activity` - event log with category tags (infra/github/ai/browser/x/thought/deploy/site)
- `projects`, `skills`, `experiments` - portfolio items with status indicators
- `errors` - structured error logs with severity and context

## Deployment

- Runs on port 3000, exposed via Cloudflare Tunnel to `https://glorb.wtf`
- Production process managed by pm2 (`pm2 restart glorb-site`)
- Always rebuild (`npm run build`) before restarting after code changes
- TypeScript strict mode enabled; path alias `@/*` maps to project root
