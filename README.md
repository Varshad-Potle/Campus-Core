# CampusCore API

CampusCore is a TypeScript and Express API for campus identity, student profiles, academic results, and administrator workflows. PostgreSQL stores application data and Redis stores cached permissions and cooldown state.

## Current Scope

Implemented capabilities include:

- JWT registration and login
- Bitmask-based permission checks
- Student profile reads and updates
- Whole-profile cooldowns for profile changes
- Administrator-controlled update windows
- Semester marks retrieval
- Excel marks import
- Administrative audit logging
- PostgreSQL and Redis startup checks
- Helmet security headers and CORS middleware

This repository currently contains the backend API. There is no frontend application in the current repository tree.

## Repository Layout

```text
.
├── src/
│   ├── config/          Database, Redis, upload, and schema configuration
│   ├── controllers/     HTTP request handlers
│   ├── middleware/      Authentication, permissions, and cooldown checks
│   ├── routes/          Express route modules
│   ├── services/        Domain workflows and persistence helpers
│   ├── types/           Backend types
│   └── utils/            JWT and permission helpers
├── uploads/              Runtime upload directory
├── package.json          Backend scripts and dependencies
├── tsconfig.json         TypeScript configuration
└── .env                  Local configuration; do not commit
```

## Prerequisites

The project does not enforce runtime versions in code. The following versions are recommended:

- Node.js 20 or later
- npm 10 or later
- PostgreSQL 14 or later
- Redis 6 or later

## Installation

```bash
git clone <repository-url>
cd campuscore
npm install
```

## Environment Variables

Create a `.env` file in the repository root:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=campuscore
DB_USER=postgres
DB_PASSWORD=change_me

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

`PORT` defaults to `3000`. `JWT_EXPIRES_IN` defaults to `7d`. Database and Redis connection values do not have application defaults and must be supplied by the environment.

Use a long, random JWT secret outside local development. Never commit `.env` or credentials.

## Database Setup

Create a PostgreSQL database and apply the schema:

```bash
createdb campuscore
psql -d campuscore -f src/config/schema.sql
```

The schema creates:

- `users`
- `student_profiles`
- `marks`
- `audit_log`

The schema installs the `uuid-ossp` extension. The PostgreSQL user must be allowed to create or use that extension.

Registration creates a row in `users`; it does not create a `student_profiles` row. An administrator must create a student profile separately with `POST /api/admin/students/profile`.

## Running the API

Start PostgreSQL and Redis before starting the API. Both connections are tested during startup; the process exits if either connection fails.

Development mode:

```bash
npm run dev
```

Production build and start:

```bash
npm run build
npm start
```

The API listens on `http://localhost:3000` by default.

The `GET /health` endpoint is a liveness response. It returns a success message and timestamp; it does not perform an independent PostgreSQL or Redis health check.

## Response Format and Errors

Successful endpoints generally return a JSON envelope such as:

```json
{
  "success": true,
  "data": {}
}
```

Some successful mutation endpoints return `message` and may also return `data` or other fields. Common error statuses are:

| Status | Meaning |
| ---: | --- |
| `400` | Invalid request data or registration failure |
| `401` | Missing, invalid, or expired JWT; invalid login credentials |
| `403` | Required permission bit is missing |
| `429` | Profile or field cooldown is active |
| `500` | Unhandled database, Redis, parser, or server failure |

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

### Auth Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a user and return a JWT |
| POST | `/api/auth/login` | Authenticate a user and return a JWT |

Both endpoints return data in this shape:

```json
{
  "success": true,
  "data": {
    "user": {},
    "token": "<jwt>"
  }
}
```

The register endpoint accepts `name`, `email`, `password`, and an optional `role`. The service accepts `student` or `admin` when selecting the default permission mask, but the controller does not enforce the role value. Public registration should therefore be restricted to trusted clients or changed to force the `student` role.

