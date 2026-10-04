# VitalIQ AI Service (Phase 3)

FastAPI microservice providing risk prediction, anomaly detection, trend analysis, AI summaries,
personalized insights, patient prioritization, and a RAG-backed doctor assistant.

**This service is internal-only.** The browser never talks to it directly — the Node backend's
`/api/ai/*` routes do normal JWT auth + role checks first, then forward the request here with a
shared secret header (`X-Internal-Api-Key`). Treat this service like you'd treat a database: not
meant to be reachable from the public internet directly.

## Setup

```bash
cd ai-service
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt

cp .env.example .env
# Edit .env:
#   MONGO_URI            — same database as the Node backend
#   INTERNAL_API_KEY      — must exactly match AI_SERVICE_INTERNAL_KEY in backend/.env
#   GEMINI_API_KEY        — optional but recommended: free, no-credit-card key from
#                           https://aistudio.google.com/apikey — enables LLM-polished
#                           summaries + the RAG assistant at zero cost
#   ANTHROPIC_API_KEY     — optional alternative to Gemini (no free tier)

python scripts/train_model.py     # trains and saves the risk model (already included, but
                                   # re-run any time to retrain)

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/health` to confirm it's running, or `http://localhost:8000/docs`
for the interactive Swagger UI (useful for testing endpoints directly during development — just
remember to set the `X-Internal-Api-Key` header in the "Authorize" dialog).

## What each endpoint does

| Endpoint | Capability |
|---|---|
| `POST /risk/{patient_id}/compute` | Scores a reading (explicit or the patient's latest), writes the result back onto the `HealthReading` document |
| `GET /risk/{patient_id}/latest` | Risk score for the patient's latest reading, without writing anywhere |
| `GET /anomalies/{patient_id}` | Flags unusual values in the latest reading vs. the patient's own history |
| `GET /trend/{patient_id}` | Per-vital improving/stable/worsening classification + overall rollup |
| `GET /what-changed/{patient_id}` | Compares the last 3 readings to the 3 before that, explains deltas |
| `GET /summary/{patient_id}` | Plain-language AI summary (template, optionally LLM-polished) |
| `GET /insights/{patient_id}` | Rule-based personalized recommendations |
| `GET /analysis/{patient_id}` | **All of the above combined in one call** — this is what the frontend actually uses |
| `GET /prioritization/{doctor_id}` | A doctor's patients, ranked by risk level/score |
| `POST /assistant/ask` | RAG doctor assistant — `{ patientId, question }` |
| `GET /admin/stats` | Risk distribution and prediction volume, system-wide |

## The risk model

`scripts/train_model.py` generates a synthetic dataset using published clinical reference ranges
(AHA blood pressure categories, ADA blood sugar categories, normal HR/SpO₂/temperature bands) to
assign a risk label to simulated vitals, then trains a `RandomForestClassifier` to learn a
generalized version of that rule. The trained artifact ships in `model_artifacts/risk_model.joblib`
so the service works out of the box — re-run the script any time to retrain.

**This is not clinically validated.** There's no real labeled patient dataset backing it — it's a
transparent, auditable stand-in appropriate for a project at this stage. Swap in a real,
ethically-sourced, IRB-approved dataset before this goes anywhere near real patients.

## The LLM integration

Two features can use an LLM: **AI summaries** (rephrases already-computed structured facts into
plain language — explicitly forbidden from introducing new facts/numbers/recommendations, keeping
hallucination risk low for health content) and **the RAG assistant** (retrieves the patient's
actual readings/medications/appointments from MongoDB and answers only from that context).

Both features work with **zero LLM configured** — summaries fall back to a deterministic
template, and the assistant falls back to keyword-matching extractive search over the same
retrieved context (no generation, just surfacing the most relevant raw data). So the project is
fully functional before you set up any LLM at all.

### Two supported providers

| | Gemini | Anthropic (Claude) |
|---|---|---|
| Free tier | Yes — Flash models, no credit card | No perpetual free tier |
| Get a key | https://aistudio.google.com/apikey | https://console.anthropic.com |
| Env var | `GEMINI_API_KEY` | `ANTHROPIC_API_KEY` |

Set `LLM_PROVIDER=auto` (the default) and it picks Gemini if `GEMINI_API_KEY` is set, otherwise
Anthropic if `ANTHROPIC_API_KEY` is set, otherwise neither (fallbacks only). Set it explicitly to
`gemini` or `anthropic` to force one.

**For a working project with zero cost**, get a free Gemini key from Google AI Studio and set
only `GEMINI_API_KEY` — that's the whole setup. Both the summary and assistant features were
tested against the real Gemini endpoint during development (with an intentionally invalid key, to
confirm the request reaches Google and fails gracefully) — drop in a real key and it works.
