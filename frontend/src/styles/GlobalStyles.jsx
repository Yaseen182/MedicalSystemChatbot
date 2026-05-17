const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep:    #f5fbf6;
      --bg-card:    rgba(255,255,255,0.92);
      --bg-card-h:  rgba(237,252,245,0.9);
      --border:     rgba(34,197,94,0.18);
      --border-h:   rgba(34,197,94,0.35);
      --cyan:       #16a34a;
      --cyan-dim:   rgba(52,211,153,0.16);
      --cyan-glow:  rgba(52,211,153,0.22);
      --green:      #22c55e;
      --green-dim:  rgba(34,197,94,0.12);
      --red:        #ef4444;
      --amber:      #f59e0b;
      --text-1:     #0f172a;
      --text-2:     #334155;
      --text-3:     #475569;
      --font-display: 'Syne', sans-serif;
      --font-body:    'DM Sans', sans-serif;
      --radius:     12px;
      --radius-lg:  20px;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg-deep);
      color: var(--text-1);
      font-family: var(--font-body);
      font-size: 15px;
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-h); border-radius: 2px; }

    .grid-bg {
      background-image:
        linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .glass {
      background: var(--bg-card);
      border: 1px solid var(--border);
      box-shadow: 0 16px 40px rgba(15,23,42,0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .glass:hover { border-color: var(--border-h); }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    @keyframes typing-dot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30%            { transform: translateY(-6px); opacity: 1; }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-12px); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }

    .anim-fade-up  { animation: fadeUp 0.55s ease both; }
    .anim-fade-in  { animation: fadeIn 0.4s ease both; }
    .anim-float    { animation: float 4s ease-in-out infinite; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 11px 24px; border-radius: var(--radius); font-family: var(--font-display);
      font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease;
      border: none; text-decoration: none; white-space: nowrap;
    }
    .btn-primary {
      background: var(--cyan); color: #ffffff;
      box-shadow: 0 0 20px rgba(34,197,94,0.25);
    }
    .btn-primary:hover { background: #22c55e; box-shadow: 0 0 28px rgba(34,197,94,0.25); transform: translateY(-1px); }
    .btn-ghost {
      background: transparent; color: var(--text-1);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { border-color: var(--border-h); background: var(--bg-card-h); }
    .btn-danger {
      background: var(--red); color: #ffffff;
      box-shadow: 0 0 16px rgba(239,68,68,0.25);
    }

    .input {
      width: 100%; background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 12px 16px; color: var(--text-1);
      font-family: var(--font-body); font-size: 14px; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input:focus { border-color: var(--border-h); box-shadow: 0 0 0 3px var(--cyan-dim); }
    .input::placeholder { color: var(--text-3); }

    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 99px; font-size: 11px;
      font-family: var(--font-display); font-weight: 600; letter-spacing: 0.05em;
    }
    .badge-cyan  { background: var(--cyan-dim);  color: var(--cyan);  border: 1px solid rgba(0,229,255,0.2); }
    .badge-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(0,255,136,0.2); }
    .badge-red   { background: rgba(255,69,96,0.1); color: var(--red); border: 1px solid rgba(255,69,96,0.2); }
    .badge-amber { background: rgba(255,179,0,0.1); color: var(--amber); border: 1px solid rgba(255,179,0,0.2); }

    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: 64px; display: flex; align-items: center; padding: 0 32px;
      background: rgba(255,255,255,0.92); border-bottom: 1px solid rgba(34,197,94,0.18);
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    }

    .sidebar {
      position: fixed; left: 0; top: 64px; bottom: 0; width: 240px;
      background: rgba(255,255,255,0.96); border-right: 1px solid rgba(34,197,94,0.18);
      backdrop-filter: blur(20px); padding: 24px 16px;
      display: flex; flex-direction: column; gap: 4px; z-index: 90;
    }
    .sidebar-link {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      border-radius: var(--radius); font-size: 14px; cursor: pointer;
      color: var(--text-2); transition: all 0.18s; border: 1px solid transparent;
      font-family: var(--font-body); background: none;
    }
    .sidebar-link:hover, .sidebar-link.active {
      background: var(--bg-card-h); color: var(--text-1); border-color: var(--border);
    }
    .sidebar-link.active { color: var(--cyan); border-color: var(--cyan-dim); }

    .typing-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--cyan); }
    .typing-dot:nth-child(1) { animation: typing-dot 1.2s 0.0s infinite; }
    .typing-dot:nth-child(2) { animation: typing-dot 1.2s 0.2s infinite; }
    .typing-dot:nth-child(3) { animation: typing-dot 1.2s 0.4s infinite; }

    .prob-bar { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
    .prob-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

    .symptom-tag {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 99px; font-size: 12px;
      background: var(--cyan-dim); border: 1px solid rgba(0,229,255,0.25);
      color: var(--cyan); font-family: var(--font-display); font-weight: 600;
      animation: fadeUp 0.3s ease both;
    }

    .emergency-banner {
      background: linear-gradient(135deg, rgba(255,69,96,0.15), rgba(255,69,96,0.05));
      border: 1px solid rgba(255,69,96,0.4);
      border-radius: var(--radius); padding: 16px 20px;
      animation: fadeUp 0.3s ease;
    }

    .card { border-radius: var(--radius-lg); padding: 24px; }

    .stat-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 20px 24px;
      transition: border-color 0.2s, transform 0.2s;
    }
    .stat-card:hover { border-color: var(--border-h); transform: translateY(-2px); }

    .table { width: 100%; border-collapse: collapse; }
    .table th { padding: 10px 16px; text-align: left; font-size: 11px; letter-spacing: 0.08em; color: var(--text-3); font-family: var(--font-display); border-bottom: 1px solid var(--border); text-transform: uppercase; }
    .table td { padding: 14px 16px; font-size: 13px; color: var(--text-2); border-bottom: 1px solid rgba(255,255,255,0.03); }
    .table tr:hover td { background: var(--bg-card-h); }

    .ring-chart { position: relative; display: inline-flex; align-items: center; justify-content: center; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(4,11,20,0.8);
      backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
      z-index: 200; animation: fadeIn 0.2s ease;
    }
    .modal {
      background: #080f1c; border: 1px solid var(--border-h);
      border-radius: var(--radius-lg); padding: 32px; max-width: 480px; width: 90%;
      animation: fadeUp 0.3s ease;
    }

    .bubble-ai {
      background: #eefaf0; border: 1px solid rgba(34,197,94,0.18);
      border-radius: 4px 18px 18px 18px; padding: 14px 18px;
      max-width: 80%; animation: fadeUp 0.3s ease;
      color: var(--text-1);
    }
    .bubble-ai strong {
      font-weight: 700;
      color: var(--cyan);
    }
    .bubble-user {
      background: #dcfce7; border: 1px solid rgba(34,197,94,0.2);
      border-radius: 18px 4px 18px 18px; padding: 14px 18px;
      max-width: 80%; margin-left: auto; animation: fadeUp 0.3s ease;
      color: var(--text-1);
    }

    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); transition: transform 0.3s; }
      .sidebar.open { transform: translateX(0); }
      .nav { padding: 0 16px; }
    }
  `}</style>
);

export default GlobalStyles;
