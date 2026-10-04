import React from "react";

// The signature element: a single-stroke ECG waveform that draws itself in.
// Used sparingly — auth screens and dashboard header dividers only.
const PulseLine = ({ className = "", color = "#0F5C56", height = 48 }) => (
  <svg viewBox="0 0 620 60" fill="none" className={className} height={height} preserveAspectRatio="none">
    <path
      className="pulse-line"
      d="M0 30 H90 L110 30 L125 10 L140 50 L155 4 L170 56 L185 30 L210 30 L225 18 L240 30 H620"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default PulseLine;
