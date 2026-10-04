# VitalIQ AI

A full-stack health-monitoring platform for patients, doctors, and administrators — vitals
tracking, appointments, medication adherence, notifications, PDF reporting, and an AI/ML layer
that scores risk, detects anomalies, analyzes trends, and answers a doctor's questions about a
patient's record.

This delivery is complete through **Phase 1 (Foundation)**, **Phase 2 (Workflow Features)**, and
**Phase 3 (AI/ML)**.

---

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────────────┐
│   Browser   │ ───▶ │   Node backend    │ ───▶ │  FastAPI AI service   │
│ (React SPA) │      │ (auth, RBAC, CRUD)│      │ (internal-only, keyed)│
└─────────────┘      └──────────────────┘      └───────────────────────┘
                              │                           │
                              └───────────┬───────────────┘
                                          ▼
                                 ┌──────────────────┐
                                 │     MongoDB       │
                                 │ (shared database) │
                                 └──────────────────┘
```

The browser only ever talks to the Node backend. The Node backend is the only caller of the
Python AI service, forwarding requests after it has already done JWT authentication and
role-based access control — the AI service itself just checks a shared internal API key and
trusts that whoever holds it has already enforced access control correctly. Both services read
from the same MongoDB database.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) + Tailwind CSS + React Router + Recharts + Axios |
| Backend | Node.js + Express + MongoDB (Mongoose) |
| AI/ML service | Python + FastAPI + scikit-learn + pandas + NumPy + Motor (async MongoDB) |
| Auth | JWT, bcrypt, role-based access control |
| Generative AI | Gemini or Anthropic API (optional, auto-detected) — LLM-polished summaries + RAG doctor assistant |
| PDF generation | PDFKit |
| Email | Nodemailer (console fallback if SMTP isn't configured) |

---

## Project structure

```
vitaliq/
├── backend/                 Node/Express API (the only thing the browser talks to)
│   ├── models/                User, HealthReading, Appointment, Medication, MedicationLog,
│   │                           Notification, AuditLog
│   ├── controllers/            auth, users, health readings, doctor, admin, appointments,
│   │                           medications, notifications, reports, audit, ai (proxy)
│   ├── services/aiService.js   The only code that talks to the Python service
│   └── routes/
├── ai-service/               FastAPI microservice (internal-only, Phase 3)
│   ├── app/
│   │   ├── services/            risk, anomaly, trend, what_changed, summary, insights, rag, llm
│   │   └── routers/              one per capability + a combined /analysis endpoint
│   ├── scripts/train_model.py  Trains the risk classifier on synthetic clinical data
│   └── model_artifacts/        Pre-trained model ships here — works out of the box
└── frontend/                 React app
    └── src/
        ├── pages/patient/        Dashboard, Enter Reading, History, AI Insights, Appointments, Medications
        ├── pages/doctor/          Dashboard, Patient List (+ AI sort), Patient Detail (+ AI tabs), Appointments
        ├── pages/admin/            Dashboard (+ AI stats), Manage Users, Create Doctor, Audit Logs
        └── components/             RiskBadge, AIInsightsPanel, AskAIAssistant, NotificationBell, ...
```

---

## Setup

### 1. MongoDB

Run MongoDB locally (`mongodb://127.0.0.1:27017`) or use a hosted cluster.

### 2. AI service (start this first)

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env     # set INTERNAL_API_KEY to a long random string
uvicorn app.main:app --reload --port 8000
```

The risk model ships pre-trained — no extra setup needed. For the LLM-powered summary/assistant
features at **zero cost**, get a free key from https://aistudio.google.com/apikey and set
`GEMINI_API_KEY` in `.env`. Leave both `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` blank and those
features use deterministic fallbacks instead — the project is fully functional either way. See
`ai-service/README.md` for full details.

### 3. Backend

```bash
cd backend
cp .env.example .env
```

Set, at minimum: `JWT_SECRET`, `JWT_RESET_SECRET`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, and
**`AI_SERVICE_INTERNAL_KEY` — must exactly match the AI service's `INTERNAL_API_KEY`.**

```bash
npm install
npm run seed:admin
npm run dev              # http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### 5. First login

1. Sign in with your seeded admin credentials
2. Create a doctor account from the admin dashboard
3. Register a patient at `/register` (separate browser/incognito)
4. As admin, assign that patient to the doctor
5. As the patient, log a few health readings — this is what feeds the AI features
6. Check the patient's **AI Insights** tab, the doctor's **patient detail → AI Insights / Ask AI**
   tabs, and the admin dashboard's AI statistics

---

## What's implemented, by phase

### Phase 1 — Foundation
- Patient self-registration; unified login; JWT auth; forgot/reset password (real email via SMTP
  or console fallback); change password
- Role-based access control enforced on API and frontend routes
- Profile management (all roles) + profile picture upload
- Admin: create doctor accounts, activate/deactivate, assign patients to doctors, change roles
- Patient: log readings (BP, sugar, heart rate, SpO₂, temperature, weight); view latest/history;
  edit/delete readings; paginated history; charts (Recharts)
