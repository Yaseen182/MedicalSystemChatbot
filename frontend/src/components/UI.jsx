import { useState, useEffect } from "react";
import Icon from "./Icon";

export const Orb = ({ color, size, top, left, right, bottom, opacity = 0.18 }) => (
  <div className="orb" style={{
    width: size, height: size, background: color, opacity,
    top, left, right, bottom,
  }} />
);

export const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: "linear-gradient(135deg, var(--cyan), #0066ff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 16px var(--cyan-glow)",
    }}>
      <Icon name="stethoscope" size={18} color="#ffffff" />
    </div>
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "black" }}>
      Med<span style={{ color: "var(--cyan)" }}>AI</span>
    </span>
  </div>
);

export const TypingIndicator = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "14px 18px" }}
       className="bubble-ai">
    <span className="typing-dot" />
    <span className="typing-dot" />
    <span className="typing-dot" />
  </div>
);

export const EmergencyBanner = ({ onDismiss }) => (
  <div className="emergency-banner" style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: "rgba(255,69,96,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        border: "1px solid rgba(255,69,96,0.4)"
      }}>
        <Icon name="alert" size={18} color="var(--red)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>
          ⚠ Emergency Symptoms Detected
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          Based on your symptoms, you may need <strong style={{ color: "var(--text-1)" }}>immediate medical attention</strong>. Please call emergency services (911) or go to your nearest emergency room now.
        </div>
        <button className="btn btn-danger" style={{ marginTop: 10, fontSize: 12, padding: "8px 16px" }}
          onClick={onDismiss}>
          I Understand — Dismiss
        </button>
      </div>
    </div>
  </div>
);

export const DisclaimerBadge = () => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
    background: "rgba(255,179,0,0.06)", border: "1px solid rgba(255,179,0,0.15)",
    borderRadius: 99, fontSize: 11, color: "var(--amber)"
  }}>
    <Icon name="shield" size={12} color="var(--amber)" />
    <span>NOT a medical diagnosis — consult a healthcare professional</span>
  </div>
);

export const ProbabilityCard = ({ disease, probability, rank, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(probability), 300 + delay);
    return () => clearTimeout(t);
  }, [probability, delay]);
  const color = probability >= 60 ? "var(--red)" : probability >= 30 ? "var(--amber)" : "var(--cyan)";
  return (
    <div className="glass" style={{
      borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 8,
      animationDelay: `${delay}ms`, animation: "fadeUp 0.4s ease both"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, background: "var(--bg-card-h)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-3)"
          }}>#{rank}</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{disease}</span>
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color }}>{probability}%</span>
      </div>
      <div className="prob-bar">
        <div className="prob-fill" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
};

export const SymptomTag = ({ label, onRemove }) => (
  <span className="symptom-tag">
    {label}
    {onRemove && (
      <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.6, display: "flex" }}>
        <Icon name="x" size={10} />
      </span>
    )}
  </span>
);
