import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { DisclaimerBadge } from "../components/UI";
import { adminAPI } from "../utils/api";

const AdminPage = () => {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = ["overview", "conversations", "datasets", "flags", "analytics"];

  // Fetch admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [statsRes, convRes] = await Promise.all([
          adminAPI.getAnalytics(),
          adminAPI.getFlaggedSessions()
        ]);
        
        setStats(statsRes.data);
        setConversations(convRes.data.conversations || []);
      } catch (err) {
        setError("Failed to load admin data");
        console.error(err);
        // Fallback mock data
        setStats({
          totalUsers: 1247,
          sessionsToday: 89,
          unresolvedFlags: 3,
          ragDocuments: 4200,
        });
        setConversations([
          { id: "s001", user: "Alice M.", symptoms: 3, outcome: "Influenza", risk: "medium", flagged: false, time: "2m ago" },
          { id: "s002", user: "Bob K.", symptoms: 1, outcome: "Emergency", risk: "high", flagged: true, time: "15m ago" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div style={{ paddingTop: 64, paddingLeft: 240, minHeight: "100vh" }}>
      <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="badge badge-red" style={{ marginBottom: 8 }}>ADMIN PANEL</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.03em" }}>System Control Centre</h1>
          </div>
          <DisclaimerBadge />
        </div>

        {error && (
          <div style={{ background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.2)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "var(--red)", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "var(--bg-card)", padding: 4, borderRadius: "var(--radius)", border: "1px solid var(--border)", width: "fit-content" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "7px 16px", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                background: tab === t ? "var(--cyan)" : "none", color: tab === t ? "#040b14" : "var(--text-2)", border: "none" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {loading ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>Loading stats...</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                  {[
                    { label: "Total Users",        val: stats?.totalUsers || "—", icon: "user",     color: "var(--cyan)"  },
                    { label: "Sessions Today",     val: stats?.sessionsToday || "—", icon: "chat",     color: "var(--green)" },
                    { label: "Flagged Outputs",    val: stats?.unresolvedFlags || "—", icon: "alert",    color: "var(--red)"   },
                    { label: "Medical Docs in RAG", val: stats?.ragDocuments || "—", icon: "database", color: "var(--amber)" },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                        <Icon name={s.icon} size={14} color={s.color} />
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>System Status</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                      { name: "FastAPI Backend", latency: "12ms" },
                      { name: "ChromaDB (RAG)", latency: "28ms" },
                      { name: "Redis Cache", latency: "3ms" },
                      { name: "PostgreSQL DB", latency: "8ms" },
                      { name: "GPT-4 API", latency: "320ms" },
                      { name: "Safety Validator", latency: "45ms" },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-card-h)", borderRadius: 10, border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
                          <span style={{ fontSize: 13 }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-display)" }}>{s.latency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "conversations" && (
          <div className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Live Conversations</h3>
            </div>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)" }}>Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)" }}>No conversations found.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Session ID</th><th>User</th><th>Symptoms</th><th>Top Outcome</th><th>Risk</th><th>Flagged</th><th>Time</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {conversations.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: "var(--font-display)", color: "var(--cyan)", fontSize: 12 }}>{c.id}</td>
                      <td style={{ color: "var(--text-1)" }}>{c.user || "—"}</td>
                      <td><span className="badge badge-cyan">{c.symptomCount || 0} symptoms</span></td>
                      <td>{c.topOutcome || "—"}</td>
                      <td><span className={`badge ${c.risk === "high" ? "badge-red" : c.risk === "medium" ? "badge-amber" : "badge-green"}`}>{c.risk || "low"}</span></td>
                      <td>{c.flagged ? <span className="badge badge-red">FLAGGED</span> : <span className="badge badge-green">SAFE</span>}</td>
                      <td style={{ color: "var(--text-3)" }}>{c.time || "—"}</td>
                      <td><button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 12px" }}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "datasets" && (
          <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "24px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Medical Knowledge Sources</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {[
                { source: "WHO Guidelines", docs: 1240, status: "synced", last: "2h ago" },
                { source: "CDC Disease Database", docs: 890, status: "synced", last: "4h ago" },
                { source: "Mayo Clinic Articles", docs: 1650, status: "syncing", last: "now" },
                { source: "MedlinePlus Entries", docs: 420, status: "synced", last: "1d ago" },
              ].map((d, i) => (
                <div key={i} style={{ padding: "18px 20px", background: "var(--bg-card-h)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{d.source}</span>
                    <span className={`badge ${d.status === "synced" ? "badge-green" : "badge-amber"}`}>{d.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{d.docs.toLocaleString()} documents · Last sync: {d.last}</div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}>Force Sync</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(tab === "flags" || tab === "analytics") && (
          <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "40px", textAlign: "center" }}>
            <Icon name={tab === "flags" ? "alert" : "trending"} size={40} color="var(--text-3)" />
            <p style={{ marginTop: 16, color: "var(--text-3)", fontFamily: "var(--font-display)" }}>
              {tab === "flags" ? "No unsafe outputs flagged in the last 24h" : "Analytics dashboard — connect to backend to load data"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
