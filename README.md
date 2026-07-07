# 🛡️ SecureNet AI
### Multi-Agent Network Intrusion Detection & Autonomous Response System

> AI-powered Security Operations Center (SOC) Assistant built using **IBM watsonx.ai Granite**, **IBM AutoAI**, and an **Observer–Executor Multi-Agent Architecture**.

[img1]

---

# 📌 Problem Statement

**Network Intrusion Detection and Response System (NIDRS)**

Develop an intelligent system capable of detecting malicious network traffic, distinguishing it from normal activity, explaining attack behaviour, retrieving similar historical incidents, recommending mitigation strategies, and supporting autonomous security operations for home networks, educational institutions, startups, and enterprise environments.

---

# 🚀 Project Overview

SecureNet AI is an enterprise-grade **AI-powered SOC Assistant** that combines Machine Learning, Large Language Models, and Multi-Agent AI to automate the complete cyber incident response workflow.

Instead of only predicting whether traffic is malicious, SecureNet AI can:

- Detect network anomalies using IBM AutoAI
- Explain why an attack occurred using IBM Granite
- Search similar historical incidents
- Compare previous mitigation strategies
- Recommend the best response
- Generate complete SOC incident reports
- Store attack history for future learning
- Monitor live security events
- Provide executive summaries
- Visualize attack timelines and Digital Twins

---

# 🏗️ System Architecture

```text
                     ┌─────────────────────────────┐
                     │   User / Uploaded Dataset   │
                     │ CSV • Excel • JSON • Logs   │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │  Observer Agent    │
                         │ Validation         │
                         └─────────┬──────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │ Detection Agent         │
                      │ IBM AutoAI Prediction   │
                      └─────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Threat Reasoning Agent       │
                 │ IBM Granite LLM              │
                 └─────────┬────────────────────┘
                           │
                           ▼
              ┌─────────────────────────────┐
              │ Historical Memory Agent     │
              │ SQLite Similarity Search    │
              └─────────┬───────────────────┘
                        │
                        ▼
               ┌────────────────────────────┐
               │ Comparison Engine          │
               │ Historical vs Current      │
               └─────────┬──────────────────┘
                         │
                         ▼
              ┌─────────────────────────────┐
              │ Mitigation Agent            │
              │ AI Response Planning        │
              └─────────┬───────────────────┘
                        │
                        ▼
              ┌─────────────────────────────┐
              │ Report Agent                │
              │ SOC Incident Report         │
              └─────────┬───────────────────┘
                        │
        ┌───────────────┴─────────────────┐
        ▼                                 ▼
SQLite Historical DB              React Dashboard
```

---

# 🤖 Multi-Agent Architecture

| Agent | Responsibility |
|--------|----------------|
| Observer Agent | Input validation & event creation |
| Detection Agent | IBM AutoAI intrusion detection |
| Threat Reasoning Agent | IBM Granite attack reasoning |
| Historical Memory Agent | Similar attack retrieval |
| Comparison Engine | Compare historical mitigations |
| Mitigation Agent | AI response recommendations |
| Report Agent | SOC Incident Report generation |
| Threat Intelligence Agent | MITRE ATT&CK, CVE & IOC mapping |
| Forensics Agent | Evidence preservation |
| Risk Assessment Agent | Dynamic risk scoring |
| Drift Detection Agent | AutoAI model monitoring |
| Threat Hunting Agent | Historical incident search |
| Executive Summary Agent | Business impact reports |
| XAI Agent | Explain prediction decisions |
| Notification Agent | Email alerting |
| SOC Copilot | AI Cybersecurity Assistant |

---

# ⚙️ Technology Stack

| Category | Technology |
|-----------|------------|
| AI / LLM | IBM watsonx Granite 13B |
| Machine Learning | IBM AutoAI |
| ML Algorithm | Optimized Snap Decision Tree Classifier |
| Backend | FastAPI |
| Frontend | React + TypeScript |
| Database | SQLite3 |
| ORM | SQLAlchemy |
| Charts | Recharts |
| Styling | Material UI |
| Authentication | IBM IAM |
| APIs | REST APIs |
| DevOps | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

# 🧠 Machine Learning Details

