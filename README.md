# CampusCore
### High-Concurrency Information System with Sub-Millisecond RBAC

Built for Government College of Engineering, Amravati (GCOEA) — a production-grade campus portal designed to handle peak-load traffic without crashing.

---

## Team
| Name | Roll No |
|------|---------|
| Varshad Potle | 23005055 |
| Vinay Sharma | 23005060 |
| Yash Pathak | 23005064 |

**Mentor:** Dr. K. A. Waghmare

---

## Problem Statement
Campus portals crash on results day and data drives due to:
- Heavy SQL joins on every API request to verify authorization
- Unrestricted write-access fragmenting data integrity
- No efficient mechanism for temporary bulk access control

---

## Solution Architecture

### Bitmask-Based RBAC
User permissions are stored as a single 64-bit integer. Every API request validates access using a single `O(1)` bitwise AND operation at the CPU level — no database query required.

```text
userMask & routeMask === routeMask  →  allowed

userMask & routeMask !== routeMask  →  403 Forbidden
```

| Permission | Bit | Value |
|-----------|-----|-------|
| READ_PROFILE | 0 | 1 |
| UPDATE_PROFILE | 1 | 2 |
| READ_RESULTS | 2 | 4 |
| ADMIN | 3 | 8 |
| UPLOAD_MARKS | 4 | 16 |
| UPLOAD_FILES | 5 | 32 |

### Redis Permission Cache
Permission bitmasks are cached in Redis with a 5-minute TTL. Cache miss falls back to PostgreSQL and repopulates automatically.

### Time-Bound Cooldowns
Any profile update locks the entire profile for 15 days via a Redis key with TTL. Prevents spam updates during data drives.

### Global Update Window
Admins can open a campus-wide update window with a custom message and field list. Bypasses all cooldowns instantly via Redis Pub/Sub broadcast.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js + TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Auth | JWT + bcrypt |
| File Upload | Multer |
| Load Testing | k6 |

---

## Load Test Results
Tested on WSL2 development environment (single instance, no load balancer).

| Metric | Result |
|--------|--------|
| Total Requests | 307,001 |
| Error Rate | 0.00% |
| Throughput | 1,170 req/s |
| Min Response Time | 814µs |
| Avg Response Time | 152ms |
| Concurrent Users | 500 |

> Min response time of 814µs proves sub-millisecond RBAC capability. Average latency reflects WSL2 virtual network overhead, not production performance.

---

## Features

### Student
- View full profile with fixed and updatable fields
- Update phone, address, placement status, company, CTC
- Upload photo (JPG/PNG, 2MB), resume (PDF, 5MB), consolidated documents (PDF, 10MB)
- Profile locks for 15 days after any submission
- See active update window with message and fields to update
- Request password reset from admin

### Admin
- Import students via Excel (bulk creation with default passwords)
- Open/close update windows with custom message and field list
- Search students by roll number or company name
- View full student profiles including documents
- Bulk apply/clear cooldowns
- Manage student permissions
- View paginated audit log
- Reset student passwords
- View stats — placement rate, total students, window submissions

---

## Project Structure

```text
campuscore/

├── src/                    # Backend (Node.js + TypeScript)

│   ├── config/            # DB, Redis, Multer config

│   ├── controllers/       # Route handlers

│   ├── middleware/        # Auth, RBAC, Cooldown

│   ├── routes/            # API routes

│   ├── services/          # Business logic

│   ├── types/             # TypeScript interfaces

│   └── utils/             # JWT, Bitmask utilities

├── frontend/              # React + TypeScript + Vite

│   └── src/

│       ├── components/    # UI, Admin, Student, Shared

│       ├── pages/         # LoginPage, AdminDashboard, StudentDashboard...

│       ├── store/         # Zustand auth store

│       ├── lib/           # API client, utils

│       └── hooks/         # useToast

├── load-test.js           # k6 load test script

└── README.md
```

---

## Setup

### Prerequisites
- Node.js v22+
- PostgreSQL 16
- Redis

### Backend
```bash
cd campuscore
npm install
cp .env.example .env   # configure DB and Redis
npm run dev
```

### Frontend
```bash
cd campuscore/frontend
npm install
npm run dev
```

### Database
```bash
psql -U campuscore -d campuscore -h localhost -W -f src/config/schema.sql
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/change-password | Change password |
| POST | /api/auth/request-password-reset | Request reset |

### Student Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile/me | Get own profile |
| GET | /api/profile/cooldown | Get cooldown status |
| POST | /api/profile/submit | Final submit (applies cooldown) |
| POST | /api/profile/photo/temp | Upload photo |
| POST | /api/profile/resume/temp | Upload resume |
| POST | /api/profile/documents/temp | Upload documents |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/students | All students |
| GET | /api/admin/students/search | Search by roll/company |
| POST | /api/admin/students/import | Bulk import via Excel |
| POST | /api/admin/students/profile | Create student profile |
| POST | /api/admin/window/open | Open update window |
| DELETE | /api/admin/window/close | Close update window |
| GET | /api/admin/window/active | Get active window |
| GET | /api/admin/audit-log | Paginated audit log |
| POST | /api/admin/cooldown/apply | Bulk apply cooldown |
| POST | /api/admin/cooldown/clear | Bulk clear cooldown |
| POST | /api/admin/permissions | Update permissions |
| GET | /api/admin/password-reset-requests | Pending resets |
| POST | /api/admin/students/:userId/reset-password | Reset password |
