# Knot

> **Knot** — Tying things together.

A full-stack web forum built with **Django** (backend) and **React + TypeScript** (frontend). Features session-based authentication, threaded discussions, moderator tooling, AI-powered post categorisation, and a documented REST API for third-party automation.

---

## Table of Contents

1. [Tech Stack & Justification](#tech-stack--justification)
2. [AI Extension — Option D](#ai-extension--option-d-automated-content-categorisation)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Running Locally](#running-locally)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Postman Collection](#postman-collection)
9. [Test Data](#test-data)
10. [Admin Interface](#admin-interface)

---

## Tech Stack & Justification

### Backend — Django + Django REST Framework

Django was chosen for its **batteries-included** philosophy: it ships with an ORM, session-based auth, an admin UI, and first-class support for SQLite — all requirements of the spec with zero third-party configuration. Django REST Framework (DRF) adds a clean decorator-based view layer for the JSON API.

A serverless architecture was explicitly excluded by the spec; Django running via `manage.py runserver` is a conventional, stateful server that satisfies this.

### Datastore — SQLite

SQLite is bundled with Python, requires no installation, and has seamless Django ORM integration. For a forum with fewer than 100 users it is more than sufficient. The `db.sqlite3` file is included in the repository and pre-loaded with test/dummy data so assessors can run the project immediately.

### Frontend — React 19 + TypeScript + Vite + Tailwind CSS

React provides a component model that maps naturally onto the forum's UI (post list → post card → comment thread). TypeScript catches contract mismatches between the API and UI at compile time. Vite gives near-instant HMR in development. Tailwind CSS handles styling without a separate stylesheet. Vite's proxy configuration forwards `/api` calls to Django, so the frontend dev server and the Django server can run simultaneously without CORS issues beyond the explicit allow-list.

---

## AI Extension — Option D: Automated Content Categorisation

When a post is submitted, the backend calls the **Google Gemini API** (`gemini-3.1-flash-lite-preview`) with the post content and a strict prompt asking it to return exactly one category from the predefined set:

| Category | Description                     |
| -------- | ------------------------------- |
| Tech     | Technology, software, hardware  |
| General  | General discussion              |
| Q&A      | Questions and answers           |
| News     | Current events                  |
| Nature   | Environment, wildlife, outdoors |

The returned category is stored on the `Post` model and returned to the frontend, where it is displayed as a coloured tag on each post card. The frontend also exposes a **filter bar** allowing users to narrow the feed by category.

If the Gemini API call fails for any reason (invalid key, quota exceeded, network error), the category silently falls back to **General** so post creation is never blocked.

---

## Project Structure

```
Knot/
├── backend/                 # Django project
│   ├── .env                 # Local environment variables (not committed)
│   ├── .env.example         # Template for .env
│   ├── db.sqlite3           # Pre-seeded SQLite database
│   ├── manage.py
│   ├── knot/                # Django project config (settings, urls, wsgi)
│   └── knotapp/             # Main app (models, views, urls, migrations)
└── frontend/                # React + TypeScript app
    ├── src/
    │   ├── api.ts            # All fetch calls to the Django API
    │   ├── App.tsx
    │   ├── types.ts
    │   └── components/
    │       ├── Login.tsx
    │       ├── Register.tsx
    │       ├── PostCard.tsx
    │       └── Background.tsx
    └── vite.config.ts
```

---

## Prerequisites

| Tool    | Minimum version | Notes              |
| ------- | --------------- | ------------------ |
| Python  | 3.11            | `python --version` |
| Node.js | 18              | `node --version`   |
| npm     | 9               | bundled with Node  |
| Git     | any             | to clone the repo  |

A **Google Gemini API key** is required for the AI categorisation feature. Obtain one free at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). The app functions without it (categories default to General).

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/Knot.git
cd Knot
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux

# Add your Gemini API key to .env (see Environment Variables below)

# The database is pre-seeded — no migration needed.
# If you want a fresh database:
#   del db.sqlite3
#   python manage.py migrate

# Start the Django development server
python manage.py runserver
```

Django will be available at **http://localhost:8000**.

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend

npm install

npm run dev
```

The React app will be available at **http://localhost:3000**.
All `/api/*` requests are proxied to `http://localhost:8000` by Vite.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable         | Required | Description                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------ |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI post categorisation. Falls back to "General" if absent. |

---

## API Reference

All endpoints are prefixed with `/api/`. Session cookies are used for authentication — log in first and all subsequent requests in the same session are authenticated.

### Authentication

| Method | Endpoint              | Auth required | Description                                      |
| ------ | --------------------- | ------------- | ------------------------------------------------ |
| `POST` | `/api/auth/register/` | No            | Create a new user account                        |
| `POST` | `/api/auth/login/`    | No            | Log in and establish a session                   |
| `POST` | `/api/auth/logout/`   | No            | Destroy the current session                      |
| `GET`  | `/api/auth/me/`       | No            | Return the current authenticated user, or `null` |

### Posts

| Method | Endpoint                      | Auth required | Description                                                 |
| ------ | ----------------------------- | ------------- | ----------------------------------------------------------- |
| `GET`  | `/api/posts/`                 | No            | List all posts (pass `?user_id=<id>` to include like state) |
| `POST` | `/api/posts/create/`          | Yes           | Create a post (AI categorisation is triggered here)         |
| `POST` | `/api/posts/<id>/comments/`   | Yes           | Add a comment to a post                                     |
| `POST` | `/api/posts/<id>/like/`       | Yes           | Toggle a like on a post                                     |
| `POST` | `/api/posts/<id>/misleading/` | Moderator     | Mark/unmark a post as misleading                            |

### Utility

| Method | Endpoint             | Auth required | Description                                       |
| ------ | -------------------- | ------------- | ------------------------------------------------- |
| `GET`  | `/api/stats/`        | No            | Forum-wide counts (users, posts, likes, comments) |
| `GET`  | `/api/users/`        | No            | List all users                                    |
| `POST` | `/api/users/create/` | No            | Create a user (legacy endpoint)                   |

#### Example: Register

```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "alice",
  "password": "secret123",
  "is_staff": false
}
```

#### Example: Create a post

```http
POST /api/posts/create/
Content-Type: application/json

{
  "author_id": 1,
  "content": "What do you think about the new AI chip announcements?"
}
```

Response includes the AI-assigned `category` field.

---

## Postman Collection

A full Postman collection covering every endpoint is published publicly:

**[Knot API — Postman Collection](https://www.postman.com/your-postman-link-here)**

The collection is organised into four folders: **Auth**, **Posts**, **Comments & Likes**, and **Utility**. Each request includes example request bodies and notes on required fields. Import via **File → Import → Link** in Postman.

---

## Test Data

The committed `backend/db.sqlite3` is pre-seeded with:

- **5 user accounts** (4 regular, 1 moderator / `is_staff=true`)
- **~20 posts** across all five categories, some flagged as misleading
- **Likes and comments** spread across posts

### Demo credentials

| Username | Password      | Role                        |
| -------- | ------------- | --------------------------- |
| `admin`  | `admin123`    | Moderator (`is_staff=true`) |
| `alice`  | `password123` | Regular user                |
| `bob`    | `password123` | Regular user                |
| `carol`  | `password123` | Regular user                |
| `dave`   | `password123` | Regular user                |

---

## Admin Interface

Django's built-in admin is available at **http://localhost:8000/admin/**.

To log in you need a Django superuser. Create one with:

```bash
cd backend
python manage.py createsuperuser
```

The admin interface lets you inspect and edit users, posts, comments, and likes directly.
