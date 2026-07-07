# 🛡️ SecureNet AI

## Multi-Agent Network Intrusion Detection & Autonomous Response System

An enterprise-grade **Agentic AI Security Operations Center (SOC)** built using **IBM watsonx Granite**, **IBM AutoAI**, and a **Multi-Agent Observer–Executor Architecture** for intelligent cyber threat detection, reasoning, mitigation, and autonomous incident response.

---

# Demo

[img1]

---

# Problem Statement

Develop an intelligent **Network Intrusion Detection and Response System (NIDRS)** capable of detecting malicious network activities, distinguishing them from normal traffic, explaining detected threats, retrieving similar historical incidents, recommending mitigation strategies, and supporting autonomous security operations for real-world environments.

---

# Key Features

- IBM AutoAI powered intrusion detection
- IBM Granite LLM threat reasoning
- Multi-Agent Observer–Executor architecture
- Historical attack memory & similarity search
- Explainable AI (XAI)
- Threat Intelligence Mapping (MITRE ATT&CK, CVE, CWE)
- Digital Forensics
- Autonomous Mitigation Planning
- Executive SOC Dashboard
- Digital Twin Network Visualization
- Live Monitoring Dashboard
- Alert Management System
- SOC Copilot Chat Assistant
- Incident Replay Engine
- Executive Summary Generator
- Risk Assessment Engine
- Model Drift Detection
- Multi-Organization Support
- Demo Mode
- Dockerized Deployment
- CI/CD Pipeline

---

# Architecture

```text
                         ┌──────────────────────────────┐
                         │ User / Security Analyst      │
                         └──────────────┬───────────────┘
                                        │
                Manual Input / CSV / Excel / JSON / Logs / PDF
                                        │
                                        ▼
                            ┌────────────────────┐
                            │ Ingestion Layer    │
                            └─────────┬──────────┘
                                      │
                                      ▼
                            ┌────────────────────┐
                            │ Observer Agent     │
                            │ Validation         │
                            └─────────┬──────────┘
                                      │
                                      ▼
                            ┌────────────────────┐
                            │ Detection Agent    │
                            │ IBM AutoAI Model   │
                            └─────────┬──────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │ Explainability Agent │
                           └─────────┬────────────┘
                                     │
                                     ▼
                       ┌─────────────────────────────┐
                       │ Threat Reasoning Agent      │
                       │ IBM Granite                 │
                       └──────────┬──────────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────────┐
                     │ Threat Intelligence Agent    │
                     └──────────┬───────────────────┘
                                │
                                ▼
                   ┌────────────────────────────────┐
                   │ Historical Memory Agent         │
                   │ Similarity Search               │
                   └──────────┬──────────────────────┘
                              │
                              ▼
                   ┌────────────────────────────────┐
                   │ Comparison Engine              │
                   └──────────┬─────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │ Risk Assessment Agent        │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │ Forensics Agent              │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │ Mitigation Agent             │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │ Report Agent                 │
                    └──────────┬───────────────────┘
                               │
                               ▼
                ┌───────────────────────────────────────────┐
                │ SQLite Database + Historical Memory + XAI │
                └──────────┬────────────────────────────────┘
                           │
                           ▼
          React Dashboard • SOC Copilot • Digital Twin • Analytics
```

---

# Workflow

```text
User Input
      │
      ▼
Observer Agent
      │
      ▼
IBM AutoAI Detection
      │
      ▼
Granite Threat Reasoning
      │
      ▼
Historical Memory
      │
      ▼
Threat Intelligence
      │
      ▼
Risk Assessment
      │
      ▼
Mitigation Planning
      │
      ▼
SOC Report Generation
      │
      ▼
SQLite Storage
      │
      ▼
React Dashboard
```

---

# Screenshots

## Dashboard

[img2]

---

## Chat Assistant

[img3]

---

## Live Monitoring

[img4]

---

## Digital Twin

[img5]

---

## Threat Analytics

[img6]

---

## Executive Dashboard

[img7]

---

# Technology Stack

