import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard({ onLogout }) {
  // Tabs: 'bookings' | 'mentors'
  const [activeTab, setActiveTab] = useState('bookings');

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingFilters, setBookingFilters] = useState({
    status: '',
    date: '',
    mentorId: ''
  });

  // Mentors state
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [mentorForm, setMentorForm] = useState({
    name: '',
    iit: '',
    branch: '',
    year: '',
    exams: '',
    subjects: '',
    languages: '',
    bio: '',
    pricePerSession: 599,
    sessionDurationMins: 45,
    isActive: true
  });

  // Meeting Link Prompt Modal
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [selectedBookingForMeeting, setSelectedBookingForMeeting] = useState(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');

  const [actionMessage, setActionMessage] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await api.getAdminBookings(bookingFilters);
      setBookings(res?.data || []);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
      }
    } finally {
      setLoadingBookings(false);
    }
  }, [bookingFilters, onLogout]);

  const fetchMentors = useCallback(async () => {
    setLoadingMentors(true);
    try {
      const res = await api.getAdminMentors();
      setMentors(res?.data || []);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
      }
    } finally {
      setLoadingMentors(false);
    }
  }, [onLogout]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else {
      fetchMentors();
    }
  }, [activeTab, fetchBookings, fetchMentors]);

  // Load mentors for the booking filter dropdown
  useEffect(() => {
    api.getAdminMentors().then(res => setMentors(res?.data || [])).catch(() => {});
  }, []);

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Booking actions
  const handleUpdateBookingStatus = async (id, statusUpdates) => {
    try {
      await api.updateAdminBooking(id, statusUpdates);
      showNotification('Booking updated successfully');
      fetchBookings();
    } catch (err) {
      alert('Error updating booking: ' + err.message);
    }
  };

  const openMeetingModal = (booking) => {
    setSelectedBookingForMeeting(booking);
    setMeetingLinkInput(booking.meetingLink || '');
    setMeetingModalOpen(true);
  };

  const handleSaveMeetingLink = async (e) => {
    e.preventDefault();
    if (!selectedBookingForMeeting) return;
    try {
      await api.updateAdminBooking(selectedBookingForMeeting._id, {
        meetingLink: meetingLinkInput.trim(),
        status: 'confirmed'
      });
      setMeetingModalOpen(false);
      showNotification('Meeting link saved and booking marked as confirmed');
      fetchBookings();
    } catch (err) {
      alert('Error saving meeting link: ' + err.message);
    }
  };

  // Mentor actions
  const openAddMentorModal = () => {
    setEditingMentor(null);
    setMentorForm({
      name: '',
      iit: '',
      branch: '',
      year: '',
      exams: '',
      subjects: '',
      languages: '',
      bio: '',
      pricePerSession: 599,
      sessionDurationMins: 45,
      isActive: true
    });
    setMentorModalOpen(true);
  };

  const openEditMentorModal = (mentor) => {
    setEditingMentor(mentor);
    setMentorForm({
      name: mentor.name || '',
      iit: mentor.iit || '',
      branch: mentor.branch || '',
      year: mentor.year || '',
      exams: mentor.exams?.join(', ') || '',
      subjects: mentor.subjects?.join(', ') || '',
      languages: mentor.languages?.join(', ') || '',
      bio: mentor.bio || '',
      pricePerSession: mentor.pricePerSession || 599,
      sessionDurationMins: mentor.sessionDurationMins || 45,
      isActive: mentor.isActive !== false
    });
    setMentorModalOpen(true);
  };

  const handleSaveMentor = async (e) => {
    e.preventDefault();
    const payload = {
      ...mentorForm,
      pricePerSession: Number(mentorForm.pricePerSession),
      sessionDurationMins: Number(mentorForm.sessionDurationMins),
      exams: mentorForm.exams.split(',').map(s => s.trim()).filter(Boolean),
      subjects: mentorForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
      languages: mentorForm.languages.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingMentor) {
        await api.updateAdminMentor(editingMentor._id, payload);
        showNotification('Mentor updated successfully');
      } else {
        payload.availability = [
          { day: 1, slots: ["10:00", "11:00", "16:00", "17:00"] },
          { day: 3, slots: ["10:00", "11:00", "16:00", "17:00"] },
          { day: 6, slots: ["10:00", "11:00", "14:00", "15:00"] }
        ];
        await api.createAdminMentor(payload);
        showNotification('New mentor added');
      }
      setMentorModalOpen(false);
      fetchMentors();
    } catch (err) {
      alert('Error saving mentor: ' + err.message);
    }
  };

  const handleToggleMentorActive = async (mentor) => {
    try {
      await api.updateAdminMentor(mentor._id, { isActive: !mentor.isActive });
      showNotification(`Mentor ${mentor.isActive ? 'deactivated' : 'activated'}`);
      fetchMentors();
    } catch (err) {
      alert('Error toggling mentor status: ' + err.message);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Management Dashboard</h1>
          <p style={{ fontSize: '0.9rem' }}>Real-time session reservations and mentor roster.</p>
        </div>
      </div>

      {actionMessage && <div className="alert alert-success">{actionMessage}</div>}

      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Session Bookings ({bookings.length})
        </button>
        <button
          type="button"
          className={`dashboard-tab ${activeTab === 'mentors' ? 'active' : ''}`}
          onClick={() => setActiveTab('mentors')}
        >
          Mentors Team ({mentors.length})
        </button>
      </div>

      {/* Bookings View */}
      {activeTab === 'bookings' && (
        <div>
          <div className="dashboard-filters">
            <select
              value={bookingFilters.status}
              onChange={(e) => setBookingFilters({ ...bookingFilters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={bookingFilters.mentorId}
              onChange={(e) => setBookingFilters({ ...bookingFilters, mentorId: e.target.value })}
            >
              <option value="">All Mentors</option>
              {mentors.map(m => (
                <option key={m._id} value={m._id}>{m.name} ({m.iit})</option>
              ))}
            </select>

            <input
              type="date"
              value={bookingFilters.date}
              onChange={(e) => setBookingFilters({ ...bookingFilters, date: e.target.value })}
            />

            {(bookingFilters.status || bookingFilters.mentorId || bookingFilters.date) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setBookingFilters({ status: '', date: '', mentorId: '' })}
              >
                Clear Filters
              </button>
            )}
          </div>

          {loadingBookings ? (
            <div className="alert alert-info">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="alert alert-info">No bookings found matching current filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Mentor</th>
                    <th>Date & Slot</th>
                    <th>Student Details</th>
                    <th>Amount & Status</th>
                    <th>Meeting Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <strong style={{ fontFamily: 'monospace' }}>{b.bookingCode}</strong>
                      </td>
                      <td>
                        <div><strong>{b.mentorId?.name || 'N/A'}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {b.mentorId?.iit}
                        </div>
                      </td>
                      <td>
                        <div>{b.date}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {b.timeSlot} IST
                        </div>
                      </td>
                      <td>
                        <div><strong>{b.student?.name}</strong></div>
                        <div style={{ fontSize: '0.8rem' }}>{b.student?.phone}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {b.student?.email} &bull; {b.student?.exam}
                        </div>
                      </td>
                      <td>
                        <div>₹{b.amount} ({b.paymentStatus})</div>
                        <span className={`badge badge-status ${b.status}`} style={{ marginTop: '0.25rem' }}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {b.meetingLink ? (
                          <a
                            href={b.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.8rem' }}
                          >
                            Open Link &rarr;
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {b.paymentStatus === 'unpaid' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateBookingStatus(b._id, { paymentStatus: 'paid' })}
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openMeetingModal(b)}
                          >
                            Set Meet Link
                          </button>
                          {b.status === 'pending_payment' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateBookingStatus(b._id, { status: 'confirmed' })}
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateBookingStatus(b._id, { status: 'completed' })}
                            >
                              Complete
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (window.confirm(`Cancel booking ${b.bookingCode}?`)) {
                                  handleUpdateBookingStatus(b._id, { status: 'cancelled' });
                                }
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mentors View */}
      {activeTab === 'mentors' && (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openAddMentorModal}
            >
              + Add New Mentor
            </button>
          </div>

          {loadingMentors ? (
            <div className="alert alert-info">Loading mentors...</div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mentor Name</th>
                    <th>IIT & Branch</th>
                    <th>Year</th>
                    <th>Exams Guided</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((m) => (
                    <tr key={m._id} style={{ opacity: m.isActive === false ? 0.6 : 1 }}>
                      <td>
                        <strong>{m.name}</strong>
                      </td>
                      <td>
                        <div>{m.iit}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.branch}
                        </div>
                      </td>
                      <td>{m.year}</td>
                      <td>{m.exams?.join(', ')}</td>
                      <td>₹{m.pricePerSession}</td>
                      <td>
                        <span className={`badge ${m.isActive !== false ? 'badge-accent' : ''}`}>
                          {m.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditMentorModal(m)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleToggleMentorActive(m)}
                          >
                            {m.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Meeting Link Modal */}
      {meetingModalOpen && selectedBookingForMeeting && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Meeting Link — {selectedBookingForMeeting.bookingCode}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMeetingModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveMeetingLink}>
              <div className="form-group">
                <label className="form-label">Google Meet / Zoom URL:</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="form-control"
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                />
                <p className="form-hint">
                  Saving will update booking status to Confirmed and display the link to the student on their tracking screen.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMeetingModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentor Add/Edit Modal */}
      {mentorModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingMentor ? 'Edit Mentor' : 'Add New Mentor'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMentorModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMentor}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={mentorForm.name}
                  onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">IIT</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={mentorForm.iit}
                    onChange={(e) => setMentorForm({ ...mentorForm, iit: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={mentorForm.branch}
                    onChange={(e) => setMentorForm({ ...mentorForm, branch: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={mentorForm.year}
                    onChange={(e) => setMentorForm({ ...mentorForm, year: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price per Session (₹)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    className="form-control"
                    value={mentorForm.pricePerSession}
                    onChange={(e) => setMentorForm({ ...mentorForm, pricePerSession: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exams Guided (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="JEE Advanced, JEE Mains"
                  value={mentorForm.exams}
                  onChange={(e) => setMentorForm({ ...mentorForm, exams: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subjects (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Physics, Mathematics"
                  value={mentorForm.subjects}
                  onChange={(e) => setMentorForm({ ...mentorForm, subjects: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Languages (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="English, Hindi"
                  value={mentorForm.languages}
                  onChange={(e) => setMentorForm({ ...mentorForm, languages: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Bio</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMentorModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMentor ? 'Save Changes' : 'Create Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
