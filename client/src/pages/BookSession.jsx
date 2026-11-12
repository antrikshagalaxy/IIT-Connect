import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import './BookSession.css';

// Helper to generate next 14 calendar dates
function getNext14Days() {
  const dates = [];
  const now = new Date();
  
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();

    dates.push({
      dateStr,
      dayName,
      monthName,
      dayNum
    });
  }
  return dates;
}

export default function BookSession() {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState(null);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [mentorError, setMentorError] = useState(null);

  const availableDates = getNext14Days();
  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.dateStr || '');
  
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Student form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    exam: '',
    classOrYear: '',
    institute: '',
    city: '',
    topic: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch mentor details
  useEffect(() => {
    setLoadingMentor(true);
    setMentorError(null);
    api.getMentor(mentorId)
      .then(res => {
        if (res?.data) {
          setMentor(res.data);
          // Set default exam from mentor's list if available
          if (res.data.exams?.length > 0) {
            setFormData(prev => ({ ...prev, exam: res.data.exams[0] }));
          }
        }
      })
      .catch(err => {
        setMentorError(err.message || 'Mentor not found or unavailable');
      })
      .finally(() => setLoadingMentor(false));
  }, [mentorId]);

  // Fetch slots whenever selectedDate or mentorId changes
  useEffect(() => {
    if (!mentorId || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    api.getMentorSlots(mentorId, selectedDate)
      .then(res => {
        setSlots(res?.data?.slots || []);
      })
      .catch(() => {
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [mentorId, selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validate = () => {
    const errors = {};
    if (!selectedDate) errors.date = 'Please select a date';
    if (!selectedSlot) errors.slot = 'Please select a time slot';

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Please enter your full name (minimum 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    const phoneClean = formData.phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!formData.exam.trim()) {
      errors.exam = 'Please select the exam you are preparing for';
    }

    if (!formData.classOrYear.trim()) {
      errors.classOrYear = 'Please specify your class or preparation stage';
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = 'Please enter your city and state';
    }

    if (!formData.topic.trim() || formData.topic.trim().length < 5) {
      errors.topic = 'Please describe the topics or questions you want to discuss (min 5 characters)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      mentorId,
      date: selectedDate,
      timeSlot: selectedSlot,
      student: {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim().replace(/\D/g, ''),
        exam: formData.exam.trim(),
        classOrYear: formData.classOrYear.trim(),
        institute: formData.institute.trim(),
        city: formData.city.trim(),
        topic: formData.topic.trim()
      }
    };

    try {
      const res = await api.createBooking(payload);
      if (res?.data?.bookingCode) {
        navigate(`/booking/${res.data.bookingCode}`, {
          state: {
            booking: {
              bookingCode: res.data.bookingCode,
              amount: res.data.amount,
              date: res.data.date,
              timeSlot: res.data.timeSlot,
              mentor: res.data.mentor,
              student: res.data.student
            }
          }
        });
      }
    } catch (err) {
      if (err.status === 409) {
        setSubmitError('Slot just got booked by someone else! Please pick another slot.');
        // Refresh available slots for this date immediately
        api.getMentorSlots(mentorId, selectedDate).then(res => {
          setSlots(res?.data?.slots || []);
        });
        setSelectedSlot('');
      } else {
        setSubmitError(err.message || 'Failed to submit booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMentor) {
    return (
      <div className="container book-page">
        <div className="alert alert-info">Loading mentor details...</div>
      </div>
    );
  }

  if (mentorError || !mentor) {
    return (
      <div className="container book-page">
        <div className="alert alert-error">{mentorError || 'Mentor not found'}</div>
        <Link to="/mentors" className="btn btn-secondary">
          Back to Mentors List
        </Link>
      </div>
    );
  }

  return (
    <div className="container book-page">
      <div className="page-header">
        <h1>Book 1-on-1 Session</h1>
        <p>
          Reserve a personal mentoring session with <strong>{mentor.name}</strong> ({mentor.iit}).
          No student account or login required.
        </p>
      </div>

      <div className="book-grid">
        {/* Sidebar: Mentor Summary */}
        <aside className="card mentor-summary-card">
          <div className="summary-header">
            <div className="summary-name">{mentor.name}</div>
            <div className="summary-college">{mentor.iit}</div>
            <div className="summary-branch">{mentor.branch} &bull; {mentor.year}</div>
          </div>

          <div className="summary-item">
            <span>Session Length</span>
            <span>{mentor.sessionDurationMins || 45} minutes</span>
          </div>
          <div className="summary-item">
            <span>Platform</span>
            <span>Google Meet</span>
          </div>
          <div className="summary-item">
            <span>Exams Guided</span>
            <span>{mentor.exams?.join(', ')}</span>
          </div>
          <div className="summary-item">
            <span>Languages</span>
            <span>{mentor.languages?.join(', ')}</span>
          </div>

          <div className="summary-total">
            <span className="summary-total-label">Session Fee:</span>
            <span className="summary-total-amount">₹{mentor.pricePerSession}</span>
          </div>
        </aside>

        {/* Main Booking Form */}
        <main className="booking-main">
          {submitError && (
            <div className="alert alert-error" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Step 1: Date */}
            <section className="card booking-section">
              <h2 className="booking-section-title">
                <span className="step-indicator">1</span>
                Select Date (Next 14 Days)
              </h2>
              <div className="dates-grid">
                {availableDates.map(d => (
                  <button
                    key={d.dateStr}
                    type="button"
                    className={`date-pill ${selectedDate === d.dateStr ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(d.dateStr)}
                  >
                    <span className="date-pill-day">{d.dayName}</span>
                    <span className="date-pill-num">{d.dayNum}</span>
                    <span className="date-pill-month">{d.monthName}</span>
                  </button>
                ))}
              </div>
              {formErrors.date && <p className="form-error">{formErrors.date}</p>}

              {/* Step 2: Time Slot */}
              <h2 className="booking-section-title" style={{ marginTop: '1.5rem' }}>
                <span className="step-indicator">2</span>
                Choose Time Slot (IST)
              </h2>

              {loadingSlots ? (
                <p className="form-hint">Checking available slots for {selectedDate}...</p>
              ) : slots.length === 0 ? (
                <div className="slots-empty-notice">
                  No slots scheduled for this day of the week. Please select another date.
                </div>
              ) : (
                <div className="slots-grid">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      className={`slot-btn ${selectedSlot === s.time ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(s.time)}
                      title={s.available ? 'Click to select slot' : 'This slot is already booked'}
                    >
                      {s.time}
                      {!s.available && <span style={{ display: 'block', fontSize: '0.7rem' }}>Booked</span>}
                    </button>
                  ))}
                </div>
              )}
              {formErrors.slot && <p className="form-error">{formErrors.slot}</p>}
            </section>

            {/* Step 3: Student Details */}
            <section className="card booking-section">
              <h2 className="booking-section-title">
                <span className="step-indicator">3</span>
                Your Details
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="student-name"
                    name="name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Rohan Verma"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && <p className="form-error">{formErrors.name}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="student-email"
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="e.g. rohan@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formErrors.email && <p className="form-error">{formErrors.email}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-phone">
                    Mobile Number (10-Digit) <span className="required">*</span>
                  </label>
                  <input
                    id="student-phone"
                    name="phone"
                    type="tel"
                    maxLength="10"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <p className="form-hint">Used to track your booking status.</p>
                  {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-exam">
                    Target Exam <span className="required">*</span>
                  </label>
                  <select
                    id="student-exam"
                    name="exam"
                    className="form-control"
                    value={formData.exam}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Target Exam</option>
                    <option value="JEE Advanced">JEE Advanced</option>
                    <option value="JEE Mains">JEE Mains</option>
                    <option value="Other">Other Engineering Entrance</option>
                  </select>
                  {formErrors.exam && <p className="form-error">{formErrors.exam}</p>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-class">
                    Current Class / Year <span className="required">*</span>
                  </label>
                  <select
                    id="student-class"
                    name="classOrYear"
                    className="form-control"
                    value={formData.classOrYear}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Class or Year</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Dropper / Repeat Year">Dropper / Repeat Year</option>
                    <option value="1st Year College">1st Year College</option>
                    <option value="2nd Year College">2nd Year College</option>
                    <option value="3rd/4th Year College">3rd/4th Year College</option>
                  </select>
                  {formErrors.classOrYear && <p className="form-error">{formErrors.classOrYear}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-city">
                    City, State <span className="required">*</span>
                  </label>
                  <input
                    id="student-city"
                    name="city"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kota, Rajasthan"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  {formErrors.city && <p className="form-error">{formErrors.city}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-institute">
                  Coaching Institute Name <span className="form-hint">(Optional)</span>
                </label>
                <input
                  id="student-institute"
                  name="institute"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Allen Kota, FIITJEE, Resonance, Unacademy, Self-study..."
                  value={formData.institute}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-topic">
                  Topics or Doubts You Want to Discuss <span className="required">*</span>
                </label>
                <textarea
                  id="student-topic"
                  name="topic"
                  className="form-control"
                  rows="3"
                  placeholder="Please be specific: e.g. How to master Rotational Dynamics in Physics, dealing with negative marking in JEE Advanced mock tests, or revision schedule for Inorganic Chemistry."
                  value={formData.topic}
                  onChange={handleInputChange}
                ></textarea>
                <p className="form-hint">
                  Helps the mentor prepare specific guidance for your 45-minute session.
                </p>
                {formErrors.topic && <p className="form-error">{formErrors.topic}</p>}
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="btn btn-primary btn-block"
                  style={{ minHeight: '48px', fontSize: '1rem' }}
                >
                  {submitting
                    ? 'Reserving Slot...'
                    : `Confirm & Reserve Slot (${selectedDate} at ${selectedSlot || '--:--'})`}
                </button>
                <p className="form-hint" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  Slot reservation status is set to pending payment until verified.
                </p>
              </div>
            </section>
          </form>
        </main>
      </div>
    </div>
  );
}
