# SecureNet AI

**Multi-Agent Network Intrusion Detection and Autonomous Response System**

Powered by IBM watsonx Granite + IBM AutoAI + Multi-Agent Observer-Executor workflow.

---

## Architecture

```
Network Traffic Input / Uploaded File
              ↓
        Observer Agent          — validates & normalises features
              ↓
        Detection Agent         — IBM AutoAI intrusion detection
              ↓
    Threat Reasoning Agent      — IBM Granite threat analysis
              ↓
    Historical Memory Agent     — SQLite cosine-similarity search
              ↓
      Comparison Engine         — best mitigation selection
              ↓
       Mitigation Agent         — prioritised response plan
              ↓
         Report Agent           — SOC incident report
              ↓
           SQLite DB
              ↓
        React Dashboard
```

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| AI/ML      | IBM watsonx Granite 13B, IBM AutoAI |
| Backend    | FastAPI, Python 3.11, SQLAlchemy    |
| Frontend   | React 18, TypeScript, MUI, Recharts |
| Database   | SQLite3 (via aiosqlite)             |
| DevOps     | Docker, Docker Compose, GitHub Actions |

---

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/your-org/securenet-ai.git
cd securenet-ai

# Configure IBM credentials
cp backend/.env.example backend/.env
# Edit backend/.env with your IBM API Key, Deployment ID, Project ID
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000  
- **Backend API**: http://localhost:8000  
- **API Docs**: http://localhost:8000/docs

### 3. Run locally (development)

**Backend:**
```bash
cd "C:\Users\BHUVAN\Downloads\securenet-ai\backend"
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
C:\Users\BHUVAN\Downloads\securenet-ai\frontend
npm install
npm run dev
```

---

## IBM Configuration

Set the following in `backend/.env`:

```env
IBM_API_KEY=your_ibm_cloud_api_key
IBM_DEPLOYMENT_URL=https://us-south.ml.cloud.ibm.com
IBM_DEPLOYMENT_ID=your_autoai_deployment_id
IBM_SPACE_ID=your_space_id
IBM_PROJECT_ID=your_watsonx_project_id
GRANITE_MODEL_ID=ibm/granite-13b-instruct-v2
```

> **Note:** The system fully functions without IBM credentials using built-in heuristic detection and rule-based reasoning (ideal for local development and testing).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analyse` | Run full pipeline on manual features |
| POST | `/api/v1/upload` | Upload CSV/Excel/JSON/TXT/LOG/PDF |
| GET | `/api/v1/stats` | Dashboard summary statistics |
| GET | `/api/v1/stats/trends` | Attack trends over time |
| GET | `/api/v1/stats/protocols` | Protocol distribution |
| GET | `/api/v1/stats/severity` | Severity distribution |
| GET | `/api/v1/incidents` | List all incidents |
| GET | `/api/v1/incidents/{id}` | Get single incident |
| GET | `/api/v1/incidents/{id}/report` | Get incident text report |
| PATCH | `/api/v1/incidents/{id}/status` | Update incident status |
| POST | `/api/v1/chat` | SOC chat assistant |
| GET | `/api/v1/chat/history` | Chat history |

---

## Input Features (KDD-99)

The system supports all 41 KDD-99 network intrusion features including:
`duration`, `protocol_type`, `service`, `flag`, `src_bytes`, `dst_bytes`,
`serror_rate`, `rerror_rate`, `count`, `root_shell`, `num_failed_logins`, and more.

---

## Supported File Formats

| Format | Description |
|--------|-------------|
| `.csv` | Comma-separated values |
| `.xlsx` / `.xls` | Excel workbooks |
| `.json` | JSON array or object |
| `.txt` | Space/tab/comma delimited |
| `.log` | KDD-99 format log files |
| `.pdf` | PDF with embedded network data |

---

## Agents

| Agent | Responsibility |
|-------|---------------|
| Observer | Input validation, normalisation, event creation |
| Detection | IBM AutoAI intrusion prediction (heuristic fallback) |
| Threat Reasoning | IBM Granite attack classification & analysis |
| Historical Memory | SQLite cosine-similarity incident search |
| Mitigation | Prioritised response plan generation |
| Report | SOC-style incident report generation |
| Chat | Conversational IBM Granite SOC assistant |

---

## CI/CD

GitHub Actions pipeline:
1. Python lint + type check
2. Frontend TypeScript build
3. Docker build & push to GHCR (on main branch)

---

## License

MIT
