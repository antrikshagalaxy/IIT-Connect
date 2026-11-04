import express from 'express';
import { z } from 'zod';
import Mentor from '../models/Mentor.js';
import Booking from '../models/Booking.js';
import { generateBookingCode } from '../utils/bookingCode.js';
import { sendBookingEmail } from '../utils/mailer.js';

const router = express.Router();

const studentSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  exam: z.string().min(1).max(50),
  classOrYear: z.string().min(1).max(50),
  institute: z.string().max(100).optional().default(''),
  city: z.string().min(2).max(100),
  topic: z.string().min(5).max(1000)
});

const bookingSchema = z.object({
  mentorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  student: studentSchema
});

// POST /bookings
router.post('/', async (req, res, next) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const { mentorId, date, timeSlot, student } = parsed.data;

    // Check mentor exists and is active
    const mentor = await Mentor.findById(mentorId);
    if (!mentor || !mentor.isActive) {
      return res.status(404).json({ success: false, message: 'Mentor not found or not available' });
    }

    // Reject past dates
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot book a past date' });
    }
    // Reject more than 14 days ahead
    const maxDate = new Date(nowIST);
    maxDate.setDate(maxDate.getDate() + 14);
    const maxDateStr = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
    if (date > maxDateStr) {
      return res.status(400).json({ success: false, message: 'Date must be within the next 14 days' });
    }

    // Check slot is in mentor's availability
    const [y, m, d] = date.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
    const availEntry = mentor.availability.find(a => a.day === dayOfWeek);
    if (!availEntry || !availEntry.slots.includes(timeSlot)) {
      return res.status(400).json({ success: false, message: 'This time slot is not available for this mentor' });
    }

    const bookingCode = generateBookingCode();
    const amount = mentor.pricePerSession || Number(process.env.SESSION_PRICE) || 599;

    // Parse date to UTC for sorting
    const [h, min] = timeSlot.split(':').map(Number);
    // IST = UTC+5:30
    const dateUTC = new Date(Date.UTC(y, m - 1, d, h - 5, min - 30));

    const booking = await Booking.create({
      bookingCode,
      mentorId: mentor._id,
      student,
      date,
      timeSlot,
      dateUTC,
      amount
    });

    // Send email (non-blocking)
    sendBookingEmail(booking, mentor).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        bookingCode: booking.bookingCode,
        bookingId: booking._id,
        amount: booking.amount,
        date: booking.date,
        timeSlot: booking.timeSlot,
        mentor: {
          id: mentor._id,
          name: mentor.name,
          iit: mentor.iit,
          branch: mentor.branch,
          sessionDurationMins: mentor.sessionDurationMins
        },
        student: {
          name: booking.student.name,
          email: booking.student.email,
          phone: booking.student.phone
        }
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Slot just got booked, please pick another' });
    }
    next(err);
  }
});

// GET /bookings/by-code/:code -> for the booking confirmation page (/booking/:bookingCode)
router.get('/by-code/:code', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingCode: req.params.code.toUpperCase() })
      .populate('mentorId', 'name iit branch year sessionDurationMins pricePerSession photoUrl');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({
      success: true,
      data: {
        bookingCode: booking.bookingCode,
        mentor: booking.mentorId,
        student: {
          name: booking.student.name,
          email: booking.student.email,
          phone: booking.student.phone,
          exam: booking.student.exam
        },
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amount: booking.amount,
        meetingLink: booking.meetingLink,
        createdAt: booking.createdAt
      }
    });
  } catch (err) { next(err); }
});

// GET /bookings/track?code=&phone=
router.get('/track', async (req, res, next) => {
  try {
    const { code, phone } = req.query;
    if (!code || !phone) {
      return res.status(400).json({ success: false, message: 'code and phone are required' });
    }
    const booking = await Booking.findOne({ bookingCode: code.toUpperCase() })
      .populate('mentorId', 'name iit branch year exams subjects languages bio pricePerSession photoUrl sessionDurationMins availability');
    if (!booking || booking.student.phone !== phone) {
      return res.status(404).json({ success: false, message: 'Booking not found. Please check the code and phone number.' });
    }
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

export default router;

