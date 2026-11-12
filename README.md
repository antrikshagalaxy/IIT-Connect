# IIT Connect

A full-stack platform enabling students outside the Indian Institutes of Technology (IITs) to book paid 1-on-1 mentoring sessions with students currently studying at top IITs.

Students do **not** need an account or login. They choose a mentor, pick a 45-minute slot in the next 14 days, fill their details and specific doubts, and receive a unique booking code to complete payment via a dedicated Google Form.

---

## Tech Stack

- **Frontend**: React 18 (Vite) + Plain CSS (Custom Design System, no external UI library, no Tailwind)
- **Backend**: Node.js + Express.js (REST API under `/api/v1`)
- **Database**: MongoDB Atlas with Mongoose
- **Validation & Security**: Zod, Helmet, CORS, Express Mongo Sanitize, Rate Limiting
- **Authentication**: JWT authentication for the protected `/admin` panel

---

## Directory Structure

```
IIT Connect/
├── client/                     # Public React (Vite) Student Website (port 5173)
│   ├── src/
│   │   ├── components/         # Navbar, Footer (zero admin links)
│   │   ├── pages/              # Home, Mentors, BookSession, BookingConfirmation, TrackBooking
│   │   ├── services/           # API service client
│   │   ├── App.jsx             # React router configuration
│   │   ├── index.css           # Clean, professional styling & design tokens
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── admin/                      # Standalone Internal Admin Portal (port 5174)
│   ├── src/
│   │   ├── components/         # AdminNavbar
│   │   ├── pages/              # AdminDashboard (Bookings filter, status updates, mentors)
│   │   ├── services/           # Admin API client with JWT
│   │   ├── App.jsx             # Password-protected admin gate
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── server/                     # Express Backend (port 5000)
│   ├── data/
│   │   └── mentors.json        # 9 IIT mentor profiles with weekly slot availability
│   ├── scripts/
│   │   ├── seed.js             # Idempotent database seeder (upsert by name)
│   │   └── test-suite.js       # Complete 10-step integration test runner
│   ├── src/
│   │   ├── config/db.js        # MongoDB Atlas connection
│   │   ├── models/             # Mentor and Booking Mongoose models
│   │   ├── routes/             # Mentors, Bookings, Admin endpoints
│   │   ├── middleware/         # Auth, validation, centralized error handler
│   │   ├── utils/              # Booking code generator, Nodemailer
│   │   └── app.js              # Express app setup with security & dual-origin CORS
│   ├── .env.example
│   ├── server.js
│   └── package.json
└── README.md
```

---

## Environment Variables

### Backend (`/server/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas SRV connection string | `mongodb+srv://<user>:<password>@cluster0.kujjayh.mongodb.net/iitconnect?retryWrites=true&w=majority` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing admin JWT tokens | `random_long_string_here` |
| `JWT_EXPIRES_IN`| Token expiration window | `8h` |
| `ADMIN_PASSWORD`| Single password used to access the `/admin` portal | `your_secret_admin_password` |
| `SESSION_PRICE` | Fallback price (in ₹) if mentor has no custom fee | `599` |
| `GOOGLE_FORM_URL`| Link to your Google Form for student payment | `https://forms.google.com/your-payment-form` |
| `EMAIL_USER` | *(Optional)* Gmail address for sending booking emails | `you@gmail.com` |
| `EMAIL_PASS` | *(Optional)* Gmail App Password (16 characters) | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | *(Optional)* Sender header | `IIT Connect <you@gmail.com>` |
| `ADMIN_EMAIL`| *(Optional)* Email address to receive notifications | `antrikshaaman@gmail.com` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |

### Frontend (`/client/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base API URL pointing to the backend | `http://localhost:5000/api/v1` |
| `VITE_GOOGLE_FORM_URL` | Google Form link opened by the "Pay now" button | `https://forms.google.com/your-payment-form` |

---

## MongoDB Atlas Setup Guide

