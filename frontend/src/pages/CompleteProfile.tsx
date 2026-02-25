import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

// Country codes data
const countryCodes = [
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
];

function CompleteProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewUser = location.state?.isNewUser || false;

  const [formData, setFormData] = useState({
    user_type: user?.user_type || 'job_seeker',
    countryCode: '+91',
    phoneNumber: user?.phone?.replace(/^\+\d+\s*/, '') || '',
    location: user?.location || '',
    employer_role: user?.employer_role || '',
    organization_name: user?.organization_name || '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
          );
          const data = await res.json();
          // Prioritize city/district over suburb/taluka for accurate city name
          const city = data.address?.city || data.address?.state_district || data.address?.county || data.address?.town || data.address?.village || '';
          const state = data.address?.state || '';
          // Only show city and state, no country
          const detectedLocation = city && state ? `${city}, ${state}` : city || state || '';
          if (detectedLocation) {
            setFormData(prev => ({ ...prev, location: detectedLocation }));
          } else {
            alert('Could not determine your city/state. Please enter manually.');
          }
        } catch {
          alert('Could not determine your location. Please enter it manually.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        alert('Location access denied. Please enter your location manually.');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (role: 'job_seeker' | 'employer') => {
    setFormData({ ...formData, user_type: role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!formData.phoneNumber) {
      setError('Phone number is required');
      setIsLoading(false);
      return;
    }

    if (!formData.location) {
      setError('Location is required');
      setIsLoading(false);
      return;
    }

    if (formData.user_type === 'employer' && !formData.organization_name) {
      setError('Organization name is required for employers');
      setIsLoading(false);
      return;
    }

    try {
      const phone = `${formData.countryCode}${formData.phoneNumber}`;
      
      await authApi.completeGoogleProfile({
        user_type: formData.user_type,
        phone,
        location: formData.location,
        employer_role: formData.employer_role || undefined,
        organization_name: formData.organization_name || undefined,
      });

      // Refresh user data
      await refreshUser();
      
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{isNewUser ? 'Complete Your Profile' : 'Update Your Profile'}</h1>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {isNewUser 
            ? 'Welcome! Please complete your profile to get started.'
            : 'Please update your profile information to continue.'}
        </p>
        
        {error && <div className="message message-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label>I am a</label>
            <div className="role-selection">
              <div 
                className={`role-option ${formData.user_type === 'job_seeker' ? 'selected' : ''}`}
                onClick={() => handleRoleChange('job_seeker')}
              >
                <input type="radio" name="role" checked={formData.user_type === 'job_seeker'} readOnly />
                <h3>Job Seeker</h3>
                <p>Looking for opportunities</p>
              </div>
              <div 
                className={`role-option ${formData.user_type === 'employer' ? 'selected' : ''}`}
                onClick={() => handleRoleChange('employer')}
              >
                <input type="radio" name="role" checked={formData.user_type === 'employer'} readOnly />
                <h3>Employer</h3>
                <p>Hiring talent</p>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number *</label>
            <div className="phone-input-group" style={{ display: 'flex', gap: '10px' }}>
              {/* Custom Country Code Picker - Shows only code, full info in dropdown */}
              <div style={{ position: 'relative', width: '90px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsCountryOpen(o => !o)}
                  style={{
                    width: '100%',
                    padding: '14px 10px',
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span>{formData.countryCode}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>▼</span>
                </button>
                {isCountryOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    width: '260px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 200,
                  }}>
                    {countryCodes.map((item) => (
                      <div
                        key={item.code + item.country}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, countryCode: item.code }));
                          setIsCountryOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          background: formData.countryCode === item.code ? 'var(--primary-light)' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                        onMouseLeave={e => (e.currentTarget.style.background = formData.countryCode === item.code ? 'var(--primary-light)' : 'transparent')}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{item.flag}</span>
                        <span style={{ fontWeight: 600, minWidth: '42px' }}>{item.code}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.country}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="form-control"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone number"
                required
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Location with Detect Button */}
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State"
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                title="Detect my location (City, State)"
                style={{
                  padding: '0 16px',
                  background: 'var(--primary-light)',
                  border: '2px solid var(--primary)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--primary)',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isDetectingLocation ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {isDetectingLocation ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid var(--primary)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite'
                    }} />
                    Detecting...
                  </>
                ) : (
                  <>📍 Detect</>
                )}
              </button>
            </div>
          </div>

          {/* Employer-specific fields */}
          {formData.user_type === 'employer' && (
            <>
              <div className="form-group">
                <label htmlFor="organization_name">Organization Name *</label>
                <input
                  type="text"
                  id="organization_name"
                  name="organization_name"
                  className="form-control"
                  value={formData.organization_name}
                  onChange={handleChange}
                  placeholder="Company or organization name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="employer_role">Your Role</label>
                <select
                  id="employer_role"
                  name="employer_role"
                  className="form-control"
                  value={formData.employer_role}
                  onChange={handleChange}
                >
                  <option value="">Select your role</option>
                  <option value="hr">HR Representative</option>
                  <option value="company">Direct Company/Founder</option>
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
