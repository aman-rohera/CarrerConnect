import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

function EditProfile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    location: '',
    employer_role: '',
    organization_name: '',
    profile: {
      skills: '',
      portfolio_url: '',
      company_website: '',
      company_description: '',
    },
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [resume, setResume] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'photo' | 'password' | 'resume'>('profile');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        phone: user.phone || '',
        location: user.location || '',
        employer_role: user.employer_role || '',
        organization_name: user.organization_name || '',
        profile: {
          skills: user.profile?.skills || '',
          portfolio_url: user.profile?.portfolio_url || '',
          company_website: user.profile?.company_website || '',
          company_description: user.profile?.company_description || '',
        },
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.replace('profile.', '');
      setFormData(prev => ({
        ...prev,
        profile: { ...prev.profile, [field]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await authApi.updateProfile(formData);
      await refreshUser();
      setSuccess('Profile updated successfully!');
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
          setError('Failed to update profile');
        }
      } else {
        setError('Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setSuccess('Password changed successfully!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { old_password?: string[]; error?: string } } };
      if (error.response?.data?.old_password) {
        setError('Current password is incorrect');
      } else {
        setError(error.response?.data?.error || 'Failed to change password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume) {
      setError('Please select a file');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await authApi.uploadResume(resume);
      await refreshUser();
      setSuccess('Resume uploaded successfully!');
      setResume(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleProfilePictureUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePicture) {
      setError('Please select an image');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await authApi.uploadProfilePicture(profilePicture);
      await refreshUser();
      setSuccess('Profile picture uploaded successfully!');
      setProfilePicture(null);
      setProfilePicturePreview(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await authApi.deleteProfilePicture();
      await refreshUser();
      setSuccess('Profile picture deleted successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to delete profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/');
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const isSeeker = user?.user_type === 'job_seeker';
  const isEmployer = user?.user_type === 'employer';

  return (
    <div className="auth-container" style={{ maxWidth: '700px' }}>
      <div className="auth-form">
        <h1>Edit Profile</h1>
        
        {/* Tabs */}
        <div className="flex gap-10 mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`btn ${activeTab === 'photo' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('photo')}
          >
            Photo
          </button>
          <button 
            className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          {isSeeker && (
            <button 
              className={`btn ${activeTab === 'resume' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('resume')}
            >
              Resume
            </button>
          )}
        </div>

        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-success">{success}</div>}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="username">Full Name</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
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
                placeholder="City, Country"
              />
            </div>

            {isSeeker && (
              <>
                <div className="form-group">
                  <label htmlFor="skills">Skills & Experience</label>
                  <textarea
                    id="skills"
                    name="profile.skills"
                    className="form-control"
                    value={formData.profile.skills}
                    onChange={handleChange}
                    rows={4}
                    placeholder="List your skills, technologies, and experience..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="portfolio_url">Portfolio URL</label>
                  <input
                    type="url"
                    id="portfolio_url"
                    name="profile.portfolio_url"
                    className="form-control"
                    value={formData.profile.portfolio_url}
                    onChange={handleChange}
                    placeholder="https://your-portfolio.com"
                  />
                </div>
              </>
            )}

            {isEmployer && (
              <>
                <div className="form-group">
                  <label htmlFor="organization_name">Company Name</label>
                  <input
                    type="text"
                    id="organization_name"
                    name="organization_name"
                    className="form-control"
                    value={formData.organization_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company_website">Company Website</label>
                  <input
                    type="url"
                    id="company_website"
                    name="profile.company_website"
                    className="form-control"
                    value={formData.profile.company_website}
                    onChange={handleChange}
                    placeholder="https://your-company.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company_description">Company Description</label>
                  <textarea
                    id="company_description"
                    name="profile.company_description"
                    className="form-control"
                    value={formData.profile.company_description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell candidates about your company..."
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <form onSubmit={handleProfilePictureUpload}>
            {/* Current Profile Picture */}
            <div className="card mb-20" style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>Current Profile Picture:</strong>
              </p>
              <div style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                margin: '0 auto 16px',
                overflow: 'hidden',
                border: '3px solid var(--accent-blue)',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : user?.profile?.profile_picture_url ? (
                  <img 
                    src={user.profile.profile_picture_url} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '48px',
                    color: 'var(--accent-blue)'
                  }}>
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {user?.profile?.profile_picture_url && !profilePicturePreview && (
                <button 
                  type="button" 
                  onClick={handleDeleteProfilePicture}
                  className="btn btn-danger"
                  disabled={isLoading}
                >
                  Delete Current Picture
                </button>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="profile_picture">Upload New Profile Picture</label>
              <input
                type="file"
                id="profile_picture"
                className="form-control"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleProfilePictureSelect}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                Accepted formats: JPEG, PNG, GIF, WebP. Max size: 5MB
              </small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading || !profilePicture}>
              {isLoading ? 'Uploading...' : 'Upload Profile Picture'}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="old_password">Current Password</label>
              <input
                type="password"
                id="old_password"
                className="form-control"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                className="form-control"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                type="password"
                id="confirm_password"
                className="form-control"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}

        {/* Resume Tab */}
        {activeTab === 'resume' && isSeeker && (
          <form onSubmit={handleResumeUpload}>
            {user?.profile?.resume && (
              <div className="card mb-20">
                <p style={{ marginBottom: '8px' }}>
                  <strong>Current Resume:</strong>
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a 
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(user.profile.resume)}&embedded=true`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    📄 View Resume
                  </a>
                  <a 
                    href={user.profile.resume} 
                    download
                    className="btn btn-ghost"
                  >
                    ⬇️ Download
                  </a>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="resume">Upload New Resume</label>
              <input
                type="file"
                id="resume"
                className="form-control"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                Accepted formats: PDF, DOC, DOCX
              </small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading || !resume}>
              {isLoading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </form>
        )}

        {/* Danger Zone */}
        <div className="card" style={{ marginTop: '32px', borderColor: 'var(--accent-red)' }}>
          <h3 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Danger Zone</h3>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button onClick={handleDeleteAccount} className="btn btn-danger">
            Delete Account
          </button>
        </div>

        <div className="mt-20">
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
