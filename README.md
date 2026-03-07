# CipherSQLStudio

A browser-based SQL learning platform where students practice SQL queries against pre-configured assignments with real-time execution and intelligent hints.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React.js (Vite) |
| Styling | Vanilla SCSS (BEM, mobile-first) |
| Code Editor | Monaco Editor |
| Backend Runtime | Node.js / Express.js |
| Sandbox Database | PostgreSQL |
| Persistence DB | MongoDB (Atlas) |
| LLM Integration | Google Gemini API |
| Auth | JWT (bcrypt) |

## Features

- **Assignment Listing** — View all SQL assignments with difficulty badges
- **SQL Editor** — Monaco Editor with syntax highlighting
- **Real-time Execution** — Execute SQL against PostgreSQL sandbox
- **LLM Hints** — AI-powered hints (not solutions) via Gemini
- **Sample Data Viewer** — See table schemas and data for each assignment
- **Results Panel** — Formatted table display of query results
- **Login / Signup** — JWT-based authentication
- **Save Attempts** — Track your query history per assignment
- **Responsive** — Mobile-first design (320px, 641px, 1024px, 1281px)

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB + PostgreSQL connections
│   ├── models/
│   │   ├── Assignment.js      # Assignment schema
│   │   ├── User.js            # User schema (bcrypt)
│   │   └── Attempt.js         # Query attempt schema
│   ├── routes/
│   │   ├── assignments.js     # GET /api/assignments
│   │   ├── execute.js         # POST /api/execute (SQL sandbox)
│   │   ├── hint.js            # POST /api/hint (Gemini LLM)
│   │   ├── auth.js            # POST /api/auth/login, /signup
│   │   └── attempts.js        # POST/GET /api/attempts
│   ├── seed.js                # Seed assignments + PG tables
│   ├── server.js              # Express entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar/
│   │   ├── pages/
│   │   │   ├── AssignmentList/
│   │   │   ├── AssignmentAttempt/
│   │   │   ├── Login/
│   │   │   └── Signup/
│   │   ├── styles/
│   │   │   ├── _variables.scss
│   │   │   ├── _mixins.scss
│   │   │   └── global.scss
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL (running locally or remote)
- MongoDB Atlas account (or local MongoDB)
- Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd CipherSQLStudio

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** — create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ciphersqlstudio
PG_URI=postgresql://<user>:<pass>@localhost:5432/ciphersqlstudio
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

**Frontend** — create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Setup PostgreSQL Database

```bash
createdb ciphersqlstudio
```

### 4. Seed Data

```bash
cd backend
node seed.js
```

This creates PostgreSQL tables (employees, customers, orders) with sample data and inserts 6 assignments into MongoDB.

### 5. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assignments | List all assignments |
| GET | /api/assignments/:id | Get single assignment |
| POST | /api/execute | Execute SQL query |
| POST | /api/hint | Get LLM hint |
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| POST | /api/attempts | Save query attempt |
| GET | /api/attempts/:assignmentId | Get user attempts |

## Data Flow

```
User clicks "Execute Query"
  → Frontend sends POST /api/execute { query }
  → Backend validates & sanitizes query (SELECT only)
  → Backend executes query against PostgreSQL with 5s timeout
  → PostgreSQL returns result set
  → Backend formats { columns, rows, rowCount }
  → Frontend displays results in table
```

## Security

- Only `SELECT` / `WITH` queries are allowed
- Blocked keywords: DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, etc.
- Query execution has a 5-second timeout
- Multi-statement queries are blocked
- Passwords are hashed with bcrypt
- JWT tokens expire after 7 days
# SQL_shit
