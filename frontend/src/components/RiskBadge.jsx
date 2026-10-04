import React from "react";

const STYLES = {
  Low: "bg-brand-light text-brand-dark",
  Moderate: "bg-amber-50 text-status-moderate",
  High: "bg-orange-50 text-status-high",
  Critical: "bg-signal-light text-signal",
};

const RiskBadge = ({ level, score, size = "md" }) => {
  if (!level) return null;
  const sizeClass = size === "lg" ? "text-sm px-3 py-1.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`badge ${STYLES[level] || "bg-line text-muted"} ${sizeClass} font-semibold`}>
      {level} risk{score != null ? ` · ${score}/100` : ""}
    </span>
  );
};

export default RiskBadge;
