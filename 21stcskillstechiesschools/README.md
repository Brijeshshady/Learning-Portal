# 🏆 21st Century Skills Learning Portal — MERN Stack AI Lab

Welcome to the **21st Century Skills Learning Portal**, a premium, state-of-the-art MERN-stack academy designed to empower students with hardware-focused robotics concepts, structured programming courses, and interactive AI Mentor labs.

---

## 🚀 Premium Features

### 1. 🤖 Resilient Multi-Key AI Mentor (`AIManager` & `AIService`)
* **AUTOMATIC ROTATION & FAILOVER:** Programmed a secure backend load balancer containing five separate API keys (rate-limit compliant up to 25 reqs/min).
* **SLOT TIMER COOLDOWNS:** If a key triggers a rate-limit error, the server logs the Slot ID, automatically cools it down, and fails over to the next active slot instantly.
* **OFFLINE INTELLIGENT PARSER:** Includes a local generative mock parser. In the event all API slots are cooling down, the AI Mentor falls back to a smart offline syllabus engine, parsing topics (e.g. `robotics`, `python`, `logic`) and returning structured insights.

### 2. 🏆 Gamified Wall of Fame (Leaderboard)
* **PODIUM EXHIBITION:** Sleek Gold, Silver, and Bronze showcase cards utilizing 3D scale hover effects, metallic gradients, and role identifiers.
* **COHORT TABS:** Dynamically switch between worldwide **Global Rankings** and the student's local **My Hub** rankings.
* **DYNAMIC STATS:** Stats like *Your Rank*, *Total Score*, *Completed Modules*, and *Total Competitors* update dynamically depending on the selected ranking tab.

### 3. 📂 Verifiable Certificate PDF Generator & Log
* **ACADEMIC CREDENTIALING:** Teachers and School Admins can instantly issue technology badges and certificates.
* **PDF BLUEPRINT (`html2pdf.js`):** Built a high-fidelity visual certificate template complete with modern typography (Outfit/Inter), signatures, and quick download features.
* **CREDENTIAL AUDIT LOGS:** Detailed history tracking all issued badges with unique cryptographically formatted IDs (e.g. `CERT-A1B2-C3D4`).

### 4. 🔄 Dynamic Student Profile Settings Sync
* **MERN STACK persistence:** Profile modifications (such as name or email edits) inside the Settings modal dispatch secure `PUT /api/users/profile` API calls, saving updates directly to MongoDB.
* **REACT CONTEXT SYNC:** Synchronizes the frontend `AuthContext` session parameters (`localStorage` and active session state) instantly without needing a full-page reload.

### 5. 🗺️ Interactive Weekly Roadmap (Syllabus)
* **MILESTONE ROADMAP:** Transformed standard static curriculum guidelines into a week-by-week navigation deck.
* **PROGRESS BINDING:** Dynamically highlights completed checkpoints, in-progress modules, and locked future syllabus items.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Usage |
|---|---|---|
| **Frontend** | React, Vite | Core client runtime and swift compilation modules |
| **Styling** | Vanilla CSS, HSL, Framer Motion | Glossy dark-theme accents, neon metallic borders, keyframe floaters, and rich spring animations |
| **Backend** | Node.js, Express.js | Route filters, auth middlewares, and REST API controllers |
| **Database** | MongoDB, Mongoose | Schema definitions for users, schools, progress models, tokens, and certificates |
| **Integrations** | `html2pdf.js` | High-fidelity certificate rendering and client-side PDF compilation |

---

## ⚙️ Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (Local instance or Atlas cloud cluster)

### 2. Clone and Setup Environment Variables
Configure the `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_jwt_secret_token

# AI Key Rotation Slots
AI_KEY_SLOT_1=your_api_key_1
AI_KEY_SLOT_2=your_api_key_2
AI_KEY_SLOT_3=your_api_key_3
AI_KEY_SLOT_4=your_api_key_4
AI_KEY_SLOT_5=your_api_key_5
```

### 3. Install Dependencies
```bash
# Install root client packages
npm install

# Install backend server packages
cd server
npm install
```

### 4. Run Development Servers
```bash
# Start backend server (from server directory)
npm run dev

# Start frontend client (from root directory)
npm run dev
```

### 5. Compile Production Bundle
```bash
# Build the React production assets
npm run build
```
