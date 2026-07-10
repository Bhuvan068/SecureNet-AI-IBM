# 🛡️ SecureNet AI
### Multi-Agent Network Intrusion Detection & Autonomous Response System

> AI-powered Security Operations Center (SOC) Assistant built using **IBM watsonx.ai Granite**, **IBM AutoAI**, and an **Observer–Executor Multi-Agent Architecture**.

<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/6b3d6dc8-4b84-4a6b-9074-71ad2e933622" />

Upload the included dataset:

Train_data.csv
or manually enter network features through the Chat Assistant.

### 🚀 Live Deployment

The complete SecureNet AI system is deployed using Render Web Services.

**Backend API (FastAPI):**  
https://securenet-backend-b0ui.onrender.com

**Frontend Dashboard (React):**  
https://securenet-frontend.onrender.com

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

<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/3396310c-ff51-466b-a656-5b1fc4c4669c" />



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
| AI / LLM | Granite-4-h-small |
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

## Distribution of Network Protocol Types

<img width="1081" height="784" alt="image" src="https://github.com/user-attachments/assets/42721421-c8cb-4369-bac0-25fc66656d6f" />


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


---

# 💬 SOC Copilot

IBM Granite powered AI assistant capable of:

- Explaining attacks
- Threat hunting
- Security recommendations
- Incident summaries
- Report generation
- Historical case lookup


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
## Distribution of Network Services


<img width="1483" height="980" alt="image" src="https://github.com/user-attachments/assets/39847ebb-6c63-4846-bba1-892b0d1eb217" />

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

<img width="1531" height="827" alt="image" src="https://github.com/user-attachments/assets/a74b2480-6e08-4a39-8412-09018b8dec1f" />


---

## Chat Assistant

The SecureNet AI SOC Copilot only handles cybersecurity, SOC operations, incident response, threat intelligence, dashboard analytics, and SecureNet AI-related queries.

<img width="509" height="676" alt="image" src="https://github.com/user-attachments/assets/d4854e7c-8a45-41ad-a7aa-d112819cb29f" />

<img width="518" height="668" alt="image" src="https://github.com/user-attachments/assets/7d303d2e-c4d3-47e9-ae57-6041e5d03e1e" />

## Manual intrusion analysis, file upload, and AI-powered SOC chat

<img width="1536" height="822" alt="image" src="https://github.com/user-attachments/assets/c3f3e95b-438e-42bd-a72f-3377ee5aa8fd" />

---

## Threat Heatmap


<img width="1535" height="829" alt="image" src="https://github.com/user-attachments/assets/a952b2e1-575d-4b08-8c7a-b8320bf4171d" />



---

## Knowledge Graph

<img width="1536" height="823" alt="image" src="https://github.com/user-attachments/assets/c504929e-9117-44b3-85f6-35cced3dd540" />


---

## Recent Incidents

<img width="1536" height="839" alt="image" src="https://github.com/user-attachments/assets/0860862d-a2c5-4392-9ff4-c90e13aa07d1" />

## Settings

<img width="1525" height="820" alt="image" src="https://github.com/user-attachments/assets/03039b4b-a59b-48de-9444-838acc3b9532" />
<img width="1938" height="782" alt="image" src="https://github.com/user-attachments/assets/f49bda77-a58c-442a-8e70-3cf707dff22f" />
<img width="1910" height="739" alt="image" src="https://github.com/user-attachments/assets/27f00ded-265f-4ca3-8d8e-a3f6722d0a1a" />
<img width="1880" height="522" alt="image" src="https://github.com/user-attachments/assets/e5451aad-99c6-487f-b83b-c8510db6d7c9" />
<img width="1880" height="423" alt="image" src="https://github.com/user-attachments/assets/74cbe0c7-d0b2-421c-baf4-6a0ed605b92b" />
<img width="1916" height="910" alt="image" src="https://github.com/user-attachments/assets/d5acc2ad-d21b-4088-8acd-a3ec7f756fa9" />
<img width="1760" height="920" alt="image" src="https://github.com/user-attachments/assets/7cfcd284-4f99-439a-9c39-79e77088b8b3" />



---

# 👨‍💻 Author

**Vanteru Bhuvan Reddy**

Computer Science Engineering Student

GitHub: https://github.com/Bhuvan068

---

# 📄 License

MIT License
