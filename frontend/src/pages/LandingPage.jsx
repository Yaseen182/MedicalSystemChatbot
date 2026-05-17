import Icon from "../components/Icon";
import { Orb } from "../components/UI";

const LandingPage = ({ setPage }) => {
  const features = [
    { icon: "brain",     title: "Conversational AI",      desc: "Ask questions like a real doctor — dynamic follow-ups that adapt to your answers in real time." },
    { icon: "activity",  title: "Disease Probability",     desc: "Ranked differential diagnoses with confidence scores, grounded in WHO, CDC, and Mayo Clinic data." },
    { icon: "shield",    title: "Emergency Detection",     desc: "Instantly detects dangerous symptoms and prompts you to seek emergency care immediately." },
    { icon: "database",  title: "RAG Medical Knowledge",   desc: "Retrieval-Augmented Generation pulls from medical literature for factually grounded responses." },
    { icon: "lock",      title: "HIPAA-Inspired Security", desc: "JWT authentication, encrypted sessions, and strict input validation protect your health data." },
    { icon: "chart",     title: "Personal Dashboard",      desc: "Track symptom history, view past reports, and monitor your health risk timeline." },
  ];

  const steps = [
    { n: "01", title: "Describe Symptoms",  desc: "Type your symptoms naturally. The AI understands plain language." },
    { n: "02", title: "AI Asks Follow-ups", desc: "Dynamic questions clarify severity, duration, and context." },
    { n: "03", title: "Get Insights",       desc: "Ranked possible conditions with probabilities and next steps." },
  ];

  const stats = [
    { val: "99.1%", label: "Safety Accuracy"   },
    { val: "6",     label: "AI Agents"          },
    { val: "12K+",  label: "Medical Conditions" },
    { val: "<2s",   label: "Response Time"      },
  ];

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", paddingTop: 64, position: "relative", overflow: "hidden" }}>
      <Orb color="var(--cyan)"  size="600px" top="-200px" left="-100px" opacity={0.07} />
      <Orb color="#0066ff"      size="500px" top="200px"  right="-150px" opacity={0.06} />
      <Orb color="var(--green)" size="300px" top="60vh"   left="30%"    opacity={0.05} />

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "100px 32px 80px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32 }} className="anim-fade-up">
          <span className="badge badge-cyan">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }} />
            AI-POWERED MEDICAL ASSISTANT
          </span>
        </div>

        <h1 className="anim-fade-up" style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "clamp(2.4rem, 6vw, 4.2rem)", lineHeight: 1.1,
          letterSpacing: "-0.04em", marginBottom: 24, animationDelay: "0.1s"
        }}>
          Your symptoms, <br />
          <span style={{
            background: "linear-gradient(90deg, var(--cyan), #4db8ff, var(--green))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>intelligently analysed</span>
        </h1>

        <p className="anim-fade-up" style={{
          fontSize: "1.1rem", color: "var(--text-2)", maxWidth: 560, margin: "0 auto 40px",
          lineHeight: 1.75, animationDelay: "0.2s"
        }}>
          MedAI is a multi-agent AI system trained on medical literature that asks the right questions, surfaces probable conditions, and tells you when to seek urgent care.
        </p>

        <div className="anim-fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.3s" }}>
          <button className="btn btn-primary" style={{ padding: "14px 32px", fontSize: 15 }} onClick={() => setPage("register")}>
            <Icon name="chat" size={16} />
            Start Consultation — Free
          </button>
          <button className="btn btn-ghost" style={{ padding: "14px 28px", fontSize: 15 }} onClick={() => setPage("login")}>
            Sign In
          </button>
        </div>

        <p className="anim-fade-up" style={{ fontSize: 12, color: "var(--text-3)", marginTop: 20, animationDelay: "0.4s" }}>
          🛡 Not a medical diagnosis. Always consult a healthcare professional.
        </p>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="anim-fade-up">
          {stats.map((s, i) => (
            <div key={i} className="glass card" style={{ textAlign: "center", padding: "20px 16px", animationDelay: `${i * 0.08}s` }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--cyan)", marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 900, margin: "0 auto 100px", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="badge badge-cyan" style={{ marginBottom: 16 }}>HOW IT WORKS</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.03em" }}>Three steps to clarity</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} className="glass card anim-fade-up" style={{ animationDelay: `${i * 0.12}s`, position: "relative" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, color: "var(--border-h)", marginBottom: 12, lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{s.desc}</p>
              {i < 2 && (
                <div style={{ position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)", color: "var(--border-h)", fontSize: 20 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1000, margin: "0 auto 100px", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="badge badge-green" style={{ marginBottom: 16 }}>CAPABILITIES</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.03em" }}>Built for precision, designed for trust</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="glass card anim-fade-up" style={{ animationDelay: `${i * 0.08}s`, position: "relative", overflow: "hidden" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, var(--cyan-dim), rgba(0,102,255,0.1))",
                border: "1px solid var(--border-h)", display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: 16
              }}>
                <Icon name={f.icon} size={20} color="var(--cyan)" />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: "0 auto 100px", padding: "0 32px", textAlign: "center" }}>
        <div className="glass card" style={{ padding: "48px 40px", position: "relative", overflow: "hidden" }}>
          <Orb color="var(--cyan)" size="300px" top="-100px" left="50%" opacity={0.08} />
          <span className="badge badge-amber" style={{ marginBottom: 20 }}>START NOW</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.03em", marginBottom: 16 }}>
            Not sure about your symptoms?
          </h2>
          <p style={{ color: "var(--text-2)", marginBottom: 28, lineHeight: 1.65 }}>
            Talk to MedAI in seconds. No appointment, no waiting room — get medically-grounded insight, 24/7.
          </p>
          <button className="btn btn-primary" style={{ padding: "14px 36px", fontSize: 15 }} onClick={() => setPage("register")}>
            <Icon name="stethoscope" size={16} />
            Begin Your Consultation
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
        <p style={{ marginTop: 12 }}>© 2025 MedAI. For informational purposes only. Not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
