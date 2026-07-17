# Employee Management System (EMS Pro)

EMS Pro is a full-stack corporate management dashboard built with React (TypeScript), Node.js, Express, and MongoDB. It supports secure JWT-based sessions, granular role authorization, interactive reporting hierarchy visualizers, real-time analytics widgets, and bulk spreadsheet imports.

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC)**:
  * **Super Admin**: Full CRUD capabilities, assigns administrative roles, manages reporting chains, and deletes entries.
  * **HR Manager**: Adds, views, and edits records; blocked from deletion or upgrading roles to Super Admin.
  * **Employee**: View-only mode for directory; can edit personal email, phone, avatar image, and password.
* **Organizational Hierarchy**:
  * Prevention of circular manager relationships (e.g. employees reporting to their subordinates).
  * Interactive tree rendering where selecting nodes inspects profiles.
* **Dashboard Widgets**:
  * Real-time metrics tracking total headcount, active listings, inactive listings, and department totals.
  * Analytical Bar and Pie charts (using Recharts) tracking departments, active operational ratios, and compensation brackets.
* **Bulk Imports**:
  * Batch registers employee accounts via CSV file uploads.
  * Detailed row-level input checking and diagnostics reporting.
* **Advanced Features**:
  * Soft deletion of employee profiles.
  * Toggle controls for Dark/Light UI modes.

---

## 📂 Project Structure

```text
├── backend/                  # Express + Node + TypeScript API
│   ├── src/
│   │   ├── config/           # Database loader
│   │   ├── controllers/      # Route controllers (Auth, Employee CRUD)
│   │   ├── middleware/       # JWT RBAC gating
│   │   ├── models/           # Mongoose schemas
│   │   ├── utils/            # Hierarchy builders and checks
│   │   └── index.ts          # Server entry point
│   ├── uploads/              # Profile images
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Vite + React + TypeScript App
│   ├── src/
│   │   ├── components/       # Layout parts (Sidebar, Navbar, Forms, Charts)
│   │   ├── hooks/            # Session useAuth hook
│   │   ├── App.tsx           # Route controllers
│   │   ├── index.css         # Styling system
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml        # Multi-container orchestrator
```

---

## 🛠️ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* [MongoDB](https://www.mongodb.com/) (running on port `27017` locally)

### Setup & Run (Standard Local Mode)

1. **Backend Server**:
   ```bash
   cd backend
   npm install
   # Seed the default Super Admin credentials
   npm run seed
   # Start the Express server on port 5000
   npm run dev
   ```

2. **Frontend client**:
   ```bash
   cd ../frontend
   npm install
   # Start the Vite developer server on port 5173
   npm run dev
   ```

3. Open `http://localhost:5173/` in your browser.

---

## 🔑 Default Sign In Credentials

Use this seeded administrator account to explore the application:
* **Work Email**: `admin@ems.com`
* **Password**: `Password123`

---

## 📡 API Endpoints

### Authentication
* `POST /api/auth/login` - Authenticates user and returns JWT.
* `GET /api/auth/me` - Resolves active profile properties.

### Employee Directory
* `GET /api/employees` - Returns paginated, searched, and filtered lists.
* `POST /api/employees` - Registers a new employee (requires image/multipart request).
* `GET /api/employees/:id` - Retrieves a single employee record.
* `PUT /api/employees/:id` - Updates specific fields (supports avatar uploads).
* `DELETE /api/employees/:id` - Soft deletes profile and shifts reportees up.
* `PATCH /api/employees/:id/manager` - Patches the manager reference.
* `GET /api/employees/:id/reportees` - Fetches immediate direct reports.
* `POST /api/employees/import` - Bulk registers via CSV uploads.

### Org Tree
* `GET /api/organization/tree` - Resolves nested tree structure.
