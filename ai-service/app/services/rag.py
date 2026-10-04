from bson import ObjectId
from ..database import users, health_readings, medications, appointments
from .llm import call_llm, is_llm_configured

SYSTEM_PROMPT = (
    "You are a clinical assistant helping a doctor quickly review one of their patients. "
    "Answer the doctor's question using ONLY the patient record context provided below. "
    "If the answer isn't in the context, say so plainly rather than guessing. "
    "Do not invent vitals, dates, or medications that aren't in the context. "
    "You may summarize, compare, or compute simple statistics (averages, counts, trends) "
    "from the data given. Keep answers concise and clinically useful. "
    "You are not providing a diagnosis — frame observations as data points for the doctor's own judgment."
)


async def _build_context(patient_id: str) -> str:
    patient = await users.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        return ""

    readings_cursor = health_readings.find({"patient": ObjectId(patient_id)}).sort("recordedAt", -1).limit(30)
    readings = [r async for r in readings_cursor]

    meds_cursor = medications.find({"patient": ObjectId(patient_id)}).sort("createdAt", -1).limit(20)
    meds = [m async for m in meds_cursor]

    appts_cursor = appointments.find({"patient": ObjectId(patient_id)}).sort("requestedDate", -1).limit(10)
    appts = [a async for a in appts_cursor]

    lines = [
        f"Patient: {patient.get('name')}, gender: {patient.get('gender', 'unknown')}, "
        f"blood group: {patient.get('bloodGroup', 'unknown')}",
        "",
        f"Recent vitals readings (most recent first, {len(readings)} shown):",
    ]
    for r in readings:
        parts = []
        for key, label in [
            ("systolic", "systolic"),
            ("diastolic", "diastolic"),
            ("bloodSugar", "sugar"),
            ("heartRate", "HR"),
            ("spo2", "SpO2"),
            ("temperature", "temp"),
            ("weight", "weight"),
        ]:
            if r.get(key) is not None:
                parts.append(f"{label}={r[key]}")
        lines.append(f"- {r.get('recordedAt')}: " + ", ".join(parts))

    lines.append("")
    lines.append(f"Medications ({len(meds)} shown):")
    for m in meds:
        status = "active" if m.get("isActive") else "inactive"
        lines.append(f"- {m.get('name')} {m.get('dosage')}, {m.get('frequency')} ({status})")

    lines.append("")
    lines.append(f"Recent appointments ({len(appts)} shown):")
    for a in appts:
        lines.append(f"- {a.get('requestedDate')}: {a.get('status')} — {a.get('reason')}")

    return "\n".join(lines)


def _extractive_fallback(question: str, context: str) -> str:
    """
    No LLM configured — do a simple keyword-overlap pass over context lines
    and return the most relevant ones directly, rather than attempting any
    generation. Transparent about its own limitation.
    """
    question_words = {w.lower().strip("?.,") for w in question.split() if len(w) > 3}
    scored = []
    for line in context.split("\n"):
        if not line.strip():
            continue
        overlap = sum(1 for w in question_words if w in line.lower())
        if overlap > 0:
            scored.append((overlap, line))
    scored.sort(key=lambda x: -x[0])
    top_lines = [line for _, line in scored[:6]]

    if not top_lines:
        return (
            "No LLM is configured for this deployment, and no directly matching data was found "
            "for that question. Here's the full recent record context instead:\n\n" + context[:1200]
        )
    return (
        "No LLM is configured for this deployment — showing the record lines most relevant to "
        "your question instead of a generated answer:\n\n" + "\n".join(top_lines)
    )


async def ask_assistant(patient_id: str, question: str) -> dict:
    context = await _build_context(patient_id)
    if not context:
        return {"answer": "Patient not found or has no record data yet.", "source": "none", "patientFound": False}

    user_message = f"Patient record context:\n\n{context}\n\nDoctor's question: {question}"
    answer = await call_llm(SYSTEM_PROMPT, user_message, max_tokens=500)

    if answer:
        return {"answer": answer, "source": "llm", "patientFound": True}

    return {"answer": _extractive_fallback(question, context), "source": "extractive_fallback", "patientFound": True}
