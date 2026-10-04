def generate_insights(risk: dict, trend: dict, anomalies: dict, latest: dict) -> list[dict]:
    """
    Deterministic, rule-based insights — intentionally NOT LLM-generated, so
    every recommendation traces directly back to a specific rule a clinician
    can review. Each insight has a `priority` for sorting in the UI.
    """
    insights = []

    if risk["level"] in ("High", "Critical"):
        insights.append(
            {
                "priority": "high",
                "title": "Elevated risk detected",
                "message": f"Your current risk level is {risk['level']}. Consider reaching out to your care team.",
            }
        )

    per_vital = trend.get("perVital", {})

    bp_worsening = per_vital.get("systolic", {}).get("direction") == "worsening" or per_vital.get("diastolic", {}).get(
        "direction"
    ) == "worsening"
    if bp_worsening:
        insights.append(
            {
                "priority": "medium",
                "title": "Blood pressure trending up",
                "message": "Your blood pressure has been trending upward recently. Reducing sodium intake and monitoring more frequently may help.",
            }
        )

    sugar_worsening = per_vital.get("bloodSugar", {}).get("direction") == "worsening"
    if sugar_worsening:
        insights.append(
            {
                "priority": "medium",
                "title": "Blood sugar trending up",
                "message": "Blood sugar readings have been trending upward. Keep an eye on diet and medication timing.",
            }
        )

    spo2 = latest.get("spo2")
    if spo2 is not None and spo2 < 94:
        insights.append(
            {
                "priority": "high",
                "title": "Low oxygen saturation",
                "message": "Your most recent SpO₂ reading was below the normal range. If you're experiencing shortness of breath, seek care promptly.",
            }
        )

    if anomalies.get("isAnomalous"):
        insights.append(
            {
                "priority": "medium",
                "title": "Unusual reading flagged",
                "message": "One or more of your latest vitals is unusual compared to your recent history. Consider a follow-up reading to confirm.",
            }
        )

    if not insights:
        insights.append(
            {
                "priority": "low",
                "title": "You're on track",
                "message": "Your recent vitals are within expected ranges and trending stable. Keep up the consistent logging.",
            }
        )

    priority_order = {"high": 0, "medium": 1, "low": 2}
    insights.sort(key=lambda i: priority_order[i["priority"]])
    return insights
