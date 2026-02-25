import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, applicationsApi, type Job } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Apply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const response = await jobsApi.detail(parseInt(id!));
      setJob(response.data.job);
      if (response.data.has_applied) {
        navigate(`/jobs/${id}`);
      }
    } catch (err) {
      setError('Job not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await applicationsApi.apply(parseInt(id!), {
        cover_letter: coverLetter,
        resume: resume || undefined,
        use_profile_resume: useProfileResume,
      });
      navigate('/my-applications');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      setUseProfileResume(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading job details...</div>;
  }

  if (error || !job) {
    return (
      <div className="card">
        <h2>Job Not Found</h2>
        <p style={{ color: '#666' }}>This job posting is no longer available.</p>
        <Link to="/jobs" className="btn btn-primary mt-20">Browse Other Jobs</Link>
      </div>
    );
  }

  const hasProfileResume = user?.profile?.resume;

  return (
    <div className="auth-container" style={{ maxWidth: '700px' }}>
      <div className="auth-form">
        <h1>Apply for {job.title}</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          at {job.posted_by?.organization_name || job.posted_by?.username}
        </p>

        {error && <div className="message message-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="coverLetter">Cover Letter</label>
            <textarea
              id="coverLetter"
              className="form-control"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell us why you're the perfect fit for this role..."
              rows={8}
              required
            />
          </div>

          <div className="form-group">
            <label>Resume</label>
            
            {hasProfileResume && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useProfileResume}
                    onChange={(e) => {
                      setUseProfileResume(e.target.checked);
                      if (e.target.checked) setResume(null);
                    }}
                  />
                  Use resume from my profile
                </label>
              </div>
            )}
            
            {!useProfileResume && (
              <input
                type="file"
                className="form-control"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            )}
            
            <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
              Accepted formats: PDF, DOC, DOCX
            </small>
          </div>

          <div className="flex gap-10">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
            <Link to={`/jobs/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Apply;
