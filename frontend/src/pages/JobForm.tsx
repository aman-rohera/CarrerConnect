import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, type Job } from '../services/api';

function JobForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary_range: '',
    job_type: 'full_time',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      const response = await jobsApi.detail(parseInt(id!));
      const job: Job = response.data.job;
      setFormData({
        title: job.title,
        description: job.description,
        location: job.location,
        salary_range: job.salary_range,
        job_type: job.job_type,
      });
    } catch (err) {
      setError('Job not found');
    } finally {
      setIsLoadingJob(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isEditing) {
        await jobsApi.update(parseInt(id!), formData);
      } else {
        const response = await jobsApi.create(formData);
        navigate(`/jobs/${response.data.job.id}`);
        return;
      }
      navigate(`/jobs/${id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> | { error?: string } } };
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object' && !('error' in data)) {
          const messages = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          setError(messages);
        } else if ('error' in data && data.error) {
          setError(String(data.error));
        } else {
          setError('Failed to save job');
        }
      } else {
        setError('Failed to save job');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingJob) {
    return <div className="loading">Loading job...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: '700px' }}>
      <div className="auth-form">
        <h1>{isEditing ? 'Edit Job' : 'Post a New Job'}</h1>
        
        {error && <div className="message message-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Software Engineer, Product Manager"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-control"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Remote, New York, Bangalore"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="salary_range">Salary Range</label>
            <input
              type="text"
              id="salary_range"
              name="salary_range"
              className="form-control"
              value={formData.salary_range}
              onChange={handleChange}
              placeholder="e.g., $80,000 - $120,000, ₹10L - ₹15L"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="job_type">Employment Type</label>
            <select
              id="job_type"
              name="job_type"
              className="form-control"
              value={formData.job_type}
              onChange={handleChange}
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={10}
              required
            />
          </div>

          <div className="flex gap-10">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Post Job'}
            </button>
            <Link to={isEditing ? `/jobs/${id}` : '/my-jobs'} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobForm;
