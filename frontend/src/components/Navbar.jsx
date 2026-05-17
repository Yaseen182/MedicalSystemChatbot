import Icon from "./Icon";
import { Logo, DisclaimerBadge } from "./UI";

const Navbar = ({ page, setPage, user, onLogout, sidebarOpen, setSidebarOpen }) => (
  <nav className="nav">
    <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
      {user && (
        <button className="btn btn-ghost" style={{ padding: "8px 10px", display: "none" }}
          onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Icon name="menu" size={16} />
        </button>
      )}
      <button onClick={() => setPage(user ? "chat" : "landing")} style={{ background: "none", border: "none", cursor: "pointer" }}>
        <Logo />
      </button>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {!user ? (
        <>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setPage("login")}>Sign In</button>
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setPage("register")}>Get Started</button>
        </>
      ) : (
        <>
          <DisclaimerBadge />
          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 8px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--cyan), #0066ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#040b14"
            }}>{user.name?.[0]?.toUpperCase()}</div>
            <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={onLogout}>
              <Icon name="logout" size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  </nav>
);

export default Navbar;
