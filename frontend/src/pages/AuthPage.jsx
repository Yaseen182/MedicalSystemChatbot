import { useState } from "react";
import Icon from "../components/Icon";
import { Orb, Logo, DisclaimerBadge } from "../components/UI";
import { authAPI } from "../utils/api";

const AuthPage = ({ mode, setPage, onAuth }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Please fill in all fields.");
    if (mode === "register" && form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (mode === "register" && !form.name) return setError("Please enter your name.");
    
    setLoading(true);
    try {
      let response;
      if (mode === "register") {
        response = await authAPI.register({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      } else {
        response = await authAPI.login({
          email: form.email,
          password: form.password,
        });
      }

      const { user, token } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onAuth(user);
      setPage("chat");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Authentication failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", paddingTop: 64, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Orb color="var(--cyan)" size="400px" top="-100px" left="-100px" opacity={0.08} />
      <Orb color="#0066ff" size="350px" bottom="-100px" right="-100px" opacity={0.06} />

      <div className="glass anim-fade-up" style={{ width: "100%", maxWidth: 440, borderRadius: "var(--radius-lg)", padding: "40px 36px", margin: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo />
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", marginTop: 20, marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>
            {mode === "login" ? "Sign in to continue your health journey" : "Start your first AI consultation"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "var(--font-display)", fontWeight: 600 }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><Icon name="user" size={15} /></span>
                <input className="input" style={{ paddingLeft: 40 }} placeholder="Dr. Jane Smith"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "var(--font-display)", fontWeight: 600 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><Icon name="mail" size={15} /></span>
              <input className="input" style={{ paddingLeft: 40 }} placeholder="you@example.com" type="email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "var(--font-display)", fontWeight: 600 }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><Icon name="lock" size={15} /></span>
              <input className="input" style={{ paddingLeft: 40, paddingRight: 42 }} placeholder="••••••••"
                type={showPass ? "text" : "password"}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", opacity: 0.5, color: "var(--text-1)" }}>
                <Icon name="eye" size={15} />
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "var(--font-display)", fontWeight: 600 }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><Icon name="lock" size={15} /></span>
                <input className="input" style={{ paddingLeft: 40 }} placeholder="••••••••" type="password"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--red)", display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="alert" size={14} color="var(--red)" /> {error}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: "100%", padding: "13px", justifyContent: "center", marginTop: 4 }}
            onClick={handle} disabled={loading}>
            {loading ? (
              <span style={{ width: 16, height: 16, border: "2px solid rgba(4,11,20,0.3)", borderTopColor: "#040b14", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            ) : (
              <>{mode === "login" ? "Sign In" : "Create Account"}</>
            )}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-3)" }}>
          {mode === "login" ? (
            <>Don't have an account? <button style={{ color: "var(--cyan)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }} onClick={() => setPage("register")}>Register</button></>
          ) : (
            <>Already have an account? <button style={{ color: "var(--cyan)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }} onClick={() => setPage("login")}>Sign In</button></>
          )}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
          <DisclaimerBadge />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
