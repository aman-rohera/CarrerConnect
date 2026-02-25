import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsApi, applicationsApi, type Job } from '../services/api';

interface ApplicationListItem {
  id: number;
  job_title: string;
  status: string;
  status_display: string;
  applied_at: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, applications: 0, pending: 0 });
  const [recentItems, setRecentItems] = useState<Job[] | ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, [user]);

  const loadDashboard = async () => {
    try {
      if (user?.user_type === 'employer') {
        const response = await jobsApi.myJobs();
        const jobs = response.data.jobs as Job[];
        setStats({
          jobs: jobs.length,
          applications: jobs.reduce((sum: number, job: Job) => sum + (job.applications_count || 0), 0),
          pending: 0,
        });
        setRecentItems(jobs.slice(0, 5));
      } else {
        const response = await applicationsApi.myApplications();
        const applications = response.data.applications as ApplicationListItem[];
        setStats({
          jobs: 0,
          applications: applications.length,
          pending: applications.filter((a: ApplicationListItem) => a.status === 'pending').length,
        });
        setRecentItems(applications.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '☀️ Good morning';
    if (h < 17) return '⛅ Good afternoon';
    return '🌙 Good evening';
  };

  if (isLoading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <h1>
          {getGreeting()}, <span style={{ color: 'var(--primary)' }}>{user?.username}</span>!
        </h1>
        <p className="dashboard-greeting">
          {user?.user_type === 'employer'
            ? 'Manage your job postings and review incoming candidates.'
            : 'Track your job applications and discover new opportunities.'}
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {user?.user_type === 'employer' ? (
          <>
            <Link to="/my-jobs" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <div className="stat-card-icon">📋</div>
                <h3>{stats.jobs}</h3>
                <p>Active Job Posts</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>Click to manage →</div>
              </div>
            </Link>
            <Link to="/my-jobs" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <div className="stat-card-icon">👥</div>
                <h3>{stats.applications}</h3>
                <p>Total Applications</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>Click to review →</div>
              </div>
            </Link>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-icon">📨</div>
              <h3>{stats.applications}</h3>
              <p>Applications Sent</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">⏳</div>
              <h3>{stats.pending}</h3>
              <p>Pending Review</p>
            </div>
          </>
        )}
      </div>

      {/* Recent Items */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {user?.user_type === 'employer' ? '📌 Recent Job Posts' : '📝 Recent Applications'}
          </h2>
          <Link
            to={user?.user_type === 'employer' ? '/my-jobs' : '/my-applications'}
            className="btn btn-secondary btn-sm"
          >
            View All
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ marginBottom: '16px' }}>
              {user?.user_type === 'employer'
                ? "You haven't posted any jobs yet."
                : "You haven't applied to any jobs yet."}
            </p>
            <Link
              to={user?.user_type === 'employer' ? '/jobs/create' : '/jobs'}
              className="btn btn-primary"
            >
              {user?.user_type === 'employer' ? 'Post Your First Job' : 'Browse Jobs'}
            </Link>
          </div>
        ) : (
          <div>
            {user?.user_type === 'employer' ? (
              (recentItems as Job[]).map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div className="company-avatar">{job.title?.[0]?.toUpperCase()}</div>
                    <div>
                      <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
                      <div className="company-name">{job.location}</div>
                    </div>
                  </div>
                  <div className="job-meta">
                    <span>💰 {job.salary_range}</span>
                    <span>📋 {job.applications_count} applicants</span>
                  </div>
                  <div className="job-actions">
                    <Link to={`/jobs/${job.id}/applications`} className="btn btn-primary btn-sm">View Applications</Link>
                    <Link to={`/jobs/${job.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  </div>
                </div>
              ))
            ) : (
              (recentItems as ApplicationListItem[]).map((app) => (
                <div key={app.id} className="job-card">
                  <div className="job-card-header">
                    <div className="company-avatar">{app.job_title?.[0]?.toUpperCase()}</div>
                    <div>
                      <h3>{app.job_title}</h3>
                      <div className="company-name">📅 Applied {new Date(app.applied_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="job-meta">
                    <span className={`status-badge status-${app.status}`}>{app.status_display}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {user?.user_type === 'employer' ? (
          <Link to="/jobs/create" className="btn btn-primary">+ Post a New Job</Link>
        ) : (
          <Link to="/jobs" className="btn btn-primary">🔍 Browse Jobs</Link>
        )}
        <Link to="/profile/edit" className="btn btn-secondary">✏️ Edit Profile</Link>
      </div>
    </div>
  );
}

export default Dashboard;
