# Full-Stack AI Intraday Trading App (NSE/BSE)

Production-focused starter monorepo for a low-latency intraday/F&O trading platform with AI signal support and Angel One SmartAPI-ready execution flow.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Recharts (TradingView-ready placeholder)
- **Backend**: FastAPI, SQLAlchemy, async HTTP integrations, WebSocket streaming
- **Storage**: PostgreSQL + Redis
- **Infra**: Docker + docker-compose

## Project Structure

```text
backend/
  app/
    api/                # REST + WebSocket endpoints
    services/           # Angel, market feeds, signal engine
    models/             # SQLAlchemy models
    schemas/            # Pydantic contracts
  tests/
frontend/
  src/app/              # Next.js app router
  src/components/       # Dashboard widgets
infra/
  schema.sql            # SQL bootstrap (optional)
```

## Key Features Implemented

- Multi-source market data router with latency preference (Angel > Polygon > Alpaca > yFinance fallback mock)
- WebSocket live tick streaming endpoint (`/api/v1/ws/market`)
- Angel One order placement/portfolio/positions wrapper (paper fallback when keys absent)
- AI signal engine with EMA(9/21/50), RSI, MACD, VWAP, Bollinger Bands
- Intraday signal output including entry, SL, target, confidence, and risk-reward
- Trading panel with one-click BUY/SELL order request
- Portfolio snapshot and P&L surface
- Dockerized local deployment

## Local Development

### 1) Start Infra + Services

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

### 2) Backend only (without Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend only (without Docker)

```bash
cd frontend
npm install
npm run dev
```

## Angel One Integration Notes

1. Fill `backend/.env` with `ANGEL_API_KEY`, `ANGEL_CLIENT_CODE`, `ANGEL_PIN`, `ANGEL_TOTP_SECRET`.
2. Replace/extend auth session generation in `app/services/angel_client.py` according to SmartAPI session/token lifecycle.
3. Keep live credentials in a secrets manager in production.

## Security & Production Checklist

- Add strict JWT auth middleware and role-based order permissions
- Enforce HTTPS + secure CORS allowlist
- Use Vault/SSM/KMS for secret storage
- Add request rate limiting and circuit breaker on broker API calls
- Add audit logs to centralized observability stack
- Add canary or dry-run mode before enabling live order routing

## Future Expansion Hooks

- Automated strategy worker + scheduler
- Telegram alert integration
- Reinforcement learning policy experimentation pipeline
- Full options chain analytics (PCR/OI/strike selection UI + API)

> **Risk Disclaimer**: This project is an engineering starter and not financial advice. Validate every strategy with paper trading and strict risk controls before live execution.
