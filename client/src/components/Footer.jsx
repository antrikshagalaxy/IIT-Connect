import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h4>IIT Connect</h4>
            <p>
              Focused 1-on-1 mentoring sessions for coaching students outside IIT.
              Get practical guidance directly from current IITians who cracked the exams.
            </p>
            <div className="footer-contact">
              Support email: <a href="mailto:contact@iitconnect.in">contact@iitconnect.in</a>
            </div>
          </div>

          <div className="footer-column">
            <h5>Navigation</h5>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/mentors">Our Mentors</Link></li>
              <li><Link to="/track">Track Booking</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>How It Works</h5>
            <ul>
              <li><Link to="/mentors">1. Pick an IIT Mentor</Link></li>
              <li><Link to="/mentors">2. Select Date & Slot</Link></li>
              <li><Link to="/track">3. Verify Payment</Link></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            IIT Connect is an independent student-led mentoring platform. We are not officially
            endorsed by or affiliated with the Indian Institutes of Technology administration.
          </p>
          <p>&copy; {new Date().getFullYear()} IIT Connect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
