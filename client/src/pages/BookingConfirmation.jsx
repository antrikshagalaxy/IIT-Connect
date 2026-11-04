import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import './BookingConfirmation.css';

export default function BookingConfirmation() {
  const { bookingCode } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState(
    import.meta.env.VITE_GOOGLE_FORM_URL || 'https://forms.google.com/your-payment-form'
  );

  useEffect(() => {
    // Fetch googleFormUrl from server config if available
    api.getConfig()
      .then(res => {
        if (res?.data?.googleFormUrl) {
          setGoogleFormUrl(res.data.googleFormUrl);
        }
      })
      .catch(() => {});

    // If booking was not in navigation state, fetch it by code
    if (!booking && bookingCode) {
      setLoading(true);
      api.getBookingByCode(bookingCode)
        .then(res => {
          if (res?.data) {
            setBooking(res.data);
          }
        })
        .catch(err => {
          setError(err.message || 'Booking details not found');
        })
        .finally(() => setLoading(false));
    }
  }, [bookingCode, booking]);

  const copyCode = () => {
    if (bookingCode) {
      navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="container confirmation-page">
        <div className="alert alert-info">Retrieving booking summary...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container confirmation-page">
        <div className="card confirmation-card">
          <div className="alert alert-error">{error || 'Booking not found'}</div>
          <p>Please check your booking code or track your session below.</p>
          <div className="confirmation-actions">
            <Link to="/track" className="btn btn-primary">
              Track a Booking
            </Link>
            <Link to="/mentors" className="btn btn-secondary">
              Browse Mentors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mentorName = booking.mentor?.name || 'Assigned Mentor';
  const mentorCollege = booking.mentor?.iit || 'IIT';

  return (
    <div className="container confirmation-page">
      <div className="card confirmation-card">
        <div className="confirmation-status-pill">
          Status: Pending Payment Verification
        </div>

        <h1 className="confirmation-title">Booking Reserved</h1>
        <p className="confirmation-subtitle">
          Your slot with <strong>{mentorName}</strong> ({mentorCollege}) has been temporarily reserved.
          Please complete the payment step below to confirm your session.
        </p>

        {/* Code Box */}
        <div className="code-display-box">
          <div className="code-label">Your Booking Code</div>
          <div className="code-value">{booking.bookingCode || bookingCode}</div>
          <button type="button" className="code-copy-btn" onClick={copyCode}>
            {copied ? '✓ Copied to clipboard' : 'Copy Code'}
          </button>
        </div>

        {/* Pay Now Callout */}
        <div className="pay-action-card">
          <h3>Step 2: Pay Now via Google Form</h3>
          <p>
            To verify and lock your slot, please complete payment of <strong>₹{booking.amount}</strong> using
            our official payment submission form.
          </p>

          <ol className="pay-steps-list">
            <li>Click the <strong>Pay Now</strong> button below to open the Google Form in a new tab.</li>
            <li>Make payment via UPI to the QR code / VPA provided on the form.</li>
            <li>
              Enter your booking code <strong>{booking.bookingCode || bookingCode}</strong> and transaction ID in the form.
            </li>
          </ol>

          <div style={{ marginTop: '1.25rem' }}>
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-block"
              style={{ minHeight: '48px', fontSize: '1rem', textDecoration: 'none' }}
            >
              Pay Now via Google Form &rarr;
            </a>
          </div>
        </div>

        {/* Session Details Summary */}
        <div className="card details-card">
          <h3>Session Summary</h3>
          <div className="detail-row">
            <span className="detail-label">Mentor</span>
            <span className="detail-val">{mentorName} ({mentorCollege})</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date</span>
            <span className="detail-val">{booking.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Time Slot</span>
            <span className="detail-val">{booking.timeSlot} IST</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Duration</span>
            <span className="detail-val">{booking.mentor?.sessionDurationMins || 45} minutes</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount</span>
            <span className="detail-val">₹{booking.amount}</span>
          </div>
          {booking.student?.name && (
            <div className="detail-row">
              <span className="detail-label">Student</span>
              <span className="detail-val">{booking.student.name}</span>
            </div>
          )}
        </div>

        <div className="confirmation-actions">
          <Link
            to={`/track?code=${booking.bookingCode || bookingCode}&phone=${booking.student?.phone || ''}`}
            className="btn btn-secondary"
          >
            Track Status of This Booking
          </Link>
          <Link to="/mentors" className="btn btn-outline">
            Browse More Mentors
          </Link>
        </div>
      </div>
    </div>
  );
}
