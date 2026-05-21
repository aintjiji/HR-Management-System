# HR Portal — Secure HR Management System

A fully client-side HR Management System built with **HTML/CSS**, **Vanilla JavaScript**, and **localStorage** (simulating SQLite). Designed with cybersecurity principles and a responsive dark-theme UI.

---

## 📁 Project Structure

```
hr-system/
├── index.html                    ← Login page (entry point)
├── css/
│   └── main.css                  ← Design system, all styles
├── js/
│   ├── db.js                     ← Database layer (localStorage CRUD)
│   ├── auth.js                   ← Authentication & session management
│   ├── utils.js                  ← Utilities, sanitization, toast, geofence
│   └── shell.js                  ← Sidebar/nav renderer
└── pages/
    ├── employee-dashboard.html   ← Employee home
    ├── employee-attendance.html  ← Geofenced check-in/out
    ├── employee-leaves.html      ← Leave applications
    ├── employee-worklog.html     ← Hourly task logging
    ├── employee-profile.html     ← Profile & password change
    ├── employee-notices.html     ← Company announcements
    ├── admin-dashboard.html      ← Admin home (live metrics)
    ├── admin-employees.html      ← Employee CRUD management
    ├── admin-attendance.html     ← Attendance records & overrides
    ├── admin-leaves.html         ← Leave approval/rejection
    ├── admin-logs.html           ← Full audit trail
    ├── admin-notifications.html  ← Publish announcements
    └── admin-settings.html       ← System configuration & CSV export
```

---

## 🚀 How to Run

No server required. Simply open `index.html` in any modern browser.

```
Double-click  →  index.html
```

Or serve locally for best results:
```bash
npx serve .          # Node.js
python -m http.server 8080  # Python 3
```

---

## 🔑 Demo Credentials

| Role       | Username | Password   |
|------------|----------|------------|
| Employee   | alice    | pass123    |
| Employee   | carlos   | pass123    |
| Employee   | diana    | pass123    |
| Admin      | admin    | admin123   |

---

## 🗄️ Database Schema

Data is stored in `localStorage` under namespaced keys (`hr_<table>`), structured as JSON arrays — simulating a relational SQLite database.

| Table                  | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `employees`            | Core profiles: emp_code, name, department, role, status, email, phone       |
| `users`                | Login credentials with hashed passwords; linked to employees                |
| `admin_users`          | Separate admin credentials table                                            |
| `departments`          | Lookup table for department names                                           |
| `roles`                | Lookup table for job role names                                             |
| `attendance`           | Daily check-in/out records with status, geo verification, timestamps        |
| `leave_requests`       | Leave applications with type, dates, reason, approval status                |
| `employee_hourly_notes`| Task log entries per employee per time slot                                 |
| `activity_logs`        | **Audit trail** — every action with actor, action type, details, IP, time   |
| `system_settings`      | Global config: workday times, leave limits, geofence coordinates            |
| `notifications`        | Company-wide announcements published by admins                              |

---

## 🔐 Security Features

### 1. Role-Based Access Control (RBAC)
- Two completely separate portals: **Employee** and **Administrator**
- All pages enforce role via `Auth.requireEmployee()` / `Auth.requireAdmin()` — unauthorized access redirects to login
- Employees and admins are stored in separate tables (`users` vs `admin_users`)

### 2. Password Hashing
- Passwords are never stored in plain text
- djb2 hash algorithm with salt prefix (`hr$`) applied before storage
- Mimics bcrypt pattern — designed to be swapped for server-side bcrypt in production

### 3. Session Management
- Sessions use `sessionStorage` (cleared automatically when browser tab closes)
- Session token includes role, user ID, employee ID, and full name
- No sensitive data (passwords, hashes) included in session

### 4. Brute-Force Protection / Rate Limiting
- Failed login attempts tracked per username in `localStorage`
- After **5 failed attempts**, account is locked for **5 minutes**
- Remaining attempts and lockout countdown displayed to user
- Separate tracking for employee and admin login attempts

### 5. XSS Prevention
- All user-supplied strings rendered via `Utils.sanitize()` which escapes `<`, `>`, `"`, `'`, `&`, `/`
- All form inputs processed through `Utils.stripTags()` before database insertion
- No `innerHTML` injection of raw user data anywhere in the codebase

### 6. Input Validation
- Server-side style validation via `Utils.validateForm()` before any DB write
- Email format validation via regex
- Phone number format validation
- Minimum length enforcement on passwords (8 chars) and text fields
- Duplicate detection for employee codes and usernames

