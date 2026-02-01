# Glorb.wtf Portfolio Site - Management

## Process Manager: pm2

The site and Cloudflare Tunnel are both managed by **pm2**. Config is in `ecosystem.config.js`.

**DO NOT use pkill, tmux, or systemd-run to manage the site. Always use pm2.**

## Quick Start (first time only)

```bash
cd /root/.openclaw/workspace/glorb-wtf
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
```

## Update Workflow

**When you make code changes:**

```bash
cd /root/.openclaw/workspace/glorb-wtf && npm run build && pm2 restart glorb-site
```

Or use the helper script:
```bash
./restart.sh              # Rebuild + restart
./restart.sh --no-build   # Restart without rebuilding
```

## Common Commands

```bash
pm2 status                        # Check all processes
pm2 logs glorb-site --lines 20    # View recent logs
pm2 restart glorb-site            # Restart site
pm2 restart cf-tunnel             # Restart Cloudflare tunnel
pm2 restart all                   # Restart everything
```

## Cloudflare Tunnel

The tunnel runs as `cf-tunnel` in pm2. It routes traffic from `glorb.wtf` to `localhost:3000`.

## Troubleshooting

**Site not loading (https://glorb.wtf down)?**
1. Check pm2: `pm2 status` — both `glorb-site` and `cf-tunnel` should be `online`
2. If stopped: `pm2 restart glorb-site`
3. Check localhost: `curl http://localhost:3000`
4. Check logs: `pm2 logs glorb-site --lines 50`

**Build errors?**
1. Clear build cache: `rm -rf .next`
2. Reinstall: `rm -rf node_modules && npm install`
3. Rebuild: `npm run build`

**Port 3000 conflict?**
```bash
pm2 stop glorb-site
lsof -ti :3000 | xargs kill 2>/dev/null
pm2 start glorb-site
```

## Key Ports

- **3000** — Next.js production server (internal)
- **443/80** — Cloudflare Tunnel (external via glorb.wtf)

## Rules

- Always `npm run build` after code changes
- Always use `pm2 restart glorb-site` to restart — never pkill or manual npm start
- The pm2 config handles clustering, log rotation, and auto-restart on crash