| Layer | Technology |
|---------|------------|
| AI Models | IBM Granite 13B, IBM Llama |
| Machine Learning | IBM AutoAI |
| ML Algorithm | Snap Decision Tree Classifier |
| Backend | FastAPI |
| Frontend | React 18 + TypeScript |
| UI Library | Material UI |
| Charts | Recharts |
| Database | SQLite3 |
| ORM | SQLAlchemy |
| Authentication | IBM IAM |
| APIs | REST APIs |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Version Control | Git & GitHub |

---

# Machine Learning Model

| Property | Value |
|-----------|-------|
| Platform | IBM AutoAI |
| Algorithm | Optimized Snap Decision Tree Classifier |
| Classification | Binary (Normal / Anomaly) |
| Cross Validation Accuracy | **99.5%** |
| Hyperparameter Optimization | IBM AutoAI HPO-1 |
| Feature Engineering | Automated |
| Feature Selection | Automated |
| Explainability | IBM AutoAI XAI |
| Additional AI | IBM Granite Multi-Agent Reasoning |

---

# Supported Attack Analysis

- DoS
- Probe
- R2L
- U2R
- Unknown Anomalies
- Normal Traffic

---

# Input Methods

- Manual Feature Entry
- CSV Upload
- Excel Upload
- JSON Upload
- TXT Files
- LOG Files
- PDF Files

---

# Supported File Formats

| Format |
|---------|
| CSV |
| XLSX |
| XLS |
| JSON |
| TXT |
| LOG |
| PDF |

---

# Multi-Agent System

| Agent | Responsibility |
|---------|----------------|
| Observer Agent | Input validation |
| Detection Agent | IBM AutoAI prediction |
| Explainability Agent | Prediction explanation |
| Threat Reasoning Agent | IBM Granite reasoning |
| Threat Intelligence Agent | MITRE, CVE, CWE mapping |
| Historical Memory Agent | Similarity search |
| Risk Assessment Agent | Risk scoring |
| Forensics Agent | Evidence preservation |
| Mitigation Agent | Response planning |
| Report Agent | SOC report generation |
| Notification Agent | Email alerts |
| Executive Summary Agent | Business summary |
| SOC Copilot | AI assistant |

---

# Running the Project

## 1. Clone Repository

```bash
git clone https://github.com/Bhuvan068/SecureNet-AI-IBM.git
cd SecureNet-AI-IBM
```

---

## 2. Configure Environment

Navigate to the backend folder.

```bash
cd backend
```

Copy the example environment file.

```bash
cp .env.example .env
```

Update the following IBM credentials.

```env
IBM_API_KEY=
IBM_DEPLOYMENT_URL=
IBM_DEPLOYMENT_ID=
IBM_SPACE_ID=
IBM_PROJECT_ID=
GRANITE_MODEL_ID=
```

---

## 3. Run with Docker

```bash
docker compose up --build
```

Open

```
Frontend
http://localhost:3000

Backend
http://localhost:8000

Swagger
http://localhost:8000/docs
```

---

## 4. Run Without Docker

### Backend

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# API Endpoints

| Method | Endpoint |
|----------|----------|
| POST | /api/v1/analyse |
| POST | /api/v1/upload |
| POST | /api/v1/chat |
| GET | /api/v1/incidents |
| GET | /api/v1/stats |
| GET | /api/v1/analytics |
| GET | /api/v1/alerts |
| GET | /api/v1/reports |

---

# Project Structure

```text
SecureNet-AI/
│
├── backend/
│   ├── agents/
│   ├── routers/
│   ├── models/
│   ├── pipeline.py
│   └── app/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── api/
│
├── docker/
├── .github/workflows/
├── README.md
└── docker-compose.yml
```

---

# Future Scope

- SIEM Integration
- Firewall Integration
- IDS/IPS Integration
- Real Threat Intelligence APIs
- Cloud Deployment
- Kubernetes Support
- Enterprise SOC Automation

---

# License

MIT License

---

# Author

**Bhuvan**

Computer Science & Engineering Student

GitHub: https://github.com/Bhuvan068
