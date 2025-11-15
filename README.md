# 📅 Multiuser Calendar Availability

A full-stack web application that enables multiple users to manage and share their availability through an interactive calendar interface. Users can register, authenticate, create time slots, and view availability across the organization.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 🌟 Features

- **User Authentication** - Secure JWT-based authentication with HTTP-only cookies
- **Availability Management** - Create, update, and delete time slots
- **Multi-user View** - Browse and view other users' schedules
- **Real-time Updates** - Socket.io integration for live calendar synchronization
- **Recurring Events** - Support for both one-time and recurring availability
- **Interactive Calendar** - Built with FullCalendar for seamless user experience
- **Responsive Design** -Tried to Optimized for desktop and mobile devices

---

## 🚀 Live Demo

- **Frontend Application:** [https://calendar-availability-multiuser.onrender.com/](https://calendar-availability-multiuser.onrender.com/)
- **Backend API:** [https://calendar-availability-backend.onrender.com/api/](https://calendar-availability-backend.onrender.com/api/)
That might not worked in incognito or in few times!

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **FullCalendar** - Calendar component
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **JWT** - Token-based authentication
- **Socket.io** - WebSocket server
- **bcrypt** - Password hashing

### Deployment
- **Render** - Cloud hosting platform

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Git

---

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd multiuser-calendar-availability
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/calendar_db

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
COOKIE_NAME=token

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

Initialize the database:
You have to execute shema.sql in query pool or sql tool for initializing all table after creating database

```bash
# Create database and run schema
psql -U postgres
CREATE DATABASE calendar_db;
\c calendar_db
\i schema.sql
```

Start the backend server:

```bash
npm run dev
```

The backend server will run on `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Update the API configuration in `src/axios/` or relevant config file:

```javascript
const base = "http://localhost:4000"; //socket
const baseUrl = "http://localhost:4000/api";
```

Start the frontend application:

```bash
npm start
```

The frontend will run on `http://localhost:3000`

---

## 📁 Project Structure

### Frontend

```
frontend/
├── public/
├── src/
│   ├── axios/           # API configuration and interceptors
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components (Auth, Calendar, etc.)
│   ├── utils/           # Helper functions
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

### Backend

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, error handling
│   └── utils/           # Helper functions zod validation and other schema validation
├── db.js                # Database connection
├── schema.sql           # Database schema have to excute in query tool or sql in pgAdmin4
├── index.js             # Entry point
├── .env
└── package.json
```

---

## 🔌 API Documentation

### Base URL

```
Production: https://calendar-availability-backend.onrender.com/api
Development: http://localhost:4000/api
```

### Authentication Endpoints

| Method | Endpoint          | Description        | Auth Required |
|--------|-------------------|--------------------|---------------|
| POST   | `/auth/register`  | Create new account | No            |
| POST   | `/auth/login`     | User login         | No            |
| POST   | `/auth/logout`    | User logout        | Yes           |

**Register Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Login Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### User Endpoints

| Method | Endpoint    | Description           | Auth Required |
|--------|-------------|-----------------------|---------------|
| GET    | `/users/me` | Get current user info | Yes           |
| PUT    | `/users/me` | Update user profile   | Yes           |
| GET    | `/users`    | Get all users         | Yes           |

### Availability Endpoints

| Method | Endpoint              | Description                    | Auth Required |
|--------|-----------------------|--------------------------------|---------------|
| POST   | `/availability`       | Create availability slot       | Yes           |
| PUT    | `/availability/:id`   | Update availability slot       | Yes           |
| DELETE | `/availability/:id`   | Delete availability slot       | Yes           |
| GET    | `/availability`       | Get availability (with params) | Yes           |

**Query Parameters for GET `/availability`:**
- `start` - Start datetime (ISO 8601 format)
- `end` - End datetime (ISO 8601 format)
- `userId` - (Optional) Get specific user's availability

**Create Availability Request Body:**
```json
{
    "start": "2025-11-13T13:00:00",
    "end": "2025-11-13T14:00:00",
    "status": "AVAILABLE",
    "description":"testing"
    "recurringRule": "FREQ=WEEKLY;BYDAY=MO,WE,FR"
}
```

---

## 🗄️ Database Schema

### users Table

| Column     | Type        | Constraints           |
|------------|-------------|-----------------------|
| id         | UUID        | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| name       | VARCHAR(255)| NOT NULL              |
| email      | VARCHAR(255)| UNIQUE, NOT NULL      |
| password   | VARCHAR(255)| NOT NULL              |
| created_at | TIMESTAMPTZ | DEFAULT NOW()         |

### availability Table

| Column     | Type        | Constraints           |
|------------|-------------|-----------------------|
| id         | UUID        | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| user_id    | UUID        | FOREIGN KEY → users(id), ON DELETE CASCADE |
| start      | TIMESTAMP   | NOT NULL              |
| end        | TIMESTAMP   | NOT NULL              |
| created_at | TIMESTAMPTZ | DEFAULT NOW()         |

---

## 🔐 Authentication Flow

1. User submits email and password through login form
2. Backend validates credentials against database
3. If valid, server generates JWT token with user payload
4. Token is sent to client via **HTTP-only cookie**
5. Frontend includes cookie automatically in subsequent requests
6. Backend middleware verifies token on protected routes
7. User session maintained until logout or token expiration (7 days default)

---

## 📱 Usage Guide

### For Users

1. **Sign Up**
   - Navigate to signup page
   - Provide name, email, and password
   - Submit to create account

2. **Login**
   - Enter registered email and password
   - Access your personal calendar dashboard

3. **Create Availability**
   - Click on calendar time slots or
   - Select start and end time
   - Add description or 
   - for recurrence add daily/weekly/monthly and end date of recurrence 
   - Save to add to your schedule

4. **View Others' Availability**
   - Navigate to users list
   - Select a user to view their calendar
   - See their available time slots

5. **Manage Your Schedule**
   - Click on existing events to edit or delete
   - if user create one event for 2 to 3 am and again create for 2 to 6 then that will create again and shows overlapping events
   - Real-time updates across all sessions

---

## 🔄 Real-time Features

The application uses Socket.io for real-time synchronization:

- **Event Creation** - New availability appears immediately for all users
- **Event Updates** - Changes reflect across all active sessions
- **Event Deletion** - Removed events disappear in real-time

---

This project is open-source and available for testing and development use.

---

## 👨‍💻 Developer

**Nikhil Muliya**

---

## 📧 Support

Give a star, don't forget! ⭐⭐⭐⭐⭐⭐

---

## 🔮 Future Enhancements

- [ ] Email notifications for availability changes
- [ ] Calendar export (iCal format)
- [ ] Multiple user availability views
- [ ] Integration with Google Calendar
- [ ] Advanced recurring patterns
- [ ] Availability templates

---

## 🙏 Acknowledgments

- [FullCalendar](https://fullcalendar.io/) for the calendar component
- [Render](https://render.com/) for hosting
- The open-source community

---

**Made with ❤️ by Nikhil Muliya**