- Doctor: dashboard, patient list + search, patient detail with full history
- Admin: dashboard with user counts

### Phase 2 — Workflow features
- **Appointments**: patients book with their assigned doctor; doctors approve/reject/complete;
  patients cancel; full status tracking
- **Medications**: doctors prescribe/manage; patients mark taken/missed daily; rolling adherence
  percentage
- **Notifications**: live bell dropdown, auto-generated on appointment/medication events, lazy
  daily medication reminders, admin broadcast, mark read/all read
- **PDF reports**: real PDFKit-generated reports (vitals, medications, appointments), downloadable
  by patients and their doctors
- **Audit logging**: every sensitive admin/doctor action tracked, filterable/paginated viewer
- **Admin appointment analytics** on the dashboard

### Phase 3 — AI/ML
- **Health risk prediction**: a `RandomForestClassifier` (trained on synthetic, clinically-informed
  data — see `ai-service/README.md`) scores each new reading 0–100 and classifies it
  Low/Moderate/High/Critical with a confidence score
- **Anomaly detection**: flags unusual vitals against both absolute clinical bounds and the
  patient's own historical baseline (z-score)
- **Health trend analysis**: linear-regression slope per vital, classified improving/stable/
  worsening, with an overall rollup
- **"What Changed?"**: compares the last 3 readings to the 3 before that, explains the deltas in
  plain language
- **AI health summary**: a grounded template summary, optionally rephrased by Claude (if
  `ANTHROPIC_API_KEY` is set) — the LLM is explicitly forbidden from introducing facts not already
  in the structured data
- **Personalized insights**: deterministic, rule-based recommendations (traceable to a specific
  rule, not LLM-generated)
- **Patient prioritization**: doctors can sort their patient list by AI-computed risk
- **AI confidence score**: surfaced everywhere a risk score is shown
- **RAG + LLM doctor assistant**: doctors ask free-text questions about an assigned patient; the
  service retrieves that patient's actual readings/medications/appointments from MongoDB and
  answers grounded in that data (falls back to keyword-matched extractive results if no LLM key
  is set)
- **High-risk alerts**: logging a reading automatically triggers risk scoring in the background;
  a High/Critical result notifies the patient's assigned doctor
- **Admin AI analytics**: system-wide risk distribution, average risk score, prediction volume

---

## The core workflow, end to end

```
Patient logs a reading
        │
        ▼
MongoDB stores it (Node backend)
        │
        ▼
Node backend fires an async call to the AI service (doesn't block the patient's response)
        │
        ▼
AI service scores risk, writes the result back onto the reading
        │
        ├── High/Critical? → Node backend notifies the assigned doctor
        │
        ▼
Doctor opens the patient → sees risk badge, trend, anomalies, AI summary, insights
        │
        ▼
Doctor asks the AI assistant a free-text question → gets an answer grounded in that
patient's actual record
        │
        ▼
Doctor takes action (adjusts medication, books a follow-up, etc.)
```

---

## Notable design decisions

- **The AI service is never exposed to the browser.** Every `/api/ai/*` route goes through the
  Node backend's existing JWT + RBAC middleware first; the shared `X-Internal-Api-Key` is a second
  layer, not the only one.
- **Fire-and-forget risk scoring.** Logging a reading responds immediately; risk scoring and the
  high-risk notification happen afterward. A slow or down AI service never makes reading
  submission feel broken.
- **LLM use is tightly scoped and grounded.** Both LLM-touching features (summaries, the RAG
  assistant) are instructed to work only from data that was actually retrieved, not to free-
  associate about a patient's health — and both have deterministic fallbacks so the product fully
  functions with zero LLM API cost if desired.
- **Single `User` collection with a `role` field**, and `HealthReading.aiRiskScore`/`aiRiskLevel`
  fields that Phase 1 reserved — Phase 3 writes directly into them, no migration needed.
  `Notification` similarly already had a `high_risk` type reserved from Phase 2.
- **The risk model is synthetic-data-trained and says so, everywhere** — in the training script's
  docstring, the service README, and this README. No real clinical dataset was available, and
  claiming clinical validity it doesn't have would be actively misleading. It's a transparent,
  auditable stand-in, not a certified medical device.
- **Medication reminders are lazy, not cron-based** — generated the first time a patient checks in
  each day, avoiding the need for background job infrastructure in this phase.

---

## Verification performed

- Backend: all files syntax-checked; full server boot tested with every route (Phase 1–3) mounted
- AI service: all files syntax-checked; full app boot tested; the trained risk model was directly
  exercised against high-risk, normal, and partial-data vitals vectors and produced correct,
  well-calibrated classifications and confidence scores
- Frontend: production build succeeds cleanly across all three phases' UI

Not possible to verify in this environment: end-to-end behavior against a live MongoDB instance
(none was available in the sandbox this was built in). Do a quick click-through once you have all
three services running locally against a real database.
