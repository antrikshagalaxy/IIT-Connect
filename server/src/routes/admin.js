import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import Mentor from '../models/Mentor.js';
import Booking from '../models/Booking.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /admin/login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
  res.json({ success: true, data: { token } });
});

// All routes below require admin
router.use(requireAdmin);

// GET /admin/bookings?status=&date=&mentorId=
router.get('/bookings', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.mentorId) filter.mentorId = req.query.mentorId;
    const bookings = await Booking.find(filter)
      .populate('mentorId', 'name iit branch year pricePerSession')
      .sort({ dateUTC: 1 })
      .select('-__v');
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
});

// PATCH /admin/bookings/:id
const updateBookingSchema = z.object({
  status: z.enum(['pending_payment', 'confirmed', 'cancelled', 'completed']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid']).optional(),
  meetingLink: z.string().url().optional().or(z.literal(''))
});

router.patch('/bookings/:id', async (req, res, next) => {
  try {
    const parsed = updateBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, parsed.data, { new: true })
      .populate('mentorId', 'name iit branch year pricePerSession');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// GET /admin/mentors
router.get('/mentors', async (req, res, next) => {
  try {
    const mentors = await Mentor.find().select('-__v');
    res.json({ success: true, data: mentors });
  } catch (err) { next(err); }
});

// POST /admin/mentors
router.post('/mentors', async (req, res, next) => {
  try {
    const mentor = await Mentor.create(req.body);
    res.status(201).json({ success: true, data: mentor });
  } catch (err) { next(err); }
});

// PUT /admin/mentors/:id
router.put('/mentors/:id', async (req, res, next) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.json({ success: true, data: mentor });
  } catch (err) { next(err); }
});

// DELETE /admin/mentors/:id  (soft delete — sets isActive: false)
router.delete('/mentors/:id', async (req, res, next) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.json({ success: true, data: mentor, message: 'Mentor deactivated' });
  } catch (err) { next(err); }
});

export default router;

