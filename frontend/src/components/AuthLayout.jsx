import React from "react";
import PulseLine from "./PulseLine";

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="font-display font-semibold text-lg tracking-tight text-ink">VitalIQ AI</span>
        </div>
        <PulseLine className="mx-auto w-48 mb-4" height={32} />
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
      </div>
      <div className="card">{children}</div>
    </div>
  </div>
);

export default AuthLayout;
