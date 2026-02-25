import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsApi } from '../services/api';

interface JobListItem {
  id: number;
  title: string;
  location: string;
  salary_range: string;
  job_type: string;
  job_type_display: string;
  posted_at: string;
  posted_by_name: string;
  organization_name: string;
}

function JobList() {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ next: null as string | null, previous: null as string | null, count: 0 });

  useEffect(() => { loadJobs(); }, [selectedTypes]);

  const loadJobs = async (page?: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | string[] | number> = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedTypes.length > 0) params.type = selectedTypes;
      if (page) params.page = page;
      const response = await jobsApi.list(params);
      setJobs(response.data.results.jobs);
      setAppliedJobIds(response.data.results.applied_job_ids || []);
      setPagination({ next: response.data.next, previous: response.data.previous, count: response.data.count });
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadJobs(); };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const jobTypes = [
    { value: 'full_time', label: '💼 Full Time' },
    { value: 'part_time', label: '🕐 Part Time' },
    { value: 'contract', label: '📝 Contract' },
  ];

  const getCompanyInitial = (job: JobListItem) =>
    (job.organization_name || job.posted_by_name || 'C')[0].toUpperCase();

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1>Job Opportunities</h1>
          <p style={{ marginTop: '6px' }}>
            {pagination.count > 0 ? `${pagination.count} jobs available` : 'Find your next role'}
          </p>
        </div>
        {isAuthenticated && user?.user_type === 'employer' && (
          <Link to="/jobs/create" className="btn btn-primary">+ Post a Job</Link>
        )}
      </div>

      <div className="job-list-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar">
          <h3>Filters</h3>
          <div className="filter-section">
            <div className="filter-section-title">Job Type</div>
            {jobTypes.map(type => (
              <div key={type.value} className="filter-option">
                <input
                  type="checkbox"
                  id={type.value}
                  checked={selectedTypes.includes(type.value)}
                  onChange={() => handleTypeToggle(type.value)}
                />
                <label htmlFor={type.value}>{type.label}</label>
              </div>
            ))}
          </div>
          {selectedTypes.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => setSelectedTypes([])}
            >
              Clear Filters
            </button>
          )}
        </aside>

        {/* Main Content */}
        <div>
          {/* Search */}
          <form onSubmit={handleSearch} className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {/* Active filters strip */}
          {selectedTypes.length > 0 && (
            <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
              {selectedTypes.map(t => (
                <span
                  key={t}
                  className="tag tag-primary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTypeToggle(t)}
                >
                  {jobTypes.find(jt => jt.value === t)?.label} ✕
                </span>
              ))}
            </div>
          )}

          {/* Job List */}
          {isLoading ? (
            <div className="loading">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</p>
              <h3>No jobs found</h3>
              <p style={{ marginTop: '8px' }}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              {jobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div className="company-avatar">{getCompanyInitial(job)}</div>
                    <div style={{ flex: 1 }}>
                      <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
                      <div className="company-name">{job.organization_name || job.posted_by_name}</div>
                    </div>
                    <span className="tag tag-primary">{job.job_type_display}</span>
                  </div>

                  <div className="job-meta">
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary_range}</span>
                    <span>📅 {new Date(job.posted_at).toLocaleDateString()}</span>
                  </div>

                  <div className="job-actions">
                    <Link to={`/jobs/${job.id}`} className="btn btn-secondary btn-sm">View Details</Link>
                    {isAuthenticated && user?.user_type === 'job_seeker' && (
                      appliedJobIds.includes(job.id) ? (
                        <span className="status-badge status-pending">✓ Applied</span>
                      ) : (
                        <Link to={`/jobs/${job.id}/apply`} className="btn btn-primary btn-sm">Apply Now</Link>
                      )
                    )}
                  </div>
                </div>
              ))}

              <div className="pagination">
                <button
                  onClick={() => loadJobs(pagination.previous ? parseInt(new URL(pagination.previous).searchParams.get('page') || '1') : 1)}
                  disabled={!pagination.previous}
                >
                  ← Previous
                </button>
                <span className="pagination-count">{pagination.count} jobs found</span>
                <button
                  onClick={() => loadJobs(pagination.next ? parseInt(new URL(pagination.next).searchParams.get('page') || '2') : 2)}
                  disabled={!pagination.next}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobList;
