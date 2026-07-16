import { useState, useEffect } from "react";

// Styles
import GlobalStyles from "./styles/GlobalStyles";

// Layout
import Navbar  from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import LandingPage   from "./pages/LandingPage";
import AuthPage      from "./pages/AuthPage";
import ChatPage      from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import ReportsPage   from "./pages/ReportsPage";
import AdminPage     from "./pages/AdminPage";

// API
import { authAPI } from "./utils/api";

export default function App() {
  const [page,        setPage]        = useState("landing");
  const [user,        setUser]        = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          // Try to validate token by fetching profile
          const profileRes = await authAPI.getProfile();
          setUser(profileRes.data);
          setPage("chat");
        }
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  const handleAuth   = (userData) => setUser(userData);
  const handleLogout = () => { 
    setUser(null); 
    setPage("landing");
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const showSidebar = user && !["landing", "login", "register"].includes(page);

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh", 
          background: "var(--bg-deep)", 
          color: "var(--text-2)" 
        }}>
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Navbar
        page={page} setPage={setPage}
        user={user} onLogout={handleLogout}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      />
      {showSidebar && <Sidebar page={page} setPage={setPage} isAdmin={user?.role === "admin"} />}

      <main>
        {page === "landing"   && <LandingPage setPage={setPage} />}
        {page === "login"     && <AuthPage mode="login"    setPage={setPage} onAuth={handleAuth} />}
        {page === "register"  && <AuthPage mode="register" setPage={setPage} onAuth={handleAuth} />}
        {page === "chat"      && user && <ChatPage user={user} />}
        {page === "dashboard" && user && <DashboardPage user={user} setPage={setPage} />}
        {page === "reports"   && user && <ReportsPage />}
        {page === "admin"     && user?.role === "admin" && <AdminPage />}

        {user && !["chat","dashboard","reports","admin","landing","login","register"].includes(page) && (
          <div style={{ paddingTop: 64, paddingLeft: 240, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-3)", fontSize: 14 }}>Page not found</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setPage("chat")}>Go to Chat</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
