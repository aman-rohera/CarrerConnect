import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';

interface DashboardStats {
  users: {
    total: number;
    job_seekers: number;
    employers: number;
    admins: number;
    new_this_month: number;
  };
  jobs: {
    total: number;
    active: number;
    expired: number;
  };
  applications: {
    total: number;
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  };
  recent: {
    users: Array<{
      id: number;
      username: string;
      email: string;
      user_type: string;
      date_joined: string;
    }>;
    jobs: Array<{
      id: number;
      title: string;
      company_name: string;
      created_at: string;
    }>;
    applications: Array<{
      id: number;
      applicant__username: string;
      job__title: string;
      status: string;
      applied_at: string;
    }>;
  };
}

interface UserData {
  id: number;
  username: string;
  email: string;
  user_type: string;
  phone: string;
  location: string;
  organization_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

interface JobData {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_min: number;
  salary_max: number;
  application_deadline: string;
  created_at: string;
  employer_id: number;
  employer_name: string;
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check admin access
  useEffect(() => {
    if (user && user.user_type !== 'admin' && !user.email?.includes('admin')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getUsers({
          user_type: userTypeFilter || undefined,
          search: searchQuery || undefined,
        });
        setUsers(response.data.users);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userTypeFilter, searchQuery]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getJobs({
          search: searchQuery || undefined,
        });
        setJobs(response.data.jobs);
      } catch (err) {
        setError('Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab, searchQuery]);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await adminApi.updateUser(userId, { is_active: !currentStatus });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApi.deleteJob(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
      setSuccess('Job deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      job_seeker: 'Job Seeker',
      employer: 'Employer',
      admin: 'Administrator',
    };
    return labels[type] || type;
  };

  if (isLoading && activeTab === 'overview') {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Admin Dashboard</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {error && <div className="message message-error mb-20">{error}</div>}
      {success && <div className="message message-success mb-20">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-10 mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Stats Cards */}
          <div className="grid gap-20" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {/* Users Stats */}
            <div className="card">
              <h3 style={{ color: 'var(--accent-blue)', marginBottom: '16px' }}>Users</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Total</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.users.total}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>New This Month</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)' }}>+{stats.users.new_this_month}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Job Seekers</p>
                  <p style={{ fontSize: '18px' }}>{stats.users.job_seekers}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Employers</p>
                  <p style={{ fontSize: '18px' }}>{stats.users.employers}</p>
                </div>
              </div>
            </div>

            {/* Jobs Stats */}
            <div className="card">
              <h3 style={{ color: 'var(--accent-blue)', marginBottom: '16px' }}>Jobs</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Total</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.jobs.total}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Active</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{stats.jobs.active}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: '#666', fontSize: '14px' }}>Expired</p>
                  <p style={{ fontSize: '18px', color: 'var(--accent-red)' }}>{stats.jobs.expired}</p>
                </div>
              </div>
            </div>

            {/* Applications Stats */}
            <div className="card">
              <h3 style={{ color: 'var(--accent-blue)', marginBottom: '16px' }}>Applications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Total</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.applications.total}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Pending</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{stats.applications.pending}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Accepted</p>
                  <p style={{ fontSize: '18px', color: 'var(--accent-green)' }}>{stats.applications.accepted}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Rejected</p>
                  <p style={{ fontSize: '18px', color: 'var(--accent-red)' }}>{stats.applications.rejected}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-20 mt-20" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {/* Recent Users */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Recent Users</h3>
              {stats.recent.users.length === 0 ? (
                <p style={{ color: '#666' }}>No recent users</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.recent.users.map(u => (
                    <div key={u.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <p style={{ fontWeight: '500' }}>{u.username}</p>
                        <p style={{ fontSize: '12px', color: '#666' }}>{u.email}</p>
                      </div>
                      <span className="badge badge-secondary">{getUserTypeLabel(u.user_type)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Jobs */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Recent Jobs</h3>
              {stats.recent.jobs.length === 0 ? (
                <p style={{ color: '#666' }}>No recent jobs</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.recent.jobs.map(j => (
                    <div key={j.id} style={{ 
                      padding: '8px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px'
                    }}>
                      <p style={{ fontWeight: '500' }}>{j.title}</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>{j.company_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Recent Applications</h3>
              {stats.recent.applications.length === 0 ? (
                <p style={{ color: '#666' }}>No recent applications</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.recent.applications.map(a => (
                    <div key={a.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <p style={{ fontWeight: '500' }}>{a.applicant__username}</p>
                        <p style={{ fontSize: '12px', color: '#666' }}>{a.job__title}</p>
                      </div>
                      <span className={`badge ${
                        a.status === 'accepted' ? 'badge-success' :
                        a.status === 'rejected' ? 'badge-danger' :
                        a.status === 'pending' ? 'badge-warning' : 'badge-secondary'
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Filters */}
          <div className="card mb-20">
            <div className="flex gap-20" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                <label>Filter by Type</label>
                <select
                  className="form-control"
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                >
                  <option value="">All Users</option>
                  <option value="job_seeker">Job Seekers</option>
                  <option value="employer">Employers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: '2 1 300px' }}>
                <label>Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p>No users found</p>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Joined</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <strong>{u.username}</strong>
                        {u.organization_name && (
                          <p style={{ fontSize: '12px', color: '#666' }}>{u.organization_name}</p>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{u.email}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="badge badge-secondary">{getUserTypeLabel(u.user_type)}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{formatDate(u.date_joined)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div className="flex gap-10" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Delete
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

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div>
          {/* Search */}
          <div className="card mb-20">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Search Jobs</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Jobs Table */}
          {isLoading ? (
            <p>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p>No jobs found</p>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Company</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Deadline</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <Link to={`/jobs/${j.id}`} style={{ fontWeight: 'bold' }}>{j.title}</Link>
                        <p style={{ fontSize: '12px', color: '#666' }}>by {j.employer_name}</p>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{j.company_name}</td>
                      <td style={{ padding: '12px 8px' }}>{j.location}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="badge badge-secondary">{j.job_type}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={new Date(j.application_deadline) < new Date() ? 'text-danger' : ''}>
                          {formatDate(j.application_deadline)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div className="flex gap-10" style={{ justifyContent: 'flex-end' }}>
                          <Link to={`/jobs/${j.id}`} className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            View
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteJob(j.id)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Delete
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
    </div>
  );
}

export default AdminDashboard;
