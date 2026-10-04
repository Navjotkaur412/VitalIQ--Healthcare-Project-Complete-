from .llm import call_llm

SYSTEM_PROMPT = (
    "You are a clinical documentation assistant rewriting a structured health summary into "
    "warm, plain-language prose for a patient or their doctor to read. You MUST NOT introduce "
    "any fact, number, diagnosis, or recommendation that is not already present in the structured "
    "data you're given. Do not speculate about causes. Do not give medical advice or medication "
    "guidance. Keep it to 3-5 short sentences. If the data shows normal/stable results, say so "
    "plainly and reassuringly rather than inventing concerns."
)


def _template_summary(risk: dict, trend: dict, anomalies: dict, what_changed: dict) -> str:
    parts = []

    parts.append(
        f"Current risk level is {risk['level']} (score {risk['score']}/100, "
        f"{risk['confidence']}% model confidence)."
    )

    overall_trend = trend.get("overall", "stable")
    if overall_trend == "stable":
        parts.append("Vitals have been stable over the recent period.")
    elif overall_trend == "improving":
        parts.append("Overall trend is improving.")
    elif overall_trend == "worsening":
        parts.append("Overall trend shows some vitals worsening — worth a closer look.")
    else:
        parts.append("Trends are mixed: some vitals improving, others worsening.")

    if anomalies.get("isAnomalous"):
        vital_names = ", ".join(a["vital"] for a in anomalies["anomalies"][:3])
        parts.append(f"The latest reading flagged {anomalies['anomalyCount']} unusual value(s): {vital_names}.")

    if what_changed.get("changeCount", 0) > 0:
        top = what_changed["changes"][0]
        parts.append(top["explanation"])

    return " ".join(parts)


async def generate_summary(risk: dict, trend: dict, anomalies: dict, what_changed: dict) -> dict:
    template = _template_summary(risk, trend, anomalies, what_changed)

    structured_facts = (
        f"Risk level: {risk['level']} (score {risk['score']}/100, confidence {risk['confidence']}%)\n"
        f"Overall trend: {trend.get('overall')}\n"
        f"Anomalies detected: {anomalies.get('anomalyCount', 0)} "
        f"({', '.join(a['vital'] for a in anomalies.get('anomalies', [])) or 'none'})\n"
        f"Notable changes: {'; '.join(c['explanation'] for c in what_changed.get('changes', [])) or 'none'}"
    )

    polished = await call_llm(SYSTEM_PROMPT, structured_facts, max_tokens=300)

    return {
        "summary": polished or template,
        "source": "llm" if polished else "template",
    }
