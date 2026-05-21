# 21st Century Skills Learning Portal — Project Structure

This document provides a comprehensive overview of the full-stack MERN directory layout, detailing the frontend view layers, state managers, Mongoose databases, and load-balanced AI services.

---

### Workspace Root Layout
All non-runtime assets, design mockups, and static resources reside outside the active codebase in a consolidated `assets/` directory at the repository root:
```
Brijesh Git Portal/           # Workspace Root
├── package.json              # Forwarder package config
├── package-lock.json
├── .gitignore
│
├── 21stcskillstechiesschools/ # Active MERN codebase
│   ├── package.json          # Root orchestrator
│   ├── client/               # Isolated Vite React Client
│   └── server/               # Isolated Express Node Server
│
└── assets/                   # Consolidated Design & Dev Assets
    ├── docs/                 # General project proposals and docs
    ├── data/                 # Raw course curriculum syllabus files
    ├── scratch/              # Standalone developer test scripts
    ├── Ui designs/           # Project UI design resources
    └── temp_syllabus/        # Raw syllabus reference folders
```

---

### active codebase structure (`21stcskillstechiesschools/`)
```
21stcskillstechiesschools/
├── package.json                      # Root orchestrator package config
│
├── client/                           # Frontend React Client
│   ├── public/                       # Core public assets
│   ├── src/                          # Frontend React Client Source
│   │   ├── assets/                   # Static media and brand typography
│   │   ├── components/               # Modular UI Components
│   │   │   ├── AIChatWidget.jsx      # AI Chat sidebar overlay with offline capabilities
│   │   │   ├── CertificateTemplate.jsx # Credentials PDF blueprint used by html2pdf
│   │   │   ├── DashboardShell.jsx    # Premium metric grids, KPI cards, charts
│   │   │   ├── SettingsModal.jsx     # Profile config with synchronized MERN endpoints
│   │   │   ├── Sidebar.jsx           # Navigation bar mapped by user roles
│   │   │   ├── Navbar.jsx            # Global session status and search panel
│   │   │   ├── Modal.jsx             # Reusable window wrappers
│   │   │   └── ToastContainer.jsx    # Action success/error alert system
│   │   ├── context/                  # React State Contexts
│   │   │   └── AuthContext.jsx       # Global login/logout session manager
│   │   ├── hooks/                    # Custom React Hooks
│   │   │   └── useStore.js           # Zustand-like reactive data pipeline
│   │   ├── layouts/                  # Layout Shells
│   │   │   └── DashboardLayout.jsx   # Standard sidebar/navbar wrapper for panels
│   │   ├── lib/                      # Client-Side Utilities
│   │   │   ├── db.js                 # HTTP request service with auth fallback logic
│   │   │   ├── store.js              # Core client-side database
│   │   │   └── mapping.js            # Coordinates to hardware hub locations
│   │   ├── pages/                    # Views & Dashboards
│   │   │   ├── Home.jsx              # Main public landing page
│   │   │   ├── Login.jsx             # Sleek dark-mode sign-in screen
│   │   │   ├── Register.jsx          # Student and organization registration
│   │   │   ├── StudentDashboard.jsx  # AI Labs, Roadmap, Gamified Wall of Fame
│   │   │   ├── TeacherPanel.jsx      # Student rosters, grading, certificates logs
│   │   │   ├── SchoolAdminDashboard.jsx # Teacher roster, student limits, hardware inventory
│   │   │   ├── AdminDashboard.jsx    # Global School Hubs register, server alerts
│   │   │   └── Community.jsx         # Technical discussion and showcase forum
│   │   ├── index.css                 # HSL variables, dark theme base, custom animations
│   │   ├── main.jsx                  # App root container mount
│   │   └── App.jsx                   # Client-side router mappings
│   ├── tailwind.config.js            # Custom color palettes and typography rules
│   ├── postcss.config.js             # PostCSS plugins (autoprefixer)
│   ├── vite.config.js                # Vite bundler parameters
│   ├── package.json                  # Client NPM environment dependencies
│   └── index.html                    # Root index HTML page
│
└── server/                           # Backend Node/Express Server
    ├── models/                       # MongoDB / Mongoose Schemas
    │   ├── User.js                   # Authenticated credentials and settings
    │   ├── School.js                 # School codes, hardware logs, limits
    │   ├── Token.js                  # Temporary session tokens
    │   ├── Progress.js               # Syllabus roadmap checkpoint history
    │   └── Certificate.js            # Verifiable tech credentials issued
    ├── services/                     # Microservices and AI Integrations
    │   ├── aiManager.js              # Multi-key rotation (5 slots) & cooldown manager
    │   └── aiService.js              # Core AI generative chat engines
    ├── seed.js                       # Standalone database sync/seed script
    ├── server.js                     # Express routers, middleware, and secure API routes
    └── package.json                  # Server NPM environment dependencies
```

---

## Component Descriptions

### 1. Backend Layer (`server/`)
* **`server.js`:** The core orchestrator. Integrates Mongoose connection protocols, auth filters (`protect`), and serves standard REST APIs.
* **`services/aiManager.js`:** Highly resilient load balancer. Houses five separate API key slots and manages rate cooldown timers with automatic failover fallback support.
* **`seed.js`:** Standalone seed script. Connects to MongoDB to initialize and synchronize schools, admins, and tokens.

### 2. View Layer (`client/src/pages/`)
* **`StudentDashboard.jsx`:** Features gamified learning panels. Students complete interactive lessons, consult their AI Mentor, view roadmap progress, and benchmark their progress on the **Wall of Fame (Leaderboard)**.
* **`TeacherPanel.jsx`:** Unified grading and administration suite. Educators can examine dynamic student rosters, grade uploaded deliverables, record attendance registers, and issue digital certificates.
* **`SchoolAdminDashboard.jsx` / `AdminDashboard.jsx`:** Organizational tools. Allows admins to control enrollment pools, assign license tokens, check server load trends, and manage active hardware IoT labs.

### 3. State & Core Libs (`client/src/lib/`)
* **`store.js`:** Reactive in-memory state engine. Provides immediate updates to frontend elements and seamlessly fallback-buffers backend connections to avoid user experience latency.
* **`db.js`:** Encapsulates REST API wrappers, managing JWT authentication headers automatically.
