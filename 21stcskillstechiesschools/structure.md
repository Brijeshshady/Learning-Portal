# 21st Century Skills Learning Portal — Project Structure

This document provides a comprehensive overview of the full-stack MERN directory layout, detailing the frontend view layers, state managers, Mongoose databases, and load-balanced AI services.

---

```
21stcskillstechiesschools/
├── server/                           # Backend Node/Express Server
│   ├── models/                       # MongoDB / Mongoose Schemas
│   │   ├── User.js                   # Authenticated credentials and settings
│   │   ├── School.js                 # School codes, hardware logs, limits
│   │   ├── Token.js                  # Temporary session tokens
│   │   ├── Progress.js               # Syllabus roadmap checkpoint history
│   │   └── Certificate.js            # Verifiable tech credentials issued
│   ├── services/                     # Microservices and AI Integrations
│   │   ├── aiManager.js              # Multi-key rotation (5 slots) & cooldown manager
│   │   └── aiService.js              # Core AI generative chat engines
│   └── server.js                     # Express routers, middleware, and secure API routes
│
├── src/                              # Frontend React Client
│   ├── assets/                       # Static media and brand typography
│   ├── components/                   # Modular UI Components
│   │   ├── AIChatWidget.jsx          # AI Chat sidebar overlay with offline capabilities
│   │   ├── CertificateTemplate.jsx   # Credentials PDF blueprint used by html2pdf
│   │   ├── DashboardShell.jsx        # Premium metric grids, KPI cards, charts
│   │   ├── SettingsModal.jsx         # Profile config with synchronized MERN endpoints
│   │   ├── Sidebar.jsx               # Navigation bar mapped by user roles
│   │   ├── Navbar.jsx                # Global session status and search panel
│   │   ├── Modal.jsx                 # Reusable window wrappers
│   │   └── ToastContainer.jsx        # Action success/error alert system
│   ├── context/                      # React State Contexts
│   │   └── AuthContext.jsx           # Global login/logout session manager
│   ├── hooks/                        # Custom React Hooks
│   │   └── useStore.js               # Zustand-like reactive data pipeline
│   ├── layouts/                      # Layout Shells
│   │   └── DashboardLayout.jsx       # Standard sidebar/navbar wrapper for panels
│   ├── lib/                          # Client-Side Utilities
│   │   ├── db.js                     # HTTP request service with auth fallback logic
│   │   ├── store.js                  # Core client-side database
│   │   └── mapping.js                # Coordinates to hardware hub locations
│   ├── pages/                        # Views & Dashboards
│   │   ├── Home.jsx                  # Main public landing page
│   │   ├── Login.jsx                 # Sleek dark-mode sign-in screen
│   │   ├── Register.jsx              # Student and organization registration
│   │   ├── StudentDashboard.jsx      # AI Labs, Roadmap, Gamified Wall of Fame
│   │   ├── TeacherPanel.jsx          # Student rosters, grading, certificates logs
│   │   ├── SchoolAdminDashboard.jsx  # Teacher roster, student limits, hardware inventory
│   │   ├── AdminDashboard.jsx        # Global School Hubs register, server alerts
│   │   └── Community.jsx             # Technical discussion and showcase forum
│   ├── index.css                     # HSL variables, dark theme base, custom animations
│   ├── main.jsx                      # App root container mount
│   └── App.jsx                       # Client-side router mappings
│
├── public/                           # Core public assets
├── dist/                             # Compiled client build package
├── tailwind.config.js                # Custom color palettes and typography rules
├── vite.config.js                    # Vite bundler parameters
├── package.json                      # NPM environment dependencies
└── .env                              # Encrypted server-side variables (AI keys)
```

---

## Component Descriptions

### 1. Backend Layer (`server/`)
* **`server.js`:** The core orchestrator. Integrates Mongoose connection protocols, auth filters (`protect`), and serves standard REST APIs.
* **`services/aiManager.js`:** Highly resilient load balancer. Houses five separate API key slots and manages rate cooldown timers with automatic failover fallback support.

### 2. View Layer (`src/pages/`)
* **`StudentDashboard.jsx`:** Features gamified learning panels. Students complete interactive lessons, consult their AI Mentor, view roadmap progress, and benchmark their progress on the **Wall of Fame (Leaderboard)**.
* **`TeacherPanel.jsx`:** Unified grading and administration suite. Educators can examine dynamic student rosters, grade uploaded deliverables, record attendance registers, and issue digital certificates.
* **`SchoolAdminDashboard.jsx` / `AdminDashboard.jsx`:** Organizational tools. Allows admins to control enrollment pools, assign license tokens, check server load trends, and manage active hardware IoT labs.

### 3. State & Core Libs (`src/lib/`)
* **`store.js`:** Reactive in-memory state engine. Provides immediate updates to frontend elements and seamlessly fallback-buffers backend connections to avoid user experience latency.
* **`db.js`:** Encapsulates REST API wrappers, managing JWT authentication headers automatically.