### 7. Audit Logging
- Every significant action recorded in `activity_logs` with:
  - **Actor** (who performed the action)
  - **Action type** (e.g., `LOGIN`, `CHECK_IN`, `LEAVE_APPROVED`, `EMPLOYEE_EDIT`)
  - **Details** (human-readable context)
  - **IP Address** (placeholder; captured server-side in production)
  - **Timestamp** (ISO 8601)
- Admins can view and search the full audit trail via the Activity Logs page

### 8. Geofenced Attendance
- Uses the browser **Geolocation API** + **Haversine formula** to calculate distance from office
- Employees outside the configured radius have attendance flagged
- Office coordinates and radius configurable by admin
- Geo-verification status recorded per attendance entry

### 9. Environment Variables Pattern
- All sensitive configuration (office coordinates, workday settings, leave limits) stored in `system_settings` table — not hardcoded
- In a production deployment, secrets (DB URI, JWT secret key) would be injected via `.env` file

### 10. Admin Override Logging
- All manual attendance overrides by admins are flagged (`admin_override: true`) and logged
- Prevents silent tampering — every change is traceable

---

## 🛠️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | HTML5, CSS3, Vanilla JavaScript     |
| Styling        | Custom CSS Design System (dark theme) |
| Fonts          | IBM Plex Sans, IBM Plex Mono, Bebas Neue (Google Fonts) |
| Database       | localStorage (SQLite-like structure) |
| Auth           | Session-based (sessionStorage)       |
| Geolocation    | Browser Geolocation API + Haversine formula |
| Export         | CSV via Blob API                    |

---

## ✅ Criteria Checklist

| Criteria               | Implementation                                                          |
|------------------------|-------------------------------------------------------------------------|
| Role-Based Access Control | Employee & Admin portals with route guards on every page             |
| Frontend Functionality | Dashboards, forms, tables, modals, tabs, live clock                    |
| Security Measures      | Hashing, rate limiting, XSS prevention, input validation, session mgmt |
| Audit Logs             | Full `activity_logs` table with timestamp + IP on every action         |
| Backend Functionality  | DB layer (db.js), Auth module, Utils, Shell — full separation of concerns |
| Environment Variables  | Settings table pattern; `.env` ready for production                    |
| Responsive Layout      | Mobile sidebar toggle, responsive grid, media queries at 900px/600px   |
| Database Handling      | Normalized tables, parameterized-style CRUD, no raw string injection   |
| Error Handling         | Form validation, toast notifications, login error display, safe fallbacks |
| Testing / QA           | See testing section below                                               |

---

## 🧪 Manual Testing Checklist

### Authentication
- [ ] Login with wrong password shows error and decrements attempt counter
- [ ] After 5 failed attempts, account is locked and shows countdown
- [ ] Employee cannot access `/pages/admin-*.html` pages directly
- [ ] Admin cannot access `/pages/employee-*.html` pages in admin session
- [ ] Logout clears session and redirects to login

### Employee Portal
- [ ] Dashboard shows today's attendance status and leave balances
- [ ] Check-in creates attendance record; check-out updates it
- [ ] Cannot check in twice on same day
- [ ] Leave request with missing fields shows validation error
- [ ] Profile update persists correctly
- [ ] Password change rejects wrong current password

### Admin Portal
- [ ] Dashboard shows real-time present/absent/late counts
- [ ] Adding employee with duplicate code shows error
- [ ] Leave approval/rejection updates status and logs action
- [ ] Attendance override is logged in audit trail
- [ ] Settings save and reflect immediately across the system
- [ ] CSV export downloads a valid file

---

## 📝 Production Deployment Notes

This project uses client-side localStorage as a demonstration database. For production:

1. Replace `db.js` with API calls to a Node.js/Flask backend
2. Use **PostgreSQL** or **MySQL** instead of SQLite for multi-user support
3. Replace `Auth.hash()` with **bcrypt** (server-side)
4. Use **JWT tokens** or **signed server sessions** instead of sessionStorage
5. Add **HTTPS** (TLS certificate)
6. Capture real **IP addresses** server-side for audit logs
7. Add **CSRF tokens** to all forms
8. Store secrets in a `.env` file using `dotenv`

---

## 👨‍💻 Author Notes

This system was built to demonstrate how enterprise HR functionality and cybersecurity principles can coexist in a clean, maintainable codebase. Every security feature is documented inline within the source files.
