import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsApi, type Job } from '../services/api';

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadJob(); }, [id]);

  const loadJob = async () => {
    try {
      const response = await jobsApi.detail(parseInt(id!));
      setJob(response.data.job);
      setHasApplied(response.data.has_applied);
    } catch {
      setError('Job not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await jobsApi.delete(parseInt(id!));
      navigate('/my-jobs');
    } catch {
      setError('Failed to delete job');
    }
  };

  if (isLoading) return <div className="loading">Loading job details...</div>;

  if (error || !job) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>😕</p>
        <h2>Job Not Found</h2>
        <p style={{ marginTop: '8px' }}>This job posting is no longer available.</p>
        <Link to="/jobs" className="btn btn-primary mt-20">Browse Other Jobs</Link>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === job.posted_by?.id;
  const companyName = job.posted_by?.organization_name || job.posted_by?.username || 'Company';
  const initial = companyName[0].toUpperCase();

  return (
    <div>
      {/* Hero Header */}
      <div className="job-detail-hero">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="company-avatar" style={{ width: '60px', height: '60px', fontSize: '1.4rem', borderRadius: '14px' }}>
              {initial}
            </div>
            <div>
              <h1>{job.title}</h1>
              <div className="job-detail-company">{companyName}</div>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-8">
              <Link to={`/jobs/${job.id}/edit`} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', background: 'rgba(255,255,255,0.15)' }}>
                ✏️ Edit
              </Link>
              <button onClick={handleDelete} className="btn btn-danger btn-sm">🗑️ Delete</button>
            </div>
          )}
        </div>

        <div className="job-detail-meta" style={{ marginTop: '20px' }}>
          <span>📍 {job.location}</span>
          <span>💰 {job.salary_range}</span>
          <span>⏰ {job.job_type_display}</span>
          <span>📅 {new Date(job.posted_at).toLocaleDateString()}</span>
          {job.applications_count !== undefined && (
            <span>👥 {job.applications_count} applicants</span>
          )}
        </div>
      </div>

      {/* Content Layout */}
      <div className="job-detail-layout">
        {/* Description */}
        <div className="job-detail-content">
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Job Description</h2>
            <div className="job-description">{job.description}</div>
          </div>
        </div>

        {/* Apply Sidebar */}
        <aside className="job-apply-card">
          <h3>Ready to Apply?</h3>
          <p style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
            Join {job.applications_count || 0} other candidates who have applied.
          </p>

          {isAuthenticated ? (
            user?.user_type === 'job_seeker' ? (
              hasApplied ? (
                <span className="status-badge status-pending" style={{ display: 'block', textAlign: 'center', padding: '14px' }}>
                  ✓ Application Submitted
                </span>
              ) : (
                <Link to={`/jobs/${job.id}/apply`} className="btn btn-primary btn-full btn-lg">
                  Apply Now →
                </Link>
              )
            ) : isOwner ? (
              <Link to={`/jobs/${job.id}/applications`} className="btn btn-primary btn-full">
                View Applications ({job.applications_count})
              </Link>
            ) : null
          ) : (
            <Link to="/login" className="btn btn-primary btn-full btn-lg">Sign In to Apply</Link>
          )}

          <Link to="/jobs" className="btn btn-ghost btn-full btn-sm" style={{ marginTop: '10px' }}>
            ← Back to Jobs
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default JobDetail;
