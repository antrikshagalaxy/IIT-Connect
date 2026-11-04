import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import './Mentors.css';

const EXAM_FILTERS = [
  { id: '', label: 'All Exams' },
  { id: 'JEE', label: 'JEE (Main & Adv)' },
  { id: 'NEET', label: 'NEET' },
  { id: 'GATE', label: 'GATE' }
];

export default function Mentors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentExam = searchParams.get('exam') || '';

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getMentors(currentExam)
      .then(res => {
        if (res?.data) {
          setMentors(res.data);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load mentors');
      })
      .finally(() => setLoading(false));
  }, [currentExam]);

  const handleFilterClick = (examId) => {
    if (examId) {
      setSearchParams({ exam: examId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="container mentors-page">
      <div className="page-header">
        <h1>Our Mentors</h1>
        <p>
          Our verified team of mentors currently studying at top Indian Institutes of Technology.
          Select any mentor to view their upcoming availability and reserve a session.
        </p>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Filter by Exam:</span>
        {EXAM_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-btn ${currentExam === f.id ? 'active' : ''}`}
            onClick={() => handleFilterClick(f.id)}
          >
            {f.label}
          </button>
        ))}
        {!loading && (
          <span className="mentors-count">
            Showing {mentors.length} {mentors.length === 1 ? 'mentor' : 'mentors'}
          </span>
        )}
      </div>

      {loading && <div className="alert alert-info">Loading mentor team...</div>}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && mentors.length === 0 && (
        <div className="alert alert-info">
          No mentors found matching &quot;{currentExam}&quot;. Try selecting &quot;All Exams&quot;.
        </div>
      )}

      {!loading && !error && (
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
                  <span className="mentor-price-unit">{mentor.sessionDurationMins || 45} mins session</span>
                </div>
                <Link to={`/book/${mentor._id}`} className="btn btn-primary">
                  Book Session
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
