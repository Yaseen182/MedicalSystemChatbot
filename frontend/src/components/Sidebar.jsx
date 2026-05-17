import Icon from "./Icon";

const Sidebar = ({ page, setPage, isAdmin }) => {
  const links = [
    { id: "chat",      label: "New Consultation", icon: "chat"    },
    { id: "dashboard", label: "Dashboard",         icon: "chart"   },
    { id: "history",   label: "History",           icon: "clock"   },
    { id: "reports",   label: "Reports",           icon: "file"    },
    ...(isAdmin ? [{ id: "admin", label: "Admin Panel", icon: "settings" }] : []),
  ];
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: 16, padding: "0 14px" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--text-3)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Navigation</span>
      </div>
      {links.map(l => (
        <button key={l.id} className={`sidebar-link ${page === l.id ? "active" : ""}`}
          onClick={() => setPage(l.id)}>
          <Icon name={l.icon} size={16} color={page === l.id ? "var(--cyan)" : "currentColor"} />
          {l.label}
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