### Model

IBM AutoAI Optimized Snap Decision Tree Classifier

### Classification

Binary Classification

```
Normal
Anomaly
```

### Accuracy

```
99.5%
Cross Validation Accuracy
```

### AutoAI Enhancements

- Hyperparameter Optimization (HPO-1)
- Automated Feature Engineering
- Feature Selection
- Explainable AI (XAI)
- Historical Memory Retrieval
- IBM Granite Threat Reasoning

---

# 📊 Supported Network Features

The system analyses all **41 KDD-99 network intrusion features**, including:

- duration
- protocol_type
- service
- flag
- src_bytes
- dst_bytes
- count
- srv_count
- serror_rate
- rerror_rate
- root_shell
- num_failed_logins

...and all remaining KDD-99 features.

---

# 📂 Supported File Uploads

Users can either:

### Option 1

Enter network traffic manually through the React dashboard.

### Option 2

Upload files directly.

Supported formats:

- CSV
- Excel (.xlsx)
- JSON
- TXT
- LOG
- PDF

### Sample Dataset

Upload the included dataset:

```
Train_data.csv
```

or manually enter network features through the Chat Assistant.

[img2]

---

# 📈 Dashboard Features

✔ Live Monitoring

✔ Attack Trend Analytics

✔ Threat Heatmap

✔ Historical Incident Comparison

✔ AI Executive Summary

✔ Attack Timeline

✔ Digital Twin Visualization

✔ Organization Selector

✔ Alert Center

✔ Explainability (XAI)

✔ Agent Analytics

✔ Risk Distribution

✔ Executive SOC Dashboard

[img3]

---

# 💬 SOC Copilot

IBM Granite powered AI assistant capable of:

- Explaining attacks
- Threat hunting
- Security recommendations
- Incident summaries
- Report generation
- Historical case lookup

[img4]

---

# 🗂️ Project Structure

```text
SecureNet-AI/
│
├── backend/
│   ├── app/
│   ├── agents/
│   ├── routers/
│   ├── connectors/
│   ├── models.py
│   └── pipeline.py
│
├── frontend/
│   ├── src/
│   ├── pages/
│   ├── components/
│   └── assets/
│
├── docker/
├── .github/workflows/
├── Train_data.csv
├── Test_data.csv
├── docker-compose.yml
└── README.md
```

---

# 🚀 Installation Guide

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Bhuvan068/SecureNet-AI-IBM.git

cd SecureNet-AI-IBM
```

---

## 2️⃣ Backend Setup

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 4️⃣ Configure IBM Credentials

Create:

```
backend/.env
```

Add:

```env
IBM_API_KEY=

IBM_DEPLOYMENT_URL=

IBM_DEPLOYMENT_ID=

IBM_PROJECT_ID=

IBM_SPACE_ID=

GRANITE_MODEL_ID=
```

---

## 5️⃣ Run Backend

```bash
uvicorn app.main:app --reload
```

Backend

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

## 6️⃣ Run Frontend

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

---

## 7️⃣ Docker Deployment

```bash
docker compose up --build
```

---

# 📤 How to Use

### Manual Prediction

- Open Chat Assistant
- Enter network feature values
- Click Analyze
- View AI reasoning, mitigation, reports, and historical comparisons

OR

### File Upload

- Upload **Train_data.csv**
- Click Analyze
- The Detection Agent automatically processes every record and generates reports.

---

# 📊 API Endpoints

| Method | Endpoint |
|----------|------------|
| POST | /api/v1/analyse |
| POST | /api/v1/upload |
| POST | /api/v1/chat |
| GET | /api/v1/stats |
| GET | /api/v1/incidents |
| GET | /api/v1/reports |
| GET | /api/v1/analytics |
| GET | /api/v1/organizations |

---

# 📸 Screenshots

## Dashboard

[img5]

---

## Chat Assistant

[img6]

---

## Threat Heatmap

[img7]

---

## Executive Dashboard

[img8]

---

## Digital Twin

[img9]

---

# 👨‍💻 Author

**Vanteru Bhuvan Reddy**

Computer Science Engineering Student

GitHub: https://github.com/Bhuvan068

---

# 📄 License

MIT License
