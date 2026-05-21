# Full Functionality Implementation Plan

## Features to implement

### 1. Shared utilities
- `src/components/Modal.jsx` — reusable modal dialog
- `src/hooks/useToast.jsx` — toast notification system
- `src/components/Toast.jsx` — toast renderer
- `src/lib/store.js` — lightweight in-memory state (notifications, posts, users)

### 2. DashboardLayout
- Notifications bell → dropdown panel with real notifications
- Settings icon → opens profile/settings modal
- Search bar → global search (routes to relevant view)

### 3. AdminDashboard
- Add User button → Modal form → saves to in-memory store
- Bulk Import → CSV file picker (parse & preview)
- Edit user → inline modal
- Export button → downloads table as CSV
- Hub selector → filters KPI data
- Generate License Key → generates UUID key, adds to list
- Copy key button → copies to clipboard with toast

### 4. TeacherPanel
- Search in student roster → live filter
- Grade submission → updates state, shows toast confirmation
- Export grades → downloads CSV
- View student → opens student detail modal

### 5. SchoolAdminDashboard
- Add Member → modal form → adds to in-memory store
- Edit/Remove → updates local state with confirmation
- Search → live filters table
- Export PDF → triggers browser print

### 6. StudentDashboard
- Resume Module → navigates to ?v=ai-lab
- Roadmap week click → shows week detail tooltip
- Module Start button → opens module modal

### 7. Community
- Post button → adds new post to feed (with current user)
- Search → filters posts live
- Tag filter → already works (filters state)
- Like → already works (local toggle)

### 8. Global
- Toast system → success/error/info toasts on every action
- Notifications panel → live bell dropdown
