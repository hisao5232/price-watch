# price-watch

楽天市場の商品価格・在庫・セールを追跡する個人用アプリ

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Hono + Cloudflare Workers
- **DB**: Cloudflare D1
- **Scheduler**: Cloudflare Cron Triggers
- **Notification**: Discord Webhook

## Structure

\```
price-watch/
├── frontend/   # Next.js（未実装）
└── backend/    # Hono + Cloudflare Workers
\```

## Setup

### Backend

\```bash
cd backend
npm install
cp .dev.vars.example .dev.vars  # APIキーを記入する
npx wrangler dev
\```
