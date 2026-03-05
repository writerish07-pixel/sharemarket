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


## Run in VS Code on Your PC (Windows/Mac/Linux)

### Prerequisites

Install these first:

- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- **Option A (recommended):** Docker Desktop
- **Option B (manual run):** Python 3.11+ and Node.js 20+

### Step-by-step in VS Code

1. Clone the repository:

```bash
git clone <your-repo-url>
cd sharemarket
```

2. Open in VS Code:

```bash
code .
```

3. Create a backend env file:

- Copy `backend/.env.example` to `backend/.env`
- Add your Angel One keys later when ready.

4. Start the app:

**With Docker Desktop (easiest):**

```bash
docker compose up --build
```

Then open:
- Frontend: http://localhost:3000
- Backend Swagger: http://localhost:8000/docs

**Without Docker (manual):**

Backend terminal:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend terminal (new terminal window):

```bash
cd frontend
npm install
npm run dev
```

### Recommended VS Code Extensions

- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- ESLint
- Tailwind CSS IntelliSense
- Docker

### Troubleshooting

- If `pip install -e .` fails, upgrade pip first: `python -m pip install --upgrade pip`.
- If ports are busy, change frontend/backend ports and update `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL`.
- If frontend cannot connect, ensure backend is running on `http://localhost:8000`.

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
