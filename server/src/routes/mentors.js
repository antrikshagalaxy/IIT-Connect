import express from 'express';
import Mentor from '../models/Mentor.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// GET /mentors?exam=JEE
router.get('/', async (req, res, next) => {
  try {
    // Edge & CDN Cache: fast 60s cache with 5min stale-while-revalidate
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const filter = { isActive: true };
    if (req.query.exam) {
      filter.exams = { $elemMatch: { $regex: req.query.exam, $options: 'i' } };
    }
    const mentors = await Mentor.find(filter).select('-__v').lean();
    res.json({ success: true, data: mentors });
  } catch (err) { next(err); }
});

// GET /mentors/:id
router.get('/:id', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const mentor = await Mentor.findById(req.params.id).select('-__v').lean();
    if (!mentor || !mentor.isActive) return res.status(404).json({ success: false, message: 'Mentor not found' });
    res.json({ success: true, data: mentor });
  } catch (err) { next(err); }
});

// GET /mentors/:id/slots?date=YYYY-MM-DD
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'date query param required (YYYY-MM-DD)' });
    }

    // Reject past dates (compare in IST)
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot book past dates' });
    }

    const mentor = await Mentor.findById(req.params.id);
    if (!mentor || !mentor.isActive) return res.status(404).json({ success: false, message: 'Mentor not found' });

    const [y, m, d] = date.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
    const availEntry = mentor.availability.find(a => a.day === dayOfWeek);
    const allSlots = availEntry ? availEntry.slots : [];

    // Find booked slots for this date
    const bookings = await Booking.find({
      mentorId: mentor._id,
      date,
      status: { $in: ['pending_payment', 'confirmed', 'completed'] }
    }).select('timeSlot');
    const bookedSlots = new Set(bookings.map(b => b.timeSlot));

    const slots = allSlots.map(time => ({
      time,
      available: !bookedSlots.has(time)
    }));

    res.json({ success: true, data: { date, slots } });
  } catch (err) { next(err); }
});

export default router;

