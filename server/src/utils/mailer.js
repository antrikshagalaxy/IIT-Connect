import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
}

export async function sendBookingEmail(booking, mentor) {
  const t = getTransporter();
  if (!t) return; // Email not configured, skip silently

  const subject = `Booking Confirmed – ${booking.bookingCode} | IIT Connect`;
  const html = `
    <p>Hi ${booking.student.name},</p>
    <p>Your session with <strong>${mentor.name}</strong> (${mentor.iit}) has been booked.</p>
    <ul>
      <li>Booking Code: <strong>${booking.bookingCode}</strong></li>
      <li>Date: ${booking.date}</li>
      <li>Time: ${booking.timeSlot} IST</li>
      <li>Duration: ${mentor.sessionDurationMins} mins</li>
      <li>Amount: ₹${booking.amount}</li>
    </ul>
    <p>Please complete payment using your booking code: <strong>${booking.bookingCode}</strong></p>
    <p>– IIT Connect Team</p>
  `;

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.student.email,
      subject,
      html
    });
    if (process.env.ADMIN_EMAIL) {
      await t.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Booking: ${booking.bookingCode}`,
        html: `<p>New booking from ${booking.student.name} (${booking.student.email}) with ${mentor.name} on ${booking.date} at ${booking.timeSlot}.</p>`
      });
    }
  } catch (err) {
    console.error('Email send failed (non-fatal):', err.message);
  }
}

