import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import mentorRoutes from './routes/mentors.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS - allow both public client and separate admin panel
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.ADMIN_CLIENT_URL || 'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Mongo sanitize (prevent injection)
app.use(mongoSanitize());

// General rate limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
}));

// Stricter rate limit on booking creation
app.use('/api/v1/bookings', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => req.method !== 'POST',
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking attempts, please slow down' }
}));

// Routes
app.use('/api/v1/mentors', mentorRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/admin', adminRoutes);

// Public config
app.get('/api/v1/config', (req, res) => {
  res.json({
    success: true,
    data: {
      googleFormUrl: process.env.GOOGLE_FORM_URL || '',
      sessionPrice: Number(process.env.SESSION_PRICE) || 599
    }
  });
});

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'IIT Connect API is running' }));

// 404 and error handler
app.use(notFound);
app.use(errorHandler);

export default app;

