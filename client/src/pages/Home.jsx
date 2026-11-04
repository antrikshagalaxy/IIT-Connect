import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './Home.css';

export default function Home() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.getMentors()
      .then(res => {
        if (res?.data) {
          setMentors(res.data.slice(0, 3));
        }
      })
      .catch(() => {
        // Fallback or empty state handled gracefully
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Who are the mentors on IIT Connect?',
      a: 'All our mentors are currently enrolled undergraduate and integrated master students at top IITs (IIT Bombay, IIT Delhi, IIT Madras, etc.). Every mentor was ranked in the top percentiles in JEE Advanced, JEE Mains, NEET, or GATE.'
    },
    {
      q: 'Do students need to create an account or register?',
      a: 'No. There are no student logins or accounts. You simply select a mentor, pick an available slot, enter your basic contact details, and submit your booking.'
    },
    {
      q: 'How does the session take place?',
      a: 'Sessions are 1-on-1 virtual meetings (typically 45 minutes) conducted over Google Meet. Once your payment is verified by our team, the meeting link will appear in your booking tracker and be emailed to you.'
    },
    {
      q: 'How do I pay for the session?',
      a: 'After reserving a slot, you will receive a unique booking code (e.g. IC-8F3K2A). Click "Pay now" to open our official Google Form, complete the payment via UPI, and submit the booking code. Our team verifies the transaction and updates your booking to confirmed.'
    },
    {
      q: 'Can I track the status of my booking?',
      a: 'Yes. You can visit the Track Booking page at any time, enter your booking code and the 10-digit phone number you provided, and check whether your slot is pending verification or confirmed.'
    }
  ];

  return (
    <div>
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-badge">Direct Mentorship Platform</div>
          <h1 className="hero-title">
            1-on-1 Mentoring Sessions with Current IIT Students
          </h1>
          <p className="hero-lead">
            For students at coaching institutes preparing for JEE, NEET, and GATE.
            Book a focused 45-minute guidance session with a mentor who cleared the exact exam you are targeting.
          </p>

          <div className="hero-actions">
            <Link to="/mentors" className="btn btn-primary">
              View All Mentors
            </Link>
            <Link to="/track" className="btn btn-secondary">
              Track Existing Booking
            </Link>
          </div>

          <div className="hero-metrics">
            <div className="metric-item">
              <strong>8–9 Mentors</strong>
              <span>Enrolled at premier IITs</span>
            </div>
            <div className="metric-item">
              <strong>45 Minutes</strong>
              <span>Dedicated 1-on-1 session</span>
            </div>
            <div className="metric-item">
              <strong>No Login</strong>
              <span>Instant slot reservation</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>A simple three-step process to get personal advice from an IITian.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Pick a Mentor</h3>
              <p>
                Browse our fixed team of mentors. Review their IIT, engineering branch,
                exams cleared, subject focus, and language comfort.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Choose a Slot</h3>
              <p>
                Pick any available date over the next 14 days and select an open time slot.
                Enter your details and specific questions.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Pay via Form</h3>
              <p>
                Get your unique booking code (e.g. IC-8F3K2A). Complete payment on the
                designated Google Form. We confirm your slot and send meeting details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Preview */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Meet Our Mentors</h2>
            <p>Current IITians ready to share their preparation strategies and answer your doubts.</p>
          </div>

          {loading ? (
            <div className="alert alert-info">Loading mentors...</div>
          ) : (
            <div className="mentors-grid">
              {mentors.map((mentor) => (
                <div key={mentor._id} className="mentor-card">
                  <div className="mentor-card-top">
                    <div className="mentor-header">
                      <span className="mentor-name">{mentor.name}</span>
                      <span className="mentor-iit-badge">{mentor.iit}</span>
                    </div>
                    <div className="mentor-branch">{mentor.branch}</div>
                    <div className="mentor-year">{mentor.year}</div>

                    <div className="mentor-tags">
                      {mentor.exams?.map((e) => (
                        <span key={e} className="badge badge-accent">{e}</span>
                      ))}
                    </div>

                    <p className="mentor-bio">{mentor.bio}</p>

                    <div className="mentor-meta">
                      <strong>Subjects:</strong> {mentor.subjects?.join(', ')}
                    </div>
                    <div className="mentor-meta">
                      <strong>Languages:</strong> {mentor.languages?.join(', ')}
                    </div>
                  </div>

                  <div className="mentor-card-footer">
                    <div className="mentor-price-tag">
                      <span className="mentor-price-amount">₹{mentor.pricePerSession}</span>
                      <span className="mentor-price-unit">{mentor.sessionDurationMins || 45} mins</span>
                    </div>
                    <Link to={`/book/${mentor._id}`} className="btn btn-primary btn-sm">
                      Book Session
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-footer-cta">
            <Link to="/mentors" className="btn btn-secondary">
              View All Mentors
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-alt" id="faq">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about booking and preparing for your session.</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