## Student Profile and Results

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/profile/me` | `READ_PROFILE` | Returns the user joined with the student profile |
| PATCH | `/api/profile/update` | `UPDATE_PROFILE` | Updates any non-empty subset of editable fields |
| GET | `/api/profile/update/status` | `READ_PROFILE` | Returns cooldown state for editable profile fields |
| PATCH | `/api/profile/update/name` | `UPDATE_PROFILE` | Legacy name-only update endpoint |
| GET | `/api/profile/marks` | `READ_RESULTS` | Returns marks grouped by semester |

The consolidated profile update accepts:

```json
{
  "name": "Aarav Sharma",
  "phone": "+15551234567",
  "permanentAddress": "12 University Road"
}
```

All fields are optional, but at least one must be supplied. The API validates name, phone, and address lengths. A successful update to any field applies one shared 15-day `profile` cooldown to the entire profile. The consolidated endpoint bypasses this check while the update window is open. The legacy name-only endpoint still sets a cooldown after a successful update, including when the update window is open.

The student profile table also contains `photo_url` and `resume_url`, but no active authenticated routes currently update those fields.

## Administrator Endpoints

Administrator access is determined by the `ADMIN` permission bit, not solely by the user's database `role`. Marks upload requires `UPLOAD_MARKS` and does not separately require `ADMIN`.

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| POST | `/api/admin/cooldown/apply` | `ADMIN` | Apply a Redis cooldown to all or selected IDs |
| POST | `/api/admin/cooldown/clear` | `ADMIN` | Clear a Redis cooldown from all or selected IDs |
| POST | `/api/admin/permissions` | `ADMIN` | Replace a user's permission mask |
| POST | `/api/admin/window/open` | `ADMIN` | Open the update window |
| DELETE | `/api/admin/window/close` | `ADMIN` | Close the update window |
| GET | `/api/admin/window/status` | `ADMIN` | Read update-window state |
| GET | `/api/admin/audit-log` | `ADMIN` | Read paginated audit entries |
| GET | `/api/admin/students` | `ADMIN` | List users whose role is `student` |
| POST | `/api/admin/students/profile` | `ADMIN` | Create a student profile row |
| POST | `/api/admin/marks/upload` | `UPLOAD_MARKS` | Import marks from an Excel file |

Request bodies:

- Cooldown apply/clear: `fieldName` is required; `studentIds` is optional. If omitted, all student user IDs are targeted. The current implementation does not validate field names or supplied IDs against profile records.
- Permission update: `userId` and `permissionMask` are required.
- Update window open: optional `durationSeconds`, defaulting to `3600` seconds.
- Student profile creation: `userId`, `rollNumber`, `branch`, and `parentName` are required.

Administrative audit entries are written for bulk cooldown changes, permission changes, update-window open/close, and marks uploads. Student listing, profile creation, and window-status reads are not currently audited.

## Marks Upload

The upload endpoint expects `multipart/form-data`:

- `file`: an Excel file accepted by its MIME type as `.xlsx` or `.xls`
- `semester`: integer from `1` to `8`

The first worksheet must contain headers named:

- `roll_number`
- `subject`
- `marks`
- `grade` is optional and is calculated when absent

The Excel upload is limited to 10 MB and is held in memory. Rows without the required values are skipped by the parser. Processing errors, including unknown roll numbers, are returned in the result's `errors` array. Parser failures are returned as server errors.

A successful response reports inserted rows, updated rows, and processing errors. Existing marks are matched by user, semester, and subject.

## Permissions

Permissions are checked as bits in `permission_mask`:

| Permission | Value | Purpose |
| --- | ---: | --- |
| `READ_PROFILE` | `1` | Read profile data |
| `UPDATE_PROFILE` | `2` | Update profile data |
| `READ_RESULTS` | `4` | Read marks |
| `ADMIN` | `8` | Pass administrator route checks |
| `UPLOAD_MARKS` | `16` | Upload marks |
| `UPLOAD_FILES` | `32` | Defined for future file-upload authorization |

Default masks are:

- Student: `39`
- Administrator: `63`

## Upload Storage and Security

The API exposes `/uploads` through unauthenticated static serving. Files placed there are publicly accessible by URL. Excel uploads currently use memory storage and do not write to disk.

Photo and resume multer configurations exist with limits of 2 MB and 5 MB respectively, but no routes currently use them. The base `uploads` directory is created when the multer module loads. Runtime upload files are not currently ignored by `.gitignore`, so avoid committing them manually.

## Development Verification

The repository currently defines no test script. Build verification can be run with:

```bash
npm run build
```

## License

`package.json` declares the ISC license. No separate license file is currently present; add one if the project will be distributed outside its owning organization.
