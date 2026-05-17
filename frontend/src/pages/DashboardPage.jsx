import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { dashboardAPI } from "../utils/api";

const DashboardPage = ({ user, setPage }) => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sessionsRes, statsRes] = await Promise.all([
          dashboardAPI.getSessions(),
          dashboardAPI.getStats()
        ]);
        
        setSessions(sessionsRes.data.sessions || []);
        setStats(statsRes.data);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const riskBadge = (r) => ({ high: "badge-red", medium: "badge-amber", low: "badge-green" }[r] || "badge-cyan");
  const riskTimeline = sessions.slice(-12).map((s, index) => {
    const rawDate = s.date || s.started_at || s.created_at;
    const dateLabel = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short' }) : `#${index + 1}`;
    const level = s.riskLevel || 'low';
    const value = level === 'high' ? 90 : level === 'medium' ? 60 : 35;
    return { label: dateLabel, level, value, key: `${s.id || index}` };
  });

  return (
    <div style={{ paddingTop: 64, paddingLeft: 240, minHeight: "100vh" }}>
      <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Welcome back, <span style={{ color: "var(--cyan)" }}>{user?.name}</span>
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>Here's your health activity overview.</p>
        </div>

        {error && (
          <div style={{ background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.2)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "var(--red)", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Sessions",   value: stats?.totalSessions || "0", icon: "chat",     color: "var(--cyan)"  },
            { label: "Symptoms Logged",  value: stats?.symptomsLogged || "0", icon: "activity", color: "var(--green)" },
            { label: "High Risk Events", value: stats?.highRiskEvents || "0", icon: "alert",    color: "var(--red)"   },
            { label: "Reports Saved",    value: stats?.reportsSaved || "0", icon: "file",     color: "var(--amber)" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</span>
                <div style={{ opacity: 0.5 }}><Icon name={s.icon} size={15} color={s.color} /></div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* SESSION TABLE */}
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Recent Sessions</h2>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => setPage("chat")}>
              <Icon name="plus" size={13} /> New Consultation
            </button>
          </div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)" }}>Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)" }}>No sessions yet. Start your first consultation!</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Symptoms</th><th>Top Condition</th><th>Risk Level</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontWeight: 500 }}>{new Date(s.date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(s.symptoms || []).slice(0, 2).map(sym => (
                          <span key={sym} style={{ fontSize: 11, padding: "2px 8px", background: "var(--cyan-dim)", borderRadius: 99, color: "var(--cyan)" }}>{sym}</span>
                        ))}
                        {(s.symptoms || []).length > 2 && <span style={{ fontSize: 11, color: "var(--text-3)" }}>+{(s.symptoms || []).length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-1)" }}>{s.topCondition || "—"}</td>
                    <td><span className={`badge ${riskBadge(s.riskLevel)}`}>{(s.riskLevel || "low").toUpperCase()}</span></td>
                    <td><span className={`badge ${s.status === "flagged" ? "badge-red" : "badge-green"}`}>{s.status}</span></td>
                    <td><button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}>View Report</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RISK CHART */}
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "24px", marginTop: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Risk History Timeline</h3>
          {sessions.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)" }}>Start a consultation to populate your risk timeline.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {riskTimeline.map((item) => (
                <div key={item.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: item.level === "high" ? "var(--red)" : item.level === "medium" ? "var(--amber)" : "var(--cyan)", opacity: 0.85, minHeight: 4 }}>
                    <div style={{ height: `${item.value}%` }} />
                  </div>
                  <span style={{ fontSize: 9, color: "var(--text-3)", textAlign: "center", width: "100%" }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
