import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Icon from "../components/Icon";
import { TypingIndicator, EmergencyBanner, DisclaimerBadge, ProbabilityCard, SymptomTag } from "../components/UI";
import { chatAPI } from "../utils/api";

// ── Constants ──────────────────────────────────────────────
const INITIAL_MESSAGE = "Hello! I'm MedAI, your AI medical assistant. I'll ask you a few questions to help understand your symptoms better. Please describe what you're experiencing today.";

// ── Component ──────────────────────────────────────────────
const ChatPage = ({ user }) => {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [isTyping,  setIsTyping]  = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [symptoms,  setSymptoms]  = useState([]);
  const [diagnoses, setDiagnoses] = useState(null);
  const [phase,     setPhase]     = useState("chat"); // chat | results
  const [sessionId, setSessionId] = useState(null);
  const [error,     setError]     = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Create session on component mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await chatAPI.createSession();
        const newSessionId = res.data.session.id;
        setSessionId(newSessionId);
        setMessages([{ 
          id: 1, 
          role: "ai", 
          text: INITIAL_MESSAGE, 
          time: new Date() 
        }]);
      } catch (err) {
        setError("Failed to create chat session");
        console.error(err);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || isTyping) return;
    setInput("");

    const userMsg = { id: Date.now(), role: "user", text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);

    setIsTyping(true);
    try {
      const res = await chatAPI.sendMessage(sessionId, text);
      const { message, type, diagnoses: newDiagnoses, extractedSymptoms, isComplete } = res.data;

      // Check for emergency
      if (type === 'emergency') {
        setEmergency(true);
      }

      // Update symptoms
      if (extractedSymptoms?.symptoms) {
        setSymptoms(prev => [...new Set([...prev, ...extractedSymptoms.symptoms])]);
      }

      const aiMsg = { 
        id: Date.now() + 1, 
        role: "ai", 
        text: message, 
        time: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);

      // If analysis complete, show results
      if (isComplete) {
        await new Promise(r => setTimeout(r, 1000));
        setPhase("results");
        if (newDiagnoses) {
          setDiagnoses(newDiagnoses);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send message";
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e) => { 
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    } 
  };

  const resetChat = async () => {
    try {
      const res = await chatAPI.createSession();
      const newSessionId = res.data.session.id;
      setSessionId(newSessionId);
      setMessages([{ 
        id: 1, 
        role: "ai", 
        text: INITIAL_MESSAGE, 
        time: new Date() 
      }]);
      setInput(""); 
      setIsTyping(false); 
      setEmergency(false);
      setSymptoms([]); 
      setDiagnoses(null);
      setPhase("chat");
      setError(null);
    } catch (err) {
      setError("Failed to start new session");
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", paddingTop: 64, paddingLeft: 240 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* HEADER */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, var(--cyan), #0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="stethoscope" size={20} color="#ffffff" />
              </div>
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--bg-deep)" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>MedAI Assistant</div>
              <div style={{ fontSize: 11, color: "var(--green)" }}>● Online · Powered by GPT-4 + Medical RAG</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {symptoms.length > 0 && <span className="badge badge-cyan">{symptoms.length} symptom{symptoms.length > 1 ? "s" : ""} detected</span>}
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "7px 14px" }} onClick={resetChat}>
              <Icon name="chat" size={13} /> New Session
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {emergency && <EmergencyBanner onDismiss={() => setEmergency(false)} />}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
              {msg.role === "ai" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4, marginBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, var(--cyan), #0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="stethoscope" size={12} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-display)" }}>MedAI</span>
                </div>
              )}
              <div className={msg.role === "ai" ? "bubble-ai" : "bubble-user"}>
                {msg.role === "ai" ? (
                  <ReactMarkdown style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>{msg.text}</ReactMarkdown>
                ) : (
                  <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>{msg.text}</p>
                )}
              </div>
              <span style={{ fontSize: 10, color: "var(--text-3)", padding: "0 4px" }}>
                {msg.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, var(--cyan), #0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="cross" size={12} color="#040b14" />
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-display)" }}>MedAI is thinking…</span>
              </div>
              <TypingIndicator />
            </div>
          )}

          {/* RESULTS */}
          {phase === "results" && diagnoses && (
            <div style={{ animation: "fadeUp 0.5s ease" }}>
              <div style={{ padding: "20px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>Analysis Results</h3>
                    <DisclaimerBadge />
                  </div>
                  <span className="badge badge-green"><Icon name="check" size={10} /> Complete</span>
                </div>

                {symptoms.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.08em", fontFamily: "var(--font-display)", marginBottom: 10, textTransform: "uppercase" }}>Detected Symptoms</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {symptoms.map(s => <SymptomTag key={s} label={s} />)}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.08em", fontFamily: "var(--font-display)", marginBottom: 12, textTransform: "uppercase" }}>Possible Conditions</div>
                  {diagnoses.map((d, i) => <ProbabilityCard key={i} {...d} rank={i + 1} delay={i * 150} />)}
                </div>

                <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text-2)" }}>
                  <strong style={{ color: "var(--green)" }}>Recommendation:</strong> Based on your symptoms, consider visiting a general practitioner. Bring this report with you. If symptoms worsen, seek care sooner.
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        {phase === "chat" && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                className="input"
                ref={inputRef}
                style={{ resize: "none", minHeight: 48, maxHeight: 120, lineHeight: 1.5, paddingTop: 12, background: isTyping ? "rgba(15,23,42,0.04)" : undefined, cursor: isTyping ? "not-allowed" : undefined }}
                placeholder={isTyping ? "Waiting for MedAI response..." : "Describe your symptoms... e.g. 'I have a headache and mild fever'"}
                value={input}
                onChange={e => !isTyping && setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={isTyping}
              />
              <button className="btn btn-primary" style={{ padding: "12px 18px", flexShrink: 0 }}
                onClick={sendMessage} disabled={!input.trim() || isTyping}>
                <Icon name="send" size={16} />
              </button>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Headache & fever", "Chest pain", "Sore throat & cough", "Fatigue & nausea"].map(s => (
                <button key={s} className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "results" && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={resetChat}>Start New Consultation</button>
            <button className="btn btn-primary">
              <Icon name="file" size={14} /> Save Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