1. **Create an Atlas Account**: Visit [cloud.mongodb.com](https://cloud.mongodb.com) and create a free M0 cluster.
2. **Create a Database User**:
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Choose **Password Authentication**.
   - Enter a username (e.g., `iitadmin`) and a password (avoid `@` or URL-encode special characters, or use letters/numbers).
   - Under **Database User Privileges**, select **Read and write to any database**.
   - Click **Add User**.
3. **Allow Network Access (IP Whitelist)**:
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) for cloud hosting, or add your current IP.
4. **Get Connection String**:
   - Go to **Deployment > Database**.
   - Click **Connect** next to your cluster -> select **Drivers** (Node.js 5.5+).
   - Copy the connection string and paste it into `/server/.env`:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.kujjayh.mongodb.net/iitconnect?retryWrites=true&w=majority
     ```

---

## Local Development Setup

### 1. Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your MONGODB_URI and ADMIN_PASSWORD in .env

npm install
npm run seed      # Seeds the 9 IIT mentors into MongoDB
npm run dev       # Starts backend with nodemon on port 5000
```

### 2. Frontend Setup

In a separate terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

---

## How to Edit Mentors & Re-Seed

Mentor data is stored in [`server/data/mentors.json`](./server/data/mentors.json).

1. Open `server/data/mentors.json`.
2. Edit or add mentor entries:
   ```json
   {
     "name": "Arjun Sharma",
     "iit": "IIT Bombay",
     "branch": "Computer Science & Engineering",
     "year": "3rd Year B.Tech",
     "exams": ["JEE Advanced", "JEE Mains"],
     "subjects": ["Mathematics", "Physics"],
     "languages": ["Hindi", "English"],
     "bio": "AIR 47 in JEE Advanced 2023. Specialises in Maths & Physics.",
     "pricePerSession": 599,
     "isActive": true,
     "sessionDurationMins": 45,
     "availability": [
       { "day": 1, "slots": ["10:00", "11:00", "16:00", "17:00"] },
       { "day": 3, "slots": ["10:00", "11:00", "16:00", "17:00"] }
     ]
   }
   ```
   *Note: `day` is an integer from 0 (Sunday) to 6 (Saturday).*
3. Run the idempotent seed script:
   ```bash
   cd server
   npm run seed
   ```
   The script performs an upsert by mentor name so existing records are updated without duplicates.

---

## How to Change the Google Form Payment Link

1. Update `GOOGLE_FORM_URL` in [`server/.env`](./server/.env).
2. Update `VITE_GOOGLE_FORM_URL` in [`client/.env`](./client/.env).
3. In production, update this variable in your hosting dashboard (Vercel & Render).

The Google Form should include fields for:
- Student Name
- Booking Code (e.g. `IC-8F3K2A`)
- UPI Transaction ID / Screenshot upload

---

## Deployment Guide

### Deploying Backend on Render

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New + > Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `CLIENT_URL`: your frontend Vercel URL (e.g. `https://iit-connect.vercel.app`)
   - `JWT_SECRET`: your secret key
   - `ADMIN_PASSWORD`: your admin password
   - `GOOGLE_FORM_URL`: your Google Form URL
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.

### Deploying Frontend on Vercel

1. In [Vercel Dashboard](https://vercel.com), click **Add New > Project**.
2. Select your repository.
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: your Render backend URL + `/api/v1` (e.g. `https://iit-connect-api.onrender.com/api/v1`)
   - `VITE_GOOGLE_FORM_URL`: your Google Form URL
5. Click **Deploy**.

---

## Double-Booking Prevention

Concurrency safety is guaranteed through a partial unique compound index in MongoDB:

```js
bookingSchema.index(
  { mentorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending_payment', 'confirmed', 'completed'] } }
  }
);
```

If two students attempt to book the exact same slot at the exact same moment:
1. The first write succeeds and receives HTTP `201 Created`.
2. The second write encounters a MongoDB `E11000 duplicate key error`.
3. The server catches code 11000 and responds with HTTP `409 Conflict`:
   ```json
   { "success": false, "message": "Slot just got booked, please pick another" }
   ```
4. The frontend captures the 409 error, refreshes the available slots for that date, and displays a clear message asking the student to pick another slot without losing their form details.

---

## Design System

- **Background**: `#FFFFFF`
- **Section Accent**: `#EAF3FB`
- **Action Buttons & Links**: `#4A90C2` (Hover `#3B7BA8`)
- **Primary Text**: `#1F3A52`
- **Secondary Text**: `#4D6475`
- **Borders**: `#D6E5F3`
- **Typography**: Inter / System sans-serif stack
- **Responsive**: Mobile-first architecture, tested down to 360px screen width with a minimum 44px touch target height.
