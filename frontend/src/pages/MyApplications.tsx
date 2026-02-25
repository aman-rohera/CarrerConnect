import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../services/api';

interface ApplicationListItem {
  id: number;
  job_title: string;
  job_location: string;
  organization_name: string;
  status: string;
  status_display: string;
  applied_at: string;
}

function MyApplications() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await applicationsApi.myApplications();
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (appId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
      await applicationsApi.withdraw(appId);
      setApplications(applications.filter(a => a.id !== appId));
    } catch (error) {
      console.error('Failed to withdraw application:', error);
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
    return <div className="loading">Loading your applications...</div>;
  }

  return (
    <div>
      <div className="flex-between mb-20">
        <h1>My Applications</h1>
        <Link to="/jobs" className="btn btn-primary">
          Find More Jobs
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            You haven't applied to any jobs yet.
          </p>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/jobs" className="btn btn-primary">
              Browse Jobs
            </Link>
          </div>
        </div>
      ) : (
        applications.map(app => (
          <div key={app.id} className="job-card">
            <div className="flex-between">
              <h3>{app.job_title}</h3>
              <span className={`status-badge ${getStatusClass(app.status)}`}>
                {app.status_display}
              </span>
            </div>
            <div className="job-meta">
              <span>🏢 {app.organization_name}</span>
              <span>📍 {app.job_location}</span>
              <span>📅 Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
            </div>
            {app.status === 'pending' && (
              <div className="job-actions">
                <button 
                  onClick={() => handleWithdraw(app.id)} 
                  className="btn btn-danger"
                >
                  Withdraw
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyApplications;
