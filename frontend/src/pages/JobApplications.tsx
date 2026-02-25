import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationsApi, jobsApi, type Job } from '../services/api';

interface ApplicantItem {
  id: number;
  applicant_name: string;
  applicant_email: string;
  status: string;
  status_display: string;
  applied_at: string;
  resume?: string;
}

function JobApplications() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [jobResponse, appsResponse] = await Promise.all([
        jobsApi.detail(parseInt(id!)),
        applicationsApi.jobApplications(parseInt(id!)),
      ]);
      setJob(jobResponse.data.job);
      setApplications(appsResponse.data.applications);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (appId: number, status: string) => {
    try {
      await applicationsApi.updateStatus(appId, status);
      setApplications(applications.map(app => 
        app.id === appId 
          ? { ...app, status: status, status_display: getStatusDisplay(status) }
          : app
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return 'Pending Review';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  if (isLoading) {
    return <div className="loading">Loading applications...</div>;
  }

  if (error || !job) {
    return (
      <div className="card">
        <h2>Error</h2>
        <p style={{ color: '#666' }}>{error || 'Job not found'}</p>
        <Link to="/my-jobs" className="btn btn-primary mt-20">Back to My Jobs</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-20">
        <Link to={`/jobs/${id}`} style={{ color: '#666' }}>← Back to Job</Link>
      </div>
      
      <div className="flex-between mb-20">
        <div>
          <h1>Applications for {job.title}</h1>
          <p style={{ color: '#666' }}>{applications.length} applicant(s)</p>
        </div>
        <Link to="/my-jobs" className="btn btn-secondary">
          All My Jobs
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No applications received yet for this position.
          </p>
        </div>
      ) : (
        applications.map(app => (
          <div key={app.id} className="job-card">
            <div className="flex-between">
              <div>
                <h3>{app.applicant_name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{app.applicant_email}</p>
              </div>
              <span className={`status-badge ${getStatusClass(app.status)}`}>
                {app.status_display}
              </span>
            </div>
            
            <div className="job-meta">
              <span>📅 Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
              {app.resume && (
                <span>
                  <a 
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(app.resume)}&embedded=true`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    📄 View Resume
                  </a>
                  {' '}
                  <a 
                    href={app.resume} 
                    download
                    style={{ marginLeft: '8px' }}
                  >
                    ⬇️ Download
                  </a>
                </span>
              )}
            </div>

            {app.status === 'pending' && (
              <div className="job-actions">
                <button 
                  onClick={() => handleStatusUpdate(app.id, 'accepted')}
                  className="btn btn-success"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleStatusUpdate(app.id, 'rejected')}
                  className="btn btn-danger"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default JobApplications;
