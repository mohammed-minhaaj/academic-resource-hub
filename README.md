# 🎓 Academic Resource Hub

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v8-brightgreen.svg)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue.svg)](https://www.docker.com/)
[![AWS S3](https://img.shields.io/badge/AWS%20S3-Cloud%20Storage-orange.svg)](https://aws.amazon.com/s3/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-v5.3-purple.svg)](https://getbootstrap.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **Academic Resource Hub** is a full-stack, enterprise-grade academic resource sharing platform built with **Node.js**, **Express.js**, **MongoDB**, and **EJS**. Designed following the strict **MVC (Model-View-Controller)** pattern, it streamlines peer-to-peer knowledge sharing across engineering departments by enabling students and faculty to upload, discover, and moderate lecture notes, previous examination question papers (PYQs), lab manuals, assignment solutions, and syllabus copies.

---

## 🛠️ Core Technologies & How They Are Used

This platform leverages modern cloud-native, containerization, and database technologies to ensure high reliability, security, and scalability:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACADEMIC RESOURCE HUB                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     🍃 MONGODB   │       │   ☁️ AWS S3 /    │       │    🐳 DOCKER &   │
│   (Mongoose ODM) │       │      MINIO       │       │  DOCKER COMPOSE  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ • Automated user │       │ • Streaming file │       │ • Containerized  │
│   branch parser  │       │   uploads via    │       │   Express &      │
│ • Bcrypt hashing │       │   multer-s3      │       │   MongoDB stack  │
│ • Compound index │       │ • Ephemeral-safe │       │ • Isolated dev & │
│ • Atomic reports │       │   cloud storage  │       │   production env │
│ • College-wide   │       │ • Auto-cleanup   │       │ • One-command    │
│   $or discovery  │       │   via DeleteCmd  │       │   deployment     │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### 1. 🍃 MongoDB & Mongoose ODM
* **Why it's used**: Relational databases enforce rigid tabular schemas that create friction for evolving academic document metadata (different semesters, categories, report flags, file links, and dynamic branch codes). MongoDB provides high-performance, document-oriented persistence with dynamic querying.
* **How it's implemented**:
  - **Automated Branch Resolution**: A Mongoose pre-save hook analyzes incoming student emails (e.g. `25071a6643@vnrvjiet.in`), extracts roll-number indices `6` and `7` (`66`), and automatically assigns the student's department (`CSM`) to prevent fraudulent branch impersonation.
  - **Defensive Password Encryption**: The user schema pre-save hook automatically hashes passwords using `bcrypt` (12 salt rounds) prior to persisting.
  - **Compound Query Optimization**: Indexed across `{ branch: 1, subject: 1, resourceType: 1 }` and `{ status: 1 }` for sub-millisecond discovery filtering.
  - **Atomic Moderation & Reporting**: Uses `$inc: { reportCount: 1 }` for thread-safe concurrent peer reporting without race conditions.
  - **Cross-Department Admin Broadcasts**: The discovery router dynamically queries `$or: [{ branch }, { branch: "ALL" }, { branch: "ADMIN" }, { uploader: { $in: adminIds } }]`, allowing files uploaded by administrators to be accessible to all students across all 16 departments.

---

### 2. ☁️ AWS S3 & Cloud Storage (with MinIO Local Emulation)
* **Why it's used**: Production cloud platforms (Render, Railway, Heroku, AWS ECS) operate on **ephemeral filesystems**—any file saved to the local container disk is destroyed whenever the server restarts, deploys, or auto-scales. AWS S3 provides 99.999999999% (11 9's) durability, unlimited scalability, and secure, high-speed direct downloads.
* **How it's implemented**:
  - **Dual Storage Engine (`utils/s3Config.js`)**:
    - **Cloud Mode (`STORAGE_TYPE=s3`)**: Uses `@aws-sdk/client-s3` and `multer-s3` with `forcePathStyle: true` to stream files directly to Amazon S3 buckets or local S3-compatible MinIO instances.
    - **Local Disk Mode (`STORAGE_TYPE=local`)**: A built-in fallback storing files in `public/uploads/resources/` for instant local testing without cloud credentials.
  - **Lifecycle File Cleanup**: When an admin or student deletes or replaces a resource, `DeleteObjectCommand` automatically purges the orphaned file from the S3 bucket to prevent zombie storage costs.

---

### 3. 🐳 Docker & Docker Compose
* **Why it's used**: Eliminates the classic *"it works on my machine"* problem by packaging the Node.js application, its runtime dependencies, configuration, and a dedicated MongoDB database into reproducible, isolated containers.
* **How it's implemented**:
  - **Production `Dockerfile`**: Built on lightweight `node:20-alpine`, utilizing layered caching (`COPY package*.json ./` before source files) and `npm ci --only=production` to keep the production image tiny, fast, and secure.
  - **Orchestration with `docker-compose.yml`**: Defines a multi-container network containing the Express web application and an official `mongo:latest` service with persistent volume storage (`mongo_data:/data/db`). Anyone can run the entire platform with a single command without installing Node.js or MongoDB locally.

---

## 📋 Mandatory Prerequisites & Installation Guide

Before running the project, **ensure you have downloaded and installed the required software for your operating system**:

### 1. 🟢 Node.js & npm (Required for native execution)
- **Minimum Version**: Node.js `v18.0.0` or higher
- **Download**: [https://nodejs.org/en/download](https://nodejs.org/en/download)
- **Verify Installation**:
  ```bash
  node -v   # Should print v18.x.x, v20.x.x, or v22.x.x
  npm -v    # Should print v9.x.x or higher
  ```

---

### 2. 🐳 Docker Desktop (Required for containerized execution)
- **Why you need it**: If you do not want to install MongoDB or configure local services manually, Docker runs everything inside containers automatically.
- **Download**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) (Available for macOS, Windows, and Linux).
- **Verify Installation**:
  ```bash
  docker --version          # e.g., Docker version 24.x or higher
  docker compose version    # e.g., Docker Compose version v2.x or higher
  ```

---

### 3. 🍃 MongoDB (Choose Option A or Option B)

#### Option A: Local MongoDB Community Server
- **macOS (via Homebrew)**:
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Windows**: Download the `.msi` installer from [MongoDB Community Server](https://www.mongodb.com/try/download/community) and run the installer (keep "Install MongoDB as a Service" checked).
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get install -y mongodb-org
  sudo systemctl start mongod
  ```
- **Verify Installation**:
  ```bash
  mongosh --eval "db.runCommand({ ping: 1 })"
  # Should print: { ok: 1 }
  ```

#### Option B: Cloud-Hosted MongoDB Atlas (Zero Local Installation)
1. Sign up for free at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create an **M0 Free Cluster**.
3. Under **Network Access**, add `0.0.0.0/0` (Allow from anywhere).
4. Under **Database Access**, create a user and password.
5. Copy your connection string and paste it into `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/academic_resource_db?retryWrites=true&w=majority
   ```

---

### 4. ☁️ AWS S3 or Local MinIO (File Storage)

#### Option A: Zero-Config Local Storage (Recommended for first-time run)
No download needed! Set `STORAGE_TYPE=local` in `.env`. Files are saved to `public/uploads/` on disk.

#### Option B: Local MinIO S3 Server (Docker)
Run high-performance S3 emulation locally via Docker:
```bash
docker run -d -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```
Then create a bucket named `academic-resources`.

#### Option C: Production AWS S3
1. Log in to the [AWS Management Console](https://aws.amazon.com/s3/).
2. Create an S3 Bucket (e.g. `academic-resource-sharing-prod`).
3. Create an IAM User with `AmazonS3FullAccess` and generate Access Keys.
4. Set credentials in `.env`:
   ```env
   STORAGE_TYPE=s3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=ap-south-1
   AWS_BUCKET_NAME=your_bucket_name
   ```

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

## ⚡ How to Run the Application

You can run the application either using **Docker** (Method 1) or natively using **Node.js** (Method 2).

### 🚀 Method 1: Run with Docker Compose (Recommended — Zero Configuration)
If you have **Docker Desktop** installed, you do not need to install Node.js or MongoDB:

1. Clone the repository:
   ```bash
   git clone https://github.com/mohammed-minhaaj/academic-resource-hub.git
   cd academic-resource-hub
   ```
2. Build and start the containers:
   ```bash
   docker compose up -d --build
   ```
3. Open your browser and visit:
   ```
   http://localhost:3000
   ```
4. To stop the containers when finished:
   ```bash
   docker compose down
   ```

---

### 💻 Method 2: Run Natively with Node.js & Local MongoDB

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mohammed-minhaaj/academic-resource-hub.git
   cd academic-resource-hub
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *The default values in `.env` are already pre-configured for local development with `STORAGE_TYPE=local`.*

4. **Ensure MongoDB is Running**:
   ```bash
   brew services start mongodb-community
   # or run mongod in your terminal
   ```

5. **Seed Sample Data (Recommended)**:
   Populate initial student accounts, an admin account, and approved documents:
   ```bash
   npm run seed
   ```
   *Created Accounts:*
   - **Admin**: `admin@vnrvjiet.in` (Password: `adminpassword123`, Role: `ADMIN`)
   - **Student 1 (CSM)**: `25071a6643@vnrvjiet.in` (Password: `studentpassword123`)
   - **Student 2 (ECE)**: `25071a0412@vnrvjiet.in` (Password: `studentpassword123`)

6. **Start the Application**:
   ```bash
   # Development mode with live reload:
   npm run dev

   # Or standard production mode:
   npm start
   ```

7. **Visit**: `http://localhost:3000`

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
| `GET` | `/resources` | Public | Discovery feed (student's branch + Admin college-wide uploads) |
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

## 🚢 Cloud Production Deployment (Render + MongoDB Atlas + AWS S3)

```
[Users / Students]
       │
       ▼ (HTTPS)
[Web Service (Render / Railway)] ───► [Database (MongoDB Atlas)]
       │
       ▼ (File Uploads)
[Cloud Storage (AWS S3 Bucket)]
```

1. **MongoDB Atlas**: Create a free M0 cluster, whitelist `0.0.0.0/0`, and copy your connection string.
2. **AWS S3**: Create a bucket with public read enabled for objects, create an IAM user with `AmazonS3FullAccess`, and generate Access Keys.
3. **Deploy on Render.com**:
   - Create a **New Web Service** connected to your GitHub repo.
   - Build Command: `npm install` | Start Command: `npm start`
   - Add Environment Variables:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: `<Atlas Connection String>`
     - `STORAGE_TYPE`: `s3`
     - `AWS_ACCESS_KEY_ID`: `<Your AWS Key>`
     - `AWS_SECRET_ACCESS_KEY`: `<Your AWS Secret>`
     - `AWS_REGION`: `<Your AWS Region>`
     - `AWS_BUCKET_NAME`: `<Your Bucket Name>`
     - `SESSION_SECRET`, `JWT_SECRET`, `COOKIE_SECRET`: `<Secure Random Strings>`
4. **Seed Production DB**: Open the Render Shell tab and run `npm run seed`.

---

## 🛡️ License

This project is licensed under the **ISC License**. Free for academic and personal use.
