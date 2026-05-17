import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { reportsAPI } from "../utils/api";

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportDetails, setReportDetails] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await reportsAPI.getReports();
        const reportsList = res.data.reports || [];
        setReports(reportsList);
      } catch (err) {
        setError("Failed to load reports");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const expandReport = async (report) => {
    if (expandedReport?.id === report.id) {
      setExpandedReport(null);
      return;
    }

    setExpandedReport(report);
    
    if (reportDetails[report.id]) {
      return;
    }

    setDetailLoading(true);

    try {
      const res = await reportsAPI.getReport(report.id);
      const reportData = res.data.report || res.data;
      const details = reportData.content || reportData.data || reportData;
      setReportDetails(prev => ({
        ...prev,
        [report.id]: details
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const resolveReportContent = (item) => {
    return item?.content || item?.data || item;
  };

  const getReportTitle = (report, details) => {
    const content = resolveReportContent(details || report);
    const diagnoses = Array.isArray(content?.diagnoses) ? content.diagnoses : null;

    if (diagnoses && diagnoses.length > 0) {
      return diagnoses[0]?.disease || diagnoses[0]?.name || diagnoses[0]?.label || report.title;
    }

    if (content?.topCondition) {
      return content.topCondition;
    }

    if (Array.isArray(content?.symptoms) && content.symptoms.length > 0) {
      return content.symptoms.join(', ');
    }

    return report.title || report.name || report.conversation_title || report.sessionTitle || "Report";
  };

  const getReportRisk = (report, details) => {
    const content = resolveReportContent(details || report);
    return content?.riskLevel || content?.risk || report?.riskLevel || report?.risk || 'low';
  };

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value || "—");
  };

  const renderReportData = (data) => {
    if (!data) return null;

    // إذا كانت البيانات string، عرضها كما هي
    if (typeof data === 'string') {
      try {
        // محاولة تحليل JSON إذا كانت string
        const parsed = JSON.parse(data);
        return renderReportData(parsed);
      } catch (e) {
        // إذا لم تكن JSON، عرض كما هي
        return (
          <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.8, background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
            {data}
          </div>
        );
      }
    }

    // إذا كانت object، عرض كل الحقول
    if (typeof data === 'object' && data !== null) {
      if (data.content && typeof data.content === 'object') {
        return renderReportData(data.content);
      }

      const entries = Object.entries(data).filter(([key, value]) => 
        value !== null && value !== undefined && value !== '' && key !== 'id' && key !== 'reportId' && key !== 'sessionId'
      );

      if (entries.length === 0) {
        return <p style={{ color: "var(--text-3)" }}>No detailed information available.</p>;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {entries.map(([key, value]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');

            // معاملة خاصة للأعراض
            if (key === 'symptoms' && Array.isArray(value)) {
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🔍</span> Symptoms
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {value.map((symptom, idx) => (
                      <div key={idx} style={{ padding: '8px 14px', background: 'rgba(0,229,255,0.1)', border: '1px solid var(--cyan)', borderRadius: 8, fontSize: 13, color: 'var(--cyan)', fontWeight: 500 }}>
                        {typeof symptom === 'string' ? symptom : JSON.stringify(symptom)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // معاملة خاصة لحقل content
            if (key === 'content' && typeof value === 'object' && value !== null) {
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {renderReportData(value)}
                </div>
              );
            }

            // معاملة خاصة للتشخيصات
            if (key === 'diagnoses' && Array.isArray(value)) {
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⚕️</span> Diagnoses
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {value.map((diagnosis, idx) => {
                      // التعامل مع diagnosis كـ object أو string
                      const diagObj = typeof diagnosis === 'string' ? { disease: diagnosis } : diagnosis;
                      return (
                        <div key={idx} style={{ padding: '16px', background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: diagObj.reasoning ? 10 : 0 }}>
                            <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0, flex: 1 }}>
                              {diagObj.disease || diagObj.name || `Diagnosis ${idx + 1}`}
                            </h5>
                            {diagObj.probability && (
                              <div style={{ padding: '4px 10px', background: 'rgba(255,193,7,0.2)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginLeft: 10, whiteSpace: 'nowrap' }}>
                                {diagObj.probability}%
                              </div>
                            )}
                          </div>
                          {diagObj.reasoning && (
                            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                              {diagObj.reasoning}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // معاملة خاصة لمستوى الخطر
            if (key === 'riskLevel' && typeof value === 'string') {
              const riskColor = value === 'high' ? 'var(--red)' : value === 'medium' ? 'var(--amber)' : 'var(--green)';
              const riskBg = value === 'high' ? 'rgba(255,69,96,0.1)' : value === 'medium' ? 'rgba(255,193,7,0.1)' : 'rgba(76,175,80,0.1)';
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
                    ⚠️ Risk Level
                  </div>
                  <div style={{ padding: '12px 16px', background: riskBg, border: `1px solid ${riskColor}`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: riskColor }}>
                    {value.toUpperCase()}
                  </div>
                </div>
              );
            }

            // معاملة خاصة للتوصيات
            if ((key === 'recommendation' || key === 'recommendations') && typeof value === 'string') {
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💊</span> Recommendation
                  </div>
                  <div style={{ padding: '14px 16px', background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.7 }}>
                    {value}
                  </div>
                </div>
              );
            }

            // معاملة خاصة للتحرير
            if (key === 'disclaimer' && typeof value === 'string') {
              return (
                <div key={key} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  ⓘ {value}
                </div>
              );
            }

            // معاملة خاصة لـ generatedAt
            if (key === 'generatedAt' && typeof value === 'string') {
              try {
                const date = new Date(value);
                return (
                  <div key={key}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
                      📅 Generated At
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
                      {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              } catch (e) {
                return null;
              }
            }

            // الحقول النصية العادية
            if (typeof value === 'string') {
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {value}
                  </div>
                </div>
              );
            }

            // Arrays أخرى
            if (Array.isArray(value)) {
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {value.join(', ')}
                  </div>
                </div>
              );
            }

            // Objects أخرى
            if (typeof value === 'object') {
              return (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--font-display)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(value, null, 2)}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      );
    }

    return <p style={{ color: "var(--text-3)" }}>No detailed information available.</p>;
  };

  return (
    <div style={{ paddingTop: 64, paddingLeft: 240, minHeight: "100vh" }}>
      <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", letterSpacing: "-0.03em", marginBottom: 28 }}>Saved Reports</h1>
        
        {error && (
          <div style={{ background: "rgba(255,69,96,0.08)", border: "1px solid rgba(255,69,96,0.2)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "var(--red)", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>
            Loading reports...
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>
            No reports saved yet.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {reports.map((r) => {
            const isExpanded = expandedReport?.id === r.id;
            const details = reportDetails[r.id];
            const title = getReportTitle(r, details);
            const badgeRisk = getReportRisk(r, details);

            return (
              <div key={r.id} className="glass" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: isExpanded ? "1px solid var(--cyan)" : "1px solid var(--border)", transition: "all 0.3s ease" }}>
                {/* Header */}
                <div style={{ padding: "20px 24px", background: isExpanded ? "rgba(0,229,255,0.04)" : "transparent", borderBottom: isExpanded ? "1px solid var(--border)" : "none", cursor: "pointer", userSelect: "none", transition: "all 0.2s ease" }} onClick={() => expandReport(r)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--cyan-dim)", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="file" size={20} color="var(--cyan)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--text-1)" }}>
                          {title}
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {r.date && (
                            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                              📅 {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {r.pages && (
                            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                              📄 {r.pages} pages
                            </p>
                          )}
                          {r.symptoms && (
                            <p style={{ fontSize: 12, color: "var(--cyan)" }}>
                              🔍 Symptoms: {Array.isArray(r.symptoms) ? r.symptoms.join(', ') : r.symptoms}
                            </p>
                          )}
                          {r.topCondition && (
                            <p style={{ fontSize: 12, color: "var(--amber)" }}>
                              ⚕️ Condition: {r.topCondition} {r.confidence && `(${r.confidence}%)`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span className={`badge ${badgeRisk === "medium" ? "badge-amber" : badgeRisk === "high" ? "badge-red" : "badge-green"}`}>
                        {badgeRisk.toUpperCase()}
                      </span>
                      <Icon name={isExpanded ? "x" : "plus"} size={20} color="var(--text-2)" />
                    </div>
                  </div>

                  {r.summary && !isExpanded && (
                    <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 12, lineHeight: 1.5 }}>
                      {r.summary.length > 100 ? r.summary.substring(0, 100) + "..." : r.summary}
                    </p>
                  )}
                </div>

                {/* Details */}
                {isExpanded && (
                  <div style={{ padding: "24px", animation: "fadeUp 0.2s ease" }}>
                    {/* Original Card Info */}
                    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        📋 Report Information
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {r.date && (
                          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Date</p>
                            <p style={{ fontSize: 13, color: "var(--text-1)" }}>
                              {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        {r.pages && (
                          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Pages</p>
                            <p style={{ fontSize: 13, color: "var(--text-1)" }}>{r.pages}</p>
                          </div>
                        )}
                        {r.risk && (
                          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Risk Level</p>
                            <p style={{ fontSize: 13, color: r.risk === "high" ? "var(--red)" : r.risk === "medium" ? "var(--amber)" : "var(--green)" }}>
                              {r.risk.toUpperCase()}
                            </p>
                          </div>
                        )}
                        {r.confidence && (
                          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Confidence</p>
                            <p style={{ fontSize: 13, color: "var(--cyan)" }}>{r.confidence}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    {r.summary && (
                      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                          📝 Summary
                        </h4>
                        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, background: "rgba(255,255,255,0.02)", padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                          {r.summary}
                        </p>
                      </div>
                    )}

                    {/* Detailed Data */}
                    {detailLoading ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)" }}>
                        Loading details...
                      </div>
                    ) : details ? (
                      <div>
                        <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                          ⚕️ Detailed Analysis
                        </h4>
                        {renderReportData(details)}
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-3)" }}>No details available.</p>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: "8px 16px", flex: 1 }} onClick={() => window.open(r.downloadUrl || r.url || `/api/dashboard/reports/${r.id}/download`, '_blank')}>
                        <Icon name="file" size={13} /> Download
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 16px", flex: 1 }}>
                        <Icon name="mail" size={13} /> Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
