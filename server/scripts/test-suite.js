import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import app from '../src/app.js';
import Mentor from '../src/models/Mentor.js';
import Booking from '../src/models/Booking.js';
import jwt from 'jsonwebtoken';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('--- STARTING IIT CONNECT FULL TEST SUITE ---');
  process.env.ADMIN_PASSWORD = 'test_admin_pass';
  process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890';
  process.env.NODE_ENV = 'development';

  const uri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/iitconnect_test';
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB for testing at:', uri);

  // Clear collections
  await Mentor.deleteMany({});
  await Booking.deleteMany({});
  console.log('✓ Cleaned test database collections');

  // Ensure compound index for double booking prevention is created
  await Booking.syncIndexes();
  console.log('✓ Verified Booking compound index (mentorId, date, timeSlot)');

  // 1. Seed mentors
  const mentorsData = JSON.parse(
    readFileSync(join(__dirname, '../data/mentors.json'), 'utf-8')
  );
  for (const m of mentorsData) {
    await Mentor.create(m);
  }
  const mentorCount = await Mentor.countDocuments();
  console.log(`✓ Mentors seeded successfully: ${mentorCount} mentors`);
  if (mentorCount !== 9) throw new Error(`Expected 9 mentors, got ${mentorCount}`);

  // Start HTTP server on dynamic port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`✓ Test Express server listening on ${baseUrl}`);

  try {
    // 2. Test GET /mentors
    const mentorsRes = await fetch(`${baseUrl}/mentors`).then(r => r.json());
    if (!mentorsRes.success || mentorsRes.data.length !== 9) {
      throw new Error('GET /mentors failed or length != 9');
    }
    console.log('✓ GET /mentors returned all 9 mentors without pagination');

    // Test exam filter
    const neetRes = await fetch(`${baseUrl}/mentors?exam=NEET`).then(r => r.json());
    if (!neetRes.success || neetRes.data.length === 0) {
      throw new Error('GET /mentors?exam=NEET failed');
    }
    console.log(`✓ GET /mentors?exam=NEET filtered successfully (${neetRes.data.length} mentors)`);

    // Pick first mentor
    const testMentor = mentorsRes.data[0];
    console.log(`✓ Selected mentor: ${testMentor.name} (${testMentor.iit})`);

    // 3. Find an upcoming valid date matching mentor availability
    const mentorAvailabilityDays = testMentor.availability.map(a => a.day);
    let targetDateStr = null;
    let targetTimeSlot = null;

    const now = new Date();
    for (let i = 1; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const [y, m, dt] = [d.getFullYear(), d.getMonth(), d.getDate()];
      const dayOfWeek = new Date(Date.UTC(y, m, dt, 12, 0, 0)).getUTCDay();
      
      const avail = testMentor.availability.find(a => a.day === dayOfWeek);
      if (avail && avail.slots?.length > 0) {
        targetDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dt).padStart(2, '0')}`;
        targetTimeSlot = avail.slots[0];
        break;
      }
    }

    if (!targetDateStr) throw new Error('Could not find available slot in next 14 days');
    console.log(`✓ Target test slot found: ${targetDateStr} at ${targetTimeSlot}`);

    // 4. Test GET /mentors/:id/slots
    const slotsRes = await fetch(`${baseUrl}/mentors/${testMentor._id}/slots?date=${targetDateStr}`).then(r => r.json());
    if (!slotsRes.success || !slotsRes.data.slots.some(s => s.time === targetTimeSlot && s.available)) {
      throw new Error('GET /mentors/:id/slots did not show slot available');
    }
    console.log('✓ GET /mentors/:id/slots correctly returned available slots');

    // 5. Test POST /bookings (First student booking)
    const bookingPayload1 = {
      mentorId: testMentor._id,
      date: targetDateStr,
      timeSlot: targetTimeSlot,
      student: {
        name: 'Aakash Sharma',
        email: 'aakash.sharma@example.com',
        phone: '9876543210',
        exam: 'JEE Advanced',
        classOrYear: 'Class 12',
        institute: 'Allen Kota',
        city: 'Kota, Rajasthan',
        topic: 'Mastering Rotational Dynamics and solving Irodov problems systematically.'
      }
    };

    const book1Res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload1)
    });
    const book1Data = await book1Res.json();
    if (book1Res.status !== 201 || !book1Data.data.bookingCode) {
      throw new Error(`First booking failed: ${JSON.stringify(book1Data)}`);
    }
    const bookingCode = book1Data.data.bookingCode;
    console.log(`✓ Student 1 booked successfully! Code: ${bookingCode}, Status: HTTP 201`);

    // 6. TEST DOUBLE-BOOKING PREVENTION (Second student attempts exact same slot)
    console.log('Testing Double-Booking Prevention: submitting second booking for identical slot...');
    const bookingPayload2 = {
      mentorId: testMentor._id,
      date: targetDateStr,
      timeSlot: targetTimeSlot,
      student: {
        name: 'Another Student',
        email: 'another@example.com',
        phone: '9123456789',
        exam: 'JEE Mains',
        classOrYear: 'Dropper',
        city: 'Delhi',
        topic: 'Coordinate geometry doubt clearing.'
      }
    };

    const book2Res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload2)
    });
    const book2Data = await book2Res.json();

    if (book2Res.status === 409 && book2Data.message.includes('Slot just got booked')) {
      console.log('✓ DOUBLE-BOOKING SAFELY PREVENTED! Status: HTTP 409 Conflict with message:', book2Data.message);
    } else {
      throw new Error(`Double booking was NOT prevented! Status: ${book2Res.status}, data: ${JSON.stringify(book2Data)}`);
    }

    // 7. Verify slot is now marked unavailable in GET /slots
    const slotsResAfter = await fetch(`${baseUrl}/mentors/${testMentor._id}/slots?date=${targetDateStr}`).then(r => r.json());
    const bookedSlotCheck = slotsResAfter.data.slots.find(s => s.time === targetTimeSlot);
    if (bookedSlotCheck && bookedSlotCheck.available === false) {
      console.log('✓ Slot correctly marked "available: false" in slot queries');
    } else {
      throw new Error('Slot was not marked unavailable after booking');
    }

    // 8. Test GET /bookings/by-code/:code (Confirmation page public summary)
    const codeLookupRes = await fetch(`${baseUrl}/bookings/by-code/${bookingCode}`).then(r => r.json());
    if (!codeLookupRes.success || codeLookupRes.data.bookingCode !== bookingCode) {
      throw new Error('GET /bookings/by-code/:code failed');
    }
    console.log('✓ GET /bookings/by-code/:code returned session summary for confirmation page');

    // 9. Test GET /bookings/track?code=&phone=
    const trackRes = await fetch(`${baseUrl}/bookings/track?code=${bookingCode}&phone=9876543210`).then(r => r.json());
    if (!trackRes.success || trackRes.data.status !== 'pending_payment') {
      throw new Error('GET /bookings/track failed');
    }
    console.log('✓ GET /bookings/track succeeded with status: pending_payment');

    // Test invalid phone rejection
    const trackBadPhone = await fetch(`${baseUrl}/bookings/track?code=${bookingCode}&phone=9999999999`);
    if (trackBadPhone.status === 404) {
      console.log('✓ Invalid phone rejected with HTTP 404');
    } else {
      throw new Error('Invalid phone was not rejected');
    }

    // 10. Admin Flow
    // Login
    const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test_admin_pass' })
    }).then(r => r.json());

    if (!adminLoginRes.success || !adminLoginRes.data.token) {
      throw new Error('Admin login failed');
    }
    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin login succeeded, JWT token issued');

    // Get Admin Bookings
    const adminBookingsRes = await fetch(`${baseUrl}/admin/bookings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());

    if (!adminBookingsRes.success || adminBookingsRes.data.length !== 1) {
      throw new Error('Admin bookings list failed');
    }
    const bookingId = adminBookingsRes.data[0]._id;
    console.log(`✓ Admin retrieved bookings list (found booking ID: ${bookingId})`);

    // Patch booking (Mark paid & set meeting link)
    const patchRes = await fetch(`${baseUrl}/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'confirmed',
        paymentStatus: 'paid',
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      })
    }).then(r => r.json());

    if (!patchRes.success || patchRes.data.status !== 'confirmed') {
      throw new Error('Admin patch booking failed');
    }
    console.log('✓ Admin updated booking: status=confirmed, paymentStatus=paid, meetingLink set');

    // Verify track endpoint now reflects confirmed status and shows meeting link
    const trackAfterConfirm = await fetch(`${baseUrl}/bookings/track?code=${bookingCode}&phone=9876543210`).then(r => r.json());
    if (trackAfterConfirm.data.status === 'confirmed' && trackAfterConfirm.data.meetingLink === 'https://meet.google.com/abc-defg-hij') {
      console.log('✓ Student tracking verifies confirmed status and meeting link');
    } else {
      throw new Error('Track did not show confirmed status or meeting link');
    }

    console.log('\n========================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (10/10)');
    console.log('========================================\n');

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
