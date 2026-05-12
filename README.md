# 🎯 ClubHub — Club Management System

A complete, production-ready full-stack web application for managing university clubs, their members, and their activities. Built with **React + Tailwind** on the frontend and **Node.js + Express + MongoDB** on the backend.

---

## ✨ Features

### Authentication
- Secure signup/login with **JWT** tokens
- Password hashing with **bcrypt**
- Persistent sessions via `localStorage`
- Auto-logout on token expiry

### Roles
- **User** — browse, join, and leave clubs; view activity feed
- **Admin** — gated by a unique **Department ID**. Admins create and manage clubs, post events/announcements, and manage members.

### Home Page
- Personalised activity feed from joined clubs
- Recommended clubs based on department and interests
- Quick navigation to discover and profile

### Clubs
- Search by name, description, or tag
- Filter by department and category
- Detailed club page with description, members list, and activity feed
- One-click join / leave

### Club Activities
- Posts, events, and announcements
- Latest-first feed
- Like / unlike with real-time count
- Author or club admin can delete

### Admin Panel
- Per-admin dashboard listing all clubs you administer
- Create new clubs (Department ID required)
- Per-club admin page for editing details, posting activities, and removing members

### Profile
- Edit name, department, bio, and interests
- View all joined clubs
- Upgrade to admin by entering a valid Department ID

### Tech & UX
- Responsive design (mobile-first)
- Toast notifications for all actions
- Loading skeletons and empty states
- Clean, modern UI with Tailwind CSS

---

## 📁 Project Structure

```
club-management/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Signup/login/me/verify-dept
│   │   ├── userController.js        # Profile management
│   │   ├── clubController.js        # Club CRUD + join/leave
│   │   └── activityController.js    # Posts/events/announcements
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT, admin, deptId checks
│   │   └── errorHandler.js          # Global error handler
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Club.js                  # Club schema
│   │   └── Activity.js              # Activity schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── clubRoutes.js
│   │   └── activityRoutes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── seedData.js              # Optional seed script
│   ├── .env.example
│   ├── server.js                    # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js             # API instance with interceptors
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── ClubCard.jsx
    │   │   └── ActivityCard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx      # Global auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Home.jsx
    │   │   ├── Clubs.jsx            # Search & discover
    │   │   ├── ClubDetails.jsx
    │   │   ├── Profile.jsx
    │   │   ├── AdminPanel.jsx
    │   │   └── ClubAdmin.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local install or MongoDB Atlas)
- **npm** or **yarn**

### 1. Clone / extract the project

```bash
cd club-management
```

### 2. Backend setup

```bash
cd backend
npm install

# Create .env from example
cp .env.example .env

# Edit .env — at minimum set:
#   MONGO_URI    -> e.g. mongodb://localhost:27017/club-management
#   JWT_SECRET   -> a strong random string
#   VALID_DEPT_IDS -> comma-separated admin codes
```

Optional — seed sample data:

```bash
npm run seed
```

This creates 3 demo accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `password123` |
| User | `priya@example.com` | `password123` |
| User | `rohan@example.com` | `password123` |

Start the API:

```bash
npm run dev   # with nodemon (recommended for dev)
# or
npm start
```

API runs at `http://localhost:5000`.

### 3. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`. The Vite dev server proxies `/api/*` to the backend automatically.

---

## 🔐 Department ID System

Admin access is **gated by a unique Department ID** that you control via the backend `.env`:

```bash
VALID_DEPT_IDS=CSE-2024-ADMIN,ECE-2024-ADMIN,MECH-2024-ADMIN,...
```

Users can become admin in two ways:
1. **At signup** — expand "I have a Department Admin ID" and enter a valid code
2. **From profile** — existing users can paste a code on the profile page to upgrade

Only users with a valid `departmentId` can create, edit, or delete clubs. Regular users can still join, leave, and post their own likes.

---

## 📡 API Reference (selected)

### Auth
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/verify-dept` | ✅ | Upgrade to admin |

### Clubs
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/clubs` | ✅ | List/search clubs |
| GET | `/api/clubs/recommended` | ✅ | Recommendations |
| GET | `/api/clubs/:id` | ✅ | Club details |
| POST | `/api/clubs` | 🔒 admin+deptId | Create club |
| PUT | `/api/clubs/:id` | 🔒 club admin | Update club |
| DELETE | `/api/clubs/:id` | 🔒 club admin | Delete club |
| POST | `/api/clubs/:id/join` | ✅ | Join club |
| POST | `/api/clubs/:id/leave` | ✅ | Leave club |
| DELETE | `/api/clubs/:id/members/:userId` | 🔒 club admin | Remove member |

### Activities
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/activities/feed` | ✅ | Personal feed |
| GET | `/api/activities/club/:clubId` | ✅ | Club activities |
| POST | `/api/activities/club/:clubId` | 🔒 club admin | Create post |
| DELETE | `/api/activities/:id` | 🔒 author/admin | Delete |
| POST | `/api/activities/:id/like` | ✅ | Toggle like |

### Users
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/users/profile` | ✅ | Get profile |
| PUT | `/api/users/profile` | ✅ | Update profile |
| GET | `/api/users/my-clubs` | ✅ | Joined clubs |

---

## 🗄️ Database Schema

### User
```js
{
  name, email (unique), password (hashed),
  department: enum,
  role: 'user' | 'admin',
  departmentId: String | null,
  interests: [String],
  bio, avatar,
  joinedClubs: [Club],
  timestamps
}
```

### Club
```js
{
  name (unique), description, department, category,
  admin: User, coAdmins: [User], members: [User],
  tags: [String], coverImage,
  timestamps
}
```

### Activity
```js
{
  club: Club, author: User,
  type: 'post' | 'event' | 'announcement',
  title, content,
  eventDate, eventLocation, // events only
  image, likes: [User],
  timestamps
}
```

---

## 🛡️ Security Notes

- Passwords are hashed with bcrypt (10 salt rounds) and never returned by API.
- JWT secret should be a long random string in production.
- CORS is open by default — restrict `origin` in `server.js` for production.
- Add rate limiting (e.g. `express-rate-limit`) before going live.
- Use HTTPS in production.

---

## 🚧 Possible Extensions

- Real-time notifications via Socket.IO
- Image uploads (Cloudinary / S3)
- Email verification & password reset
- Comments on activities
- Club approval workflow before going live
- Calendar view for events
- Analytics dashboard for admins

---

## 📜 License

MIT — free to use for any purpose.
