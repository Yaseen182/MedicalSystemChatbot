import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { SymptomTag } from "../components/UI";
import { chatAPI } from "../utils/api";

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await chatAPI.getSessions();
        const sessions = res.data.sessions || [];
        
        const transformedItems = sessions.map(s => ({
          id: s.id,
          date: new Date(s.started_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          duration: s.duration || "—",
          symptoms: s.symptoms || [],
          result: s.topCondition ? `${s.topCondition} — ${s.confidence}%` : "—",
          risk: s.riskLevel || "low",
        }));
        
        setItems(transformedItems);
      } catch (err) {
        setError("Failed to load session history");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const viewSessionHistory = async (sessionId) => {
    setSelectedSession(sessionId);
    setHistory([]);
    setHistoryError(null);
    setHistoryLoading(true);

    try {
      const res = await chatAPI.getHistory(sessionId);
      const historyItems = res.data.history || [];
      setHistory(historyItems);
    } catch (err) {
      setHistoryError("Failed to load session details");
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 64, paddingLeft: 240, minHeight: "100vh" }}>
      <div style={{ padding: "32px 36px", maxWidth: 900 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.03em", marginBottom: 28 }}>Session History</h1>
        
        {error && (
          <div style={{ background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.2)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "var(--red)", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>
            Loading sessions...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>
            No sessions found. Start your first consultation!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item, i) => (
            <div key={item.id || i} className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: item.risk === "high" ? "rgba(255,69,96,0.1)" : item.risk === "medium" ? "rgba(255,179,0,0.1)" : "var(--green-dim)",
                border: `1px solid ${item.risk === "high" ? "rgba(255,69,96,0.2)" : item.risk === "medium" ? "rgba(255,179,0,0.2)" : "rgba(0,255,136,0.2)"}`,
              }}>
                <Icon name="activity" size={20} color={item.risk === "high" ? "var(--red)" : item.risk === "medium" ? "var(--amber)" : "var(--green)"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{item.date}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 10 }}>· {item.duration}</span>
                  </div>
                  <span className={`badge ${item.risk === "high" ? "badge-red" : item.risk === "medium" ? "badge-amber" : "badge-green"}`}>{item.risk} risk</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {(item.symptoms || []).map(s => <SymptomTag key={s} label={s} />)}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  <strong style={{ color: "var(--text-1)" }}>Result:</strong> {item.result}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "7px 14px", flexShrink: 0 }} onClick={() => viewSessionHistory(item.id)}>
                <Icon name="eye" size={13} /> View
              </button>
            </div>
          ))}

          {selectedSession && (
            <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "20px 24px", marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Session Details</h2>
                  <p style={{ color: "var(--text-3)", fontSize: 13 }}>Conversation history for the selected session.</p>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setSelectedSession(null)}>
                  Close
                </button>
              </div>

              {historyLoading ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)" }}>Loading details...</div>
              ) : historyError ? (
                <div style={{ color: "var(--red)", fontSize: 13 }}>{historyError}</div>
              ) : history.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)" }}>No session details available.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {history.map((msg, idx) => (
                    <div key={idx} style={{ padding: "14px 18px", borderRadius: "var(--radius)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{msg.role === "user" ? "User" : "MedAI"}</div>
                      <div style={{ color: "var(--text-1)", fontSize: 14, lineHeight: 1.7 }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
