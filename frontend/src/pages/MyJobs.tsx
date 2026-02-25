import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, type Job } from '../services/api';

function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyWithApplicants, setShowOnlyWithApplicants] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      const response = await jobsApi.myJobs();
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await jobsApi.delete(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  if (isLoading) return <div className="loading">Loading your jobs...</div>;

  const totalApplications = jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0);
  const jobsWithApplicants = jobs.filter(j => (j.applications_count || 0) > 0);
  const displayedJobs = showOnlyWithApplicants ? jobsWithApplicants : jobs;

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>My Job Posts</h1>
          <p style={{ marginTop: '6px' }}>
            {jobs.length} posting{jobs.length !== 1 ? 's' : ''} · {totalApplications} total application{totalApplications !== 1 ? 's' : ''} received
          </p>
        </div>
        <Link to="/jobs/create" className="btn btn-primary">+ Post New Job</Link>
      </div>

      {/* Summary strip */}
      {jobs.length > 0 && (
        <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
          <div 
            className="stat-card" 
            onClick={() => setShowOnlyWithApplicants(false)}
            style={{ 
              cursor: 'pointer',
              borderColor: !showOnlyWithApplicants ? 'var(--primary)' : undefined,
              background: !showOnlyWithApplicants ? 'var(--primary-light)' : undefined,
            }}
          >
            <div className="stat-card-icon">📋</div>
            <h3>{jobs.length}</h3>
            <p>All Job Posts</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">👥</div>
            <h3>{totalApplications}</h3>
            <p>Applications</p>
          </div>
          <div 
            className="stat-card"
            onClick={() => setShowOnlyWithApplicants(true)}
            style={{ 
              cursor: 'pointer',
              borderColor: showOnlyWithApplicants ? 'var(--primary)' : undefined,
              background: showOnlyWithApplicants ? 'var(--primary-light)' : undefined,
            }}
          >
            <div className="stat-card-icon">🔥</div>
            <h3>{jobsWithApplicants.length}</h3>
            <p>With Applicants</p>
          </div>
        </div>
      )}

      {/* Filter indicator */}
      {showOnlyWithApplicants && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px 16px', 
          background: 'var(--primary-light)', 
          borderRadius: 'var(--border-radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
            🔍 Showing only jobs with applicants ({jobsWithApplicants.length})
          </span>
          <button 
            onClick={() => setShowOnlyWithApplicants(false)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 12px' }}
          >
            Show All
          </button>
        </div>
      )}

      {displayedJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px' }}>
          <p style={{ fontSize: '3rem', marginBottom: '12px' }}>{showOnlyWithApplicants ? '📭' : '📭'}</p>
          <h2>{showOnlyWithApplicants ? 'No Jobs With Applicants' : 'No Job Posts Yet'}</h2>
          <p style={{ marginTop: '10px', marginBottom: '24px' }}>
            {showOnlyWithApplicants 
              ? 'None of your job posts have received applications yet.' 
              : 'Start hiring by creating your first job posting.'}
          </p>
          {showOnlyWithApplicants ? (
            <button onClick={() => setShowOnlyWithApplicants(false)} className="btn btn-primary btn-lg">
              View All Jobs
            </button>
          ) : (
            <Link to="/jobs/create" className="btn btn-primary btn-lg">Post Your First Job</Link>
          )}
        </div>
      ) : (
        displayedJobs.map(job => (
          <div key={job.id} className="job-card">
            <div className="job-card-header">
              <div className="company-avatar">{job.title?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
                <div className="company-name">📅 Posted {new Date(job.posted_at).toLocaleDateString()}</div>
              </div>
              {/* Application count badge */}
              <Link
                to={`/jobs/${job.id}/applications`}
                className="stat-card"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: '110px', padding: '14px 20px', cursor: 'pointer',
                  textDecoration: 'none', marginBottom: 0,
                  background: (job.applications_count || 0) > 0 ? 'var(--primary-light)' : undefined,
                  borderColor: (job.applications_count || 0) > 0 ? 'var(--primary)' : undefined,
                }}
              >
                <h3 style={{ fontSize: '2rem', WebkitTextFillColor: undefined, color: (job.applications_count || 0) > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {job.applications_count || 0}
                </h3>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {(job.applications_count || 0) === 1 ? 'Applicant' : 'Applicants'}
                </p>
              </Link>
            </div>

            <div className="job-meta">
              <span>📍 {job.location}</span>
              <span>💰 {job.salary_range}</span>
              <span>⏰ {job.job_type_display}</span>
            </div>

            <div className="job-actions">
              <Link
                to={`/jobs/${job.id}/applications`}
                className={`btn ${(job.applications_count || 0) > 0 ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              >
                👥 View Applications ({job.applications_count || 0})
              </Link>
              <Link to={`/jobs/${job.id}/edit`} className="btn btn-secondary btn-sm">✏️ Edit</Link>
              <Link to={`/jobs/${job.id}`} className="btn btn-ghost btn-sm">👁 Preview</Link>
              <button onClick={() => handleDelete(job.id)} className="btn btn-danger btn-sm">🗑️ Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyJobs;
