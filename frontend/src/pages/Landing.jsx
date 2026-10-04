import React from "react";
import { Link } from "react-router-dom";
import PulseLine from "../components/PulseLine";

const Landing = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center px-4">
    <div className="text-center max-w-lg">
      <div className="inline-flex items-center gap-2 mb-8">
        <span className="h-2.5 w-2.5 rounded-full bg-signal" />
        <span className="font-display font-semibold text-lg tracking-tight text-ink">VitalIQ AI</span>
      </div>
      <PulseLine className="mx-auto w-64 mb-6" height={40} />
      <h1 className="font-display text-3xl font-semibold text-ink mb-3">Know your vitals. Act early.</h1>
      <p className="text-muted mb-8">
        Track blood pressure, sugar, heart rate, and more — with your care team watching alongside you.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link to="/login" className="btn-primary">
          Sign in
        </Link>
        <Link to="/register" className="btn-secondary">
          Create patient account
        </Link>
      </div>
    </div>
  </div>
);

export default Landing;
