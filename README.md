# 🎓 Academic Resource Hub

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v8-brightgreen.svg)](https://www.mongodb.com/)
[![AWS S3](https://img.shields.io/badge/AWS%20S3-Multer--S3-orange.svg)](https://aws.amazon.com/s3/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-v5.3-purple.svg)](https://getbootstrap.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **Academic Resource Hub** is a full-stack, enterprise-grade academic resource sharing platform built with **Node.js**, **Express.js**, **MongoDB**, and **EJS**. Designed following the strict **MVC (Model-View-Controller)** pattern, it streamlines peer-to-peer knowledge sharing across engineering departments by enabling students and faculty to upload, discover, and moderate lecture notes, previous examination question papers (PYQs), lab manuals, assignment solutions, and syllabus copies.

---

## 🌟 Key Highlights & Engineering Features

### 🏛️ 1. Intelligent Branch Resolution
- **Email Regex & Parsing**: Enforces strict `@vnrvjiet.in` college email addresses during registration.
- **Mongoose Pre-Save Hook**: Automatically analyzes roll numbers (e.g., `25071a6643@vnrvjiet.in`), parses indices `6` and `7` (`66`), and maps them directly to the student's department (**CSM** - Computer Science and Machine Learning).
- **Auto-Assigned Uploads**: Students cannot falsify or miscategorize their department—uploads automatically bind to their credential branch.

### 🛡️ 2. Hybrid Security & Authentication
- **JWT in HTTP-Only Cookies**: Issues signed JSON Web Tokens stored securely in `httpOnly`, `sameSite: lax` cookies with `secure` flags in production to mitigate XSS and CSRF vectors.
- **Bcrypt Password Hashing**: Defensive pre-save hooks automatically hash passwords using 12 salt rounds before persisting to MongoDB.
- **Decoupled Flash Session**: Sessions (`express-session` + `connect-flash`) are strictly isolated for transient user notification messages without bloating authentication state.

### 📦 3. Dual Storage Architecture (Cloud S3 + Local Disk)
- **Production AWS S3 / MinIO**: Configured via `@aws-sdk/client-s3` and `multer-s3` with `forcePathStyle: true` for local S3 emulation (MinIO) or real AWS buckets.
- **Zero-Config Local Fallback**: When `STORAGE_TYPE=local` (default for local development), documents are automatically stored to `public/uploads/resources/` with normalized paths so the app works out of the box with zero external dependencies.

### 🚦 4. Two-Tier Moderation & Approval Pipeline
- **Student Uploads**: Default to `PENDING` status. Pending uploads are hidden from public feeds and accessible only to the uploader under **"My Uploads"** until verified.
- **Admin Auto-Approval & Broadcast**: Uploads by Admins default to `APPROVED` and can be broadcasted college-wide with the special **`ALL DEPTS`** tag.
- **Admin Moderation Dashboard**: Real-time KPI dashboard (`/admin/dashboard`) allowing administrators to inspect PDFs, approve, reject, or permanently purge inappropriate records and their S3/local files.

### 🚩 5. Community Content Flagging (Peer Reporting)
- Authenticated students can flag outdated or misleading documents using the **Report** action.
- Atomically increments `reportCount` (`$inc: { reportCount: 1 }`).
- Flagged resources are visually highlighted on the Admin Dashboard with warning badges and sorted by priority.

### 🔍 6. Strict Validation & Error Handling
- **Server-Side Joi Schema**: Strict validation enforcing type safety, non-empty fields, supported document categories, and URL format integrity.
- **Bootstrap 5 Client Validation**: Custom `script.js` intercepting invalid inputs with visual feedback states (`was-validated`).
- **Centralized Async Catch**: Custom `wrapAsync` higher-order utility paired with `ExpressError` ensures unhandled exceptions render standardized error templates or JSON responses without crashing the runtime.

---

## 🏢 VNR VJIET Department Mapping

The platform automatically maps college roll numbers to their respective departments using the following matrix:

| Code | Department / Branch Acronym | Department Name |
| :---: | :---: | :--- |
| `01` | **CIV** | Civil Engineering |
| `02` | **EEE** | Electrical & Electronics Engineering |
| `03` | **MECH** | Mechanical Engineering |
| `04` | **ECE** | Electronics & Communication Engineering |
| `05` | **CSE** | Computer Science & Engineering |
| `10` | **EIE** | Electronics & Instrumentation Engineering |
| `12` | **INF** | Information Technology |
| `24` | **AUT** | Automobile Engineering |
| `32` | **CSBS** | Computer Science & Business Systems |
| `39` | **RAI** | Robotics & Artificial Intelligence |
| `62` | **CSC** | Computer Science & Engineering (Cyber Security) |
| `66` | **CSM** | Computer Science & Engineering (AI & ML) |
| `67` | **CSD** | Computer Science & Engineering (Data Science) |
| `69` | **CSO** | Computer Science & Engineering (IoT) |
| `72` | **AID** | Artificial Intelligence & Data Science |
| `77` | **EVL** | Electronic VLSI Design & Technology |

---

## 🗂️ Project Directory Structure

```text
academic-resource/
├── app.js                      # Application entry point, middleware stack, route mounting
├── package.json                # Project dependencies, scripts, and metadata
├── schema.js                   # Joi server-side validation schemas
├── middleware.js               # Route guards (isLoggedIn, isOwner, isAdmin, validateResource)
├── seed.js                     # Database seeding script for students and admin
├── Dockerfile                  # Containerization specification for production
├── docker-compose.yml          # Container orchestration for local / VPS hosting
├── .env.example                # Template of environment variables
│
├── controllers/                # Business logic handlers
│   ├── admin.js                # Moderation dashboard, status change, content purge
│   ├── resource.js             # Discovery, upload, update, delete, reporting
│   └── user.js                 # Registration, login, JWT issuance, logout
│
├── models/                     # Mongoose schemas & data models
│   ├── resource.js             # Resource schema (title, subject, branch, fileUrl, status, reports)
│   └── user.js                 # User schema (email validation, bcrypt hook, branch extractor)
│
├── routes/                     # RESTful modular routers
│   ├── admin.js                # Admin-protected endpoints (/admin/*)
│   ├── resource.js             # Resource management & discovery endpoints (/resources/*)
│   └── user.js                 # Authentication endpoints (/register, /login, /logout)
│
├── utils/                      # Core utilities & shared helpers
│   ├── expressError.js         # Custom operational Error class with HTTP status codes
│   ├── s3Config.js             # Dual storage engine (Multer-S3 & Local Disk Storage)
│   └── wrapAsync.js            # Higher-order async handler wrapper
│
├── views/                      # EJS templates (Server-Side Rendered)
│   ├── home.ejs                # Landing page
│   ├── error.ejs               # Standardized error view with dev stack traces
│   ├── admin/
│   │   └── dashboard.ejs       # Admin KPI dashboard with moderation controls
│   ├── includes/
│   │   ├── flash.ejs           # Dismissible Bootstrap success/error alert banners
│   │   ├── footer.ejs          # Global responsive footer
│   │   └── navbar.ejs          # Dynamic navigation with branch/admin badges
│   ├── layouts/
│   │   ├── boilerplate.ejs     # Primary master layout via ejs-mate
│   │   └── biolerplate.ejs     # Compatibility alias layout
│   ├── resources/
│   │   ├── edit.ejs            # Resource edit form with optional file replacement
│   │   ├── index.ejs           # Branch dashboard & college-wide discovery grid
│   │   ├── myResources.ejs     # Personal uploaded resources management page
│   │   ├── new.ejs             # Multi-part document upload form
│   │   └── show.ejs            # Detailed document view with owner/report controls
│   └── users/
│       ├── login.ejs           # User sign-in page
│       └── register.ejs        # User registration with email pattern validation
│
└── public/                     # Static assets served by Express
    ├── css/
    │   ├── style.css           # Custom styles (card hover animations, badges, typography)
    │   └── styles.css          # Compatibility stylesheet
    ├── js/
    │   └── script.js           # Bootstrap 5 custom client-side form validation
    └── uploads/                # Local storage destination for uploaded files
```

---

## 🔌 API & Route Endpoints

### 🔐 Authentication Routes (`/`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/register` | Public | Render registration form |
| `POST` | `/register` | Public | Validate email, resolve branch, hash password, issue JWT cookie |
| `GET` | `/login` | Public | Render login form |
| `POST` | `/login` | Public | Verify credentials, issue JWT cookie, redirect to requested URL |
| `POST` | `/logout` | Authenticated | Invalidate JWT cookie and clear session |

### 📚 Resource Routes (`/resources`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/resources` | Public | Discovery feed (filtered by student's branch + Admin uploads) |
| `GET` | `/resources/new` | Logged In | Render upload form (auto-binds student branch) |
| `POST` | `/resources` | Logged In | Upload document via Multer (S3/local), run Joi validation |
| `GET` | `/resources/my-resources` | Logged In | View personal uploads with moderation status |
| `GET` | `/resources/:id` | Public | View detailed resource information and download link |
| `GET` | `/resources/:id/edit` | Owner | Render edit form for metadata/file replacement |
| `PUT` | `/resources/:id` | Owner | Update resource details (cleans up old S3/local file if replaced) |
| `DELETE` | `/resources/:id` | Owner | Delete document from database and S3/local storage |
| `POST` | `/resources/:id/report` | Logged In | Increment report count for community moderation |

### 🛠️ Admin Moderation Routes (`/admin`)
| Method | Endpoint | Access | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/admin/dashboard` | Admin Only | View KPI statistics, filter uploads by status/branch/reports |
| `PATCH` | `/admin/resources/:id/status` | Admin Only | Update resource status (`APPROVED` or `REJECTED`) |
| `DELETE` | `/admin/resources/:id` | Admin Only | Permanently purge inappropriate resource and storage file |

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/academic-resource-hub.git
cd academic-resource-hub
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

Verify the `.env` settings (defaults work out of the box for local development):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/academic_resource_db
SESSION_SECRET=dev_session_secret_12345
JWT_SECRET=dev_jwt_secret_67890
COOKIE_SECRET=dev_cookie_secret_abcde

# Storage Mode: 'local' (disk storage) or 's3' (MinIO / AWS S3)
STORAGE_TYPE=local
```

### 3. Start Local MongoDB
Ensure your local MongoDB instance is active:
```bash
brew services start mongodb-community
# or: mongod --config /opt/homebrew/etc/mongod.conf
```

### 4. Seed Initial Data (Optional, Recommended)
Run the built-in seed script to populate sample student accounts, an admin account, and approved documents:
```bash
npm run seed
```

This creates:
- **Admin**: `admin@vnrvjiet.in` (Password: `adminpassword123`, Role: `ADMIN`)
- **Student 1 (CSM)**: `25071a6643@vnrvjiet.in` (Password: `studentpassword123`)
- **Student 2 (ECE)**: `25071a0412@vnrvjiet.in` (Password: `studentpassword123`)

### 5. Launch the Application
```bash
# Start development server with nodemon:
npm run dev

# Or start standard production server:
npm start
```
Visit `http://localhost:3000` in your web browser.

---

## 🚢 Production Deployment Guide

### Deployment Architecture
- **Web App**: Hosted on [Render](https://render.com) or [Railway](https://railway.app).
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Free M0 Cluster).
- **File Storage**: AWS S3 Bucket (or MinIO / Cloudflare R2).

### Step-by-Step Production Setup

1. **Database (MongoDB Atlas)**:
   - Create a free cluster on MongoDB Atlas.
   - Whitelist all IPs (`0.0.0.0/0`) in Network Access.
   - Obtain your connection URI: `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/academic_resource_db`.

2. **File Storage (AWS S3)**:
   - Create a bucket in your preferred AWS region (e.g. `ap-south-1`).
   - Create an IAM User with `AmazonS3FullAccess` and generate Access Keys.

3. **Deploying on Render**:
   - Create a new **Web Service** on Render and link your GitHub repository.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Supply Environment Variables:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: `<Atlas Connection String>`
     - `STORAGE_TYPE`: `s3`
     - `AWS_ACCESS_KEY_ID`: `<Your AWS Key>`
     - `AWS_SECRET_ACCESS_KEY`: `<Your AWS Secret>`
     - `AWS_REGION`: `<Your AWS Region>`
     - `AWS_BUCKET_NAME`: `<Your Bucket Name>`
     - `SESSION_SECRET`, `JWT_SECRET`, `COOKIE_SECRET`: `<Secure Random Strings>`

4. **Containerized Deployment (Docker Compose)**:
   You can also deploy anywhere with Docker in a single command:
   ```bash
   docker compose up -d --build
   ```

---

## 🛡️ License

This project is licensed under the **ISC License**. Free for academic and personal use.
