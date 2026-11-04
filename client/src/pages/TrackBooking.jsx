import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import './TrackBooking.css';

export default function TrackBooking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  const fetchBooking = (lookupCode, lookupPhone) => {
    if (!lookupCode.trim() || !lookupPhone.trim()) {
      setError('Please provide both your Booking Code and 10-digit Phone Number');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);

    const cleanCode = lookupCode.trim().toUpperCase();
    const cleanPhone = lookupPhone.trim().replace(/\D/g, '');

    api.trackBooking(cleanCode, cleanPhone)
      .then(res => {
        if (res?.data) {
          setBooking(res.data);
          setSearchParams({ code: cleanCode, phone: cleanPhone });
        }
      })
      .catch(err => {
        setError(err.message || 'Booking not found. Please verify your code and phone number.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialCode && initialPhone) {
      fetchBooking(initialCode, initialPhone);
    }
  }, [initialCode, initialPhone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchBooking(code, phone);
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', badgeClass: 'confirmed', desc: 'Your session is confirmed. Meeting details are shown below.' };
      case 'completed':
        return { label: 'Completed', badgeClass: 'completed', desc: 'This session has taken place.' };
      case 'cancelled':
        return { label: 'Cancelled', badgeClass: 'cancelled', desc: 'This booking has been cancelled.' };
      case 'pending_payment':
      default:
        return { label: 'Pending Payment Verification', badgeClass: 'pending_payment', desc: 'We are verifying your payment submission. Once verified, this status will change to Confirmed.' };
    }
  };

  return (
    <div className="container track-page">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>Track Your Booking</h1>
        <p>
          Enter the booking code and phone number used during reservation to view your session status and meeting link.
        </p>
      </div>

      <div className="card track-search-card">
        <form onSubmit={handleSubmit}>
          <div className="track-form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="track-code">
                Booking Code <span className="required">*</span>
              </label>
              <input
                id="track-code"
                type="text"
                className="form-control"
                placeholder="e.g. IC-8F3K2A"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="track-phone">
                Phone Number (10 Digits) <span className="required">*</span>
              </label>
              <input
                id="track-phone"
                type="tel"
                maxLength="10"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
            >
              {loading ? 'Looking up booking...' : 'Lookup Booking'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {booking && (
        <div className="card track-result-card">
          <div className="track-result-header">
            <div>
              <span className="form-hint" style={{ textTransform: 'uppercase' }}>Booking Reference</span>
              <div className="track-code-title">{booking.bookingCode}</div>
            </div>
            <div>
              <span className={`badge badge-status ${getStatusDisplay(booking.status).badgeClass}`}>
                {getStatusDisplay(booking.status).label}
              </span>
            </div>
          </div>

          <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {getStatusDisplay(booking.status).desc}
          </p>

          {/* Meeting Link Callout if confirmed */}
          {booking.status === 'confirmed' && booking.meetingLink && (
            <div className="meeting-callout">
              <h4>Meeting Link Available</h4>
              <p>Your session will take place via Google Meet at the scheduled time:</p>
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="meeting-link-btn"
              >
                Join Google Meet Session &rarr;
              </a>
            </div>
          )}

          {/* Mentor info */}
          <div className="track-mentor-highlight">
            <div className="track-mentor-name">
              Mentor: {booking.mentorId?.name || 'Assigned Mentor'}
            </div>
            <div className="track-mentor-details">
              {booking.mentorId?.iit} &bull; {booking.mentorId?.branch}
            </div>
          </div>

          {/* Schedule details */}
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-val">{booking.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Time Slot:</span>
            <span className="detail-val">{booking.timeSlot} IST</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Duration:</span>
            <span className="detail-val">{booking.mentorId?.sessionDurationMins || 45} minutes</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-val">₹{booking.amount} ({booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'})</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Target Exam:</span>
            <span className="detail-val">{booking.student?.exam}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Student Name:</span>
            <span className="detail-val">{booking.student?.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Registered City:</span>
            <span className="detail-val">{booking.student?.city}</span>
          </div>

          {booking.status === 'pending_payment' && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to={`/booking/${booking.bookingCode}`} className="btn btn-outline btn-block">
                Complete Payment via Google Form &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
