import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const SUGGESTED_QUESTIONS = [
  "Summarize this patient's recent vitals trend.",
  "Has their blood pressure been under control lately?",
  "Are they adherent to their medications?",
  "What changed since their last few readings?",
];

const AskAIAssistant = ({ patientId }) => {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState([]); // [{ question, answer, source }]
  const [loading, setLoading] = useState(false);

  const ask = async (q) => {
    const text = (q ?? question).trim();
    if (!text) return;
    setLoading(true);
    setQuestion("");
    try {
      const { data } = await api.post("/ai/assistant/ask", { patientId, question: text });
      setExchanges((prev) => [...prev, { question: text, answer: data.answer, source: data.source }]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reach the AI assistant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-display font-semibold text-ink mb-3">Ask AI about this patient</h3>

      {exchanges.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-line text-muted hover:bg-brand-light hover:text-brand-dark transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {exchanges.length > 0 && (
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {exchanges.map((ex, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-ink mb-1">{ex.question}</p>
              <p className="text-sm text-muted whitespace-pre-wrap">{ex.answer}</p>
              {ex.source === "extractive_fallback" && (
                <p className="text-[11px] text-muted/60 mt-1">No LLM configured — showing matched record data.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          placeholder="Ask a question about this patient's records…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()} className="btn-primary whitespace-nowrap">
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>
    </div>
  );
};

export default AskAIAssistant;
