# DevPulse — Internal Tech Issue & Feature Tracker

A collaborative backend API for software teams to report bugs, suggest features, and coordinate resolutions. Built with Node.js, TypeScript, Express, and PostgreSQL.

---

## 🌐 Live URL

```
https://devpulse-opal.vercel.app
```

---

## ✨ Features

- User registration and login with JWT authentication
- Role-based access control (contributor & maintainer)
- Create, read, update, and delete issues
- Filter issues by type and status
- Sort issues by newest or oldest
- Reporter details included in issue responses
- Secure password hashing with bcrypt
- Deployed on Vercel with NeonDB PostgreSQL

---

## 🛠️ Tech Stack

| Technology          | Purpose                         |
| ------------------- | ------------------------------- |
| Node.js (LTS 24.x)  | Runtime environment             |
| TypeScript          | Type-safe development           |
| Express.js          | Web framework                   |
| PostgreSQL (NeonDB) | Relational database             |
| Raw SQL (pg driver) | Database queries                |
| bcrypt              | Password hashing                |
| jsonwebtoken        | JWT authentication              |
| dotenv              | Environment variable management |
| cors                | Cross-origin resource sharing   |
| http-status-codes   | Consistent HTTP status codes    |

---

## 📁 Project Structure

```
devpulse/
├── src/
│   ├── config/
│   │   └── db.ts               # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification middleware
│   │   └── authorize.ts        # Role-based access middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   └── issues/
│   │       ├── issues.controller.ts
│   │       ├── issues.routes.ts
│   │       └── issues.types.ts
│   ├── utils/
│   │   ├── response.ts         # Reusable response helpers
│   │   └── validation.ts       # Input validation helpers
│   ├── app.ts
│   └── index.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Sahidulislam05/DevPulse
cd devpulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```env
DATABASE_URL=your_neondb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 4. Set up the database

Run the following SQL in your NeonDB SQL editor:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('contributor', 'maintainer')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('bug', 'feature_request')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved')),
  reporter_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Start the development server

```bash
npm run dev
```

Server will run at `http://localhost:3000`

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint           | Access | Description                 |
| ------ | ------------------ | ------ | --------------------------- |
| POST   | `/api/auth/signup` | Public | Register a new user         |
| POST   | `/api/auth/login`  | Public | Login and receive JWT token |

### Issues

| Method | Endpoint          | Access          | Description                             |
| ------ | ----------------- | --------------- | --------------------------------------- |
| GET    | `/api/issues`     | Public          | Get all issues (supports filter & sort) |
| GET    | `/api/issues/:id` | Public          | Get a single issue by ID                |
| POST   | `/api/issues`     | Authenticated   | Create a new issue                      |
| PATCH  | `/api/issues/:id` | Authenticated   | Update an issue                         |
| DELETE | `/api/issues/:id` | Maintainer only | Delete an issue                         |

### Query Parameters for GET /api/issues

| Parameter | Values                            | Default  |
| --------- | --------------------------------- | -------- |
| `sort`    | `newest`, `oldest`                | `newest` |
| `type`    | `bug`, `feature_request`          | —        |
| `status`  | `open`, `in_progress`, `resolved` | —        |

**Example:**

```
GET /api/issues?type=bug&status=open&sort=newest
```

---

## 🔐 Authentication

Include the JWT token in the `Authorization` header for protected routes:

```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 User Roles & Permissions

| Action                 | Contributor | Maintainer |
| ---------------------- | ----------- | ---------- |
| Register & Login       | ✅          | ✅         |
| View all issues        | ✅          | ✅         |
| Create issues          | ✅          | ✅         |
| Update own open issues | ✅          | ✅         |
| Update any issue       | ❌          | ✅         |
| Delete any issue       | ❌          | ✅         |

---

## 🗄️ Database Schema

### Table: `users`

| Column     | Type         | Constraints                                             |
| ---------- | ------------ | ------------------------------------------------------- |
| id         | SERIAL       | PRIMARY KEY                                             |
| name       | VARCHAR(255) | NOT NULL                                                |
| email      | VARCHAR(255) | UNIQUE, NOT NULL                                        |
| password   | VARCHAR(255) | NOT NULL                                                |
| role       | VARCHAR(20)  | DEFAULT 'contributor', CHECK (contributor / maintainer) |
| created_at | TIMESTAMP    | DEFAULT NOW()                                           |
| updated_at | TIMESTAMP    | DEFAULT NOW()                                           |

### Table: `issues`

| Column      | Type         | Constraints                                           |
| ----------- | ------------ | ----------------------------------------------------- |
| id          | SERIAL       | PRIMARY KEY                                           |
| title       | VARCHAR(150) | NOT NULL                                              |
| description | TEXT         | NOT NULL, MIN 20 chars                                |
| type        | VARCHAR(20)  | CHECK (bug / feature_request)                         |
| status      | VARCHAR(20)  | DEFAULT 'open', CHECK (open / in_progress / resolved) |
| reporter_id | INTEGER      | NOT NULL                                              |
| created_at  | TIMESTAMP    | DEFAULT NOW()                                         |
| updated_at  | TIMESTAMP    | DEFAULT NOW()                                         |

---

## 📬 Sample Request & Response

### POST /api/auth/login

**Request:**

```json
{
  "email": "john@devpulse.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@devpulse.com",
      "role": "contributor",
      "created_at": "2026-05-22T09:00:00Z",
      "updated_at": "2026-05-22T09:00:00Z"
    }
  }
}
```

---

## 🚀 Deployment

- **Backend:** [Vercel](https://vercel.com)
- **Database:** [NeonDB](https://neon.tech)

Environment variables configured in Vercel dashboard:

- `DATABASE_URL`
- `JWT_SECRET`

---

## 👤 Author

**Sahidul Islam**  
GitHub: [@Sahidulislam05](https://github.com/Sahidulislam05)
