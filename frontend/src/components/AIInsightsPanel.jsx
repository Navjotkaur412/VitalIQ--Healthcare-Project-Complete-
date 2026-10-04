import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RiskBadge from "./RiskBadge";
import { formatDateTime } from "../lib/vitals";

const TREND_ICON = { improving: "↓", worsening: "↑", stable: "→", mixed: "↕" };
const TREND_STYLE = {
  improving: "text-brand",
  worsening: "text-signal",
  stable: "text-muted",
  mixed: "text-status-moderate",
};

const PRIORITY_STYLE = {
  high: "border-signal/30 bg-signal-light",
  medium: "border-status-moderate/30 bg-amber-50",
  low: "border-brand/20 bg-brand-light",
};

const VITAL_LABEL = {
  systolic: "Systolic BP",
  diastolic: "Diastolic BP",
  bloodSugar: "Blood Sugar",
  heartRate: "Heart Rate",
  spo2: "SpO₂",
  temperature: "Temperature",
  weight: "Weight",
};

// patientId: omit to fetch the logged-in patient's own data; pass an id for a doctor/admin viewing a patient
const AIInsightsPanel = ({ patientId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/ai/analysis/${patientId || ""}`;
        const { data } = await api.get(url);
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load AI insights");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card h-28 animate-pulse" />
        <div className="card h-40 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-signal">{error}</p>
        <p className="text-xs text-muted mt-1">The AI service may be offline — this doesn't affect your other data.</p>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="card text-center py-10">
        <p className="text-ink font-medium">No AI insights yet</p>
        <p className="text-sm text-muted mt-1">Log a health reading to generate a risk score and insights.</p>
      </div>
    );
  }

  const { risk, trend, anomalies, whatChanged, summary, insights, basedOn } = data;

  return (
    <div className="space-y-6">
      {/* Risk + summary */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <RiskBadge level={risk.level} score={risk.score} size="lg" />
          <p className="text-xs text-muted">
            {risk.confidence}% model confidence · based on reading from {formatDateTime(basedOn)}
          </p>
        </div>
        <p className="text-sm text-ink leading-relaxed">{summary.summary}</p>
        <p className="text-[11px] text-muted/70 mt-2">
          {summary.source === "llm" ? "AI-polished summary" : "Generated from structured data"}
        </p>
      </div>

      {/* Trend */}
      <div className="card">
        <h3 className="font-display font-semibold text-ink mb-3">
          Trend —{" "}
          <span className={TREND_STYLE[trend.overall] || "text-ink"}>
            {TREND_ICON[trend.overall] || ""} {trend.overall}
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(trend.perVital)
            .filter(([, v]) => v.direction !== "insufficient_data")
            .map(([vital, v]) => (
              <div key={vital} className="flex items-center justify-between bg-bg rounded-lg px-3 py-2">
                <span className="text-xs text-muted">{VITAL_LABEL[vital]}</span>
                <span className={`text-xs font-semibold ${TREND_STYLE[v.direction] || "text-ink"}`}>
                  {TREND_ICON[v.direction] || ""} {v.direction}
                </span>
              </div>
            ))}
        </div>
        {Object.values(trend.perVital).every((v) => v.direction === "insufficient_data") && (
          <p className="text-sm text-muted text-center py-4">Not enough history yet to detect a trend.</p>
        )}
      </div>

      {/* Anomalies */}
      {anomalies.isAnomalous && (
        <div className="card border-signal/30">
          <h3 className="font-display font-semibold text-signal mb-3">⚠ Unusual readings flagged</h3>
          <div className="space-y-2">
            {anomalies.anomalies.map((a, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-ink">{VITAL_LABEL[a.vital] || a.vital}:</span>{" "}
                <span className="text-muted">
                  {a.value} — {a.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What changed */}
      {whatChanged.changeCount > 0 && (
        <div className="card">
          <h3 className="font-display font-semibold text-ink mb-3">What changed</h3>
          <ul className="space-y-1.5">
            {whatChanged.changes.map((c, i) => (
              <li key={i} className="text-sm text-muted">
                • {c.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Insights */}
      <div className="card">
        <h3 className="font-display font-semibold text-ink mb-3">Personalized insights</h3>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className={`border rounded-lg px-4 py-3 ${PRIORITY_STYLE[ins.priority]}`}>
              <p className="text-sm font-semibold text-ink">{ins.title}</p>
              <p className="text-sm text-muted mt-0.5">{ins.message}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted/70 text-center">
        AI-generated insights are informational and not a substitute for professional medical advice.
      </p>
    </div>
  );
};

export default AIInsightsPanel;
