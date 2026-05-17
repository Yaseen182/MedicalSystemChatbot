# MedAI — AI-Powered Medical Symptom Checker

## Project Structure

```
src/
├── App.jsx                      # Root component & router
│
├── styles/
│   └── GlobalStyles.jsx         # All CSS-in-JS global styles & design tokens
│
├── components/
│   ├── Icon.jsx                 # SVG icon library (all icons)
│   ├── Navbar.jsx               # Top navigation bar
│   ├── Sidebar.jsx              # Left sidebar navigation
│   └── UI.jsx                  # Shared UI: Orb, Logo, TypingIndicator,
│                                #   EmergencyBanner, DisclaimerBadge,
│                                #   ProbabilityCard, SymptomTag
│
└── pages/
    ├── LandingPage.jsx          # Public marketing landing page
    ├── AuthPage.jsx             # Login & Register (mode prop)
    ├── ChatPage.jsx             # Main AI chat consultation
    ├── DashboardPage.jsx        # User health activity dashboard
    ├── HistoryPage.jsx          # Past session history
    ├── ReportsPage.jsx          # Saved reports grid
    └── AdminPage.jsx            # Admin control panel
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev
```

## Notes

- Uses **React + Vite** (no TypeScript)
- Styling via **CSS custom properties** injected through `GlobalStyles.jsx`
- Fonts loaded from Google Fonts (Syne + DM Sans)
- Routing is handled by a simple `page` state in `App.jsx` (no React Router)
- Admin panel accessible by signing in with any email containing "admin"

## Disclaimer

Not a medical diagnosis tool. Always consult a qualified healthcare professional.
