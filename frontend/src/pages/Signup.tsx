import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
];

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

interface FormErrors {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
}

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    user_type: 'job_seeker' as 'job_seeker' | 'employer',
    countryCode: '+91',
    phoneNumber: '',
    location: '',
    employer_role: '',
    organization_name: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
          const location = city && state ? `${city}, ${state}` : city || state || '';
          if (location) {
            setFormData(prev => ({ ...prev, location }));
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

  // Password validation
  const validatePassword = (password: string): PasswordValidation => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  });

  const getPasswordStrength = (validation: PasswordValidation): { strength: string; color: string } => {
    const checks = Object.values(validation).filter(Boolean).length;
    if (checks <= 2) return { strength: 'Weak', color: 'var(--accent-red)' };
    if (checks <= 3) return { strength: 'Fair', color: 'var(--accent-orange)' };
    if (checks <= 4) return { strength: 'Good', color: '#0a66c2' };
    return { strength: 'Strong', color: 'var(--accent-green)' };
  };

  const passwordValidation = validatePassword(formData.password);
  const passwordStrength = getPasswordStrength(passwordValidation);
  const passwordsMatch = formData.password === formData.password2 && formData.password2 !== '';

  // Username validation
  const validateUsername = (username: string): string => {
    if (!username) return '';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username must be less than 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers, and underscores allowed';
    const reserved = ['admin', 'administrator', 'support', 'helpdesk', 'root', 'system'];
    if (reserved.includes(username.toLowerCase())) return 'This username is reserved';
    return '';
  };

  // Email validation
  const validateEmail = (email: string): string => {
    if (!email) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Phone validation
  const validatePhone = (phone: string): string => {
    if (!phone) return '';
    if (!/^\d{6,15}$/.test(phone)) return 'Phone number must be 6-15 digits';
    return '';
  };

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
    if (!username || validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const response = await authApi.checkUsername(username);
      setUsernameAvailable(response.data.is_available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounced email check
  const checkEmail = useCallback(async (email: string) => {
    if (!email || validateEmail(email)) {
      setEmailAvailable(null);
      return;
    }
    setCheckingEmail(true);
    try {
      const response = await authApi.checkEmail(email);
      setEmailAvailable(response.data.is_available);
    } catch {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Debounce effect for username
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && !validateUsername(formData.username)) {
        checkUsername(formData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, checkUsername]);

  // Debounce effect for email
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && !validateEmail(formData.email)) {
        checkEmail(formData.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email, checkEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate on change
    if (name === 'username') {
      setErrors({ ...errors, username: validateUsername(value) });
      setUsernameAvailable(null);
    } else if (name === 'email') {
      setErrors({ ...errors, email: validateEmail(value) });
      setEmailAvailable(null);
    } else if (name === 'phoneNumber') {
      setErrors({ ...errors, phone: validatePhone(value) });
    }
  };

  const handleRoleChange = (role: 'job_seeker' | 'employer') => {
    setFormData({ ...formData, user_type: role });
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const response = await authApi.getGoogleAuthUrl();
      const { auth_url } = response.data;

      // Redirect to Google OAuth
      window.location.href = auth_url;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to initiate Google Sign-Up');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phoneNumber);

    if (usernameError || emailError || phoneError) {
      setErrors({ username: usernameError, email: emailError, phone: phoneError });
      return;
    }

    if (!Object.values(passwordValidation).every(Boolean)) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }

    if (emailAvailable === false) {
      setError('Email is already registered');
      return;
    }

    setIsLoading(true);

    try {
      const phone = formData.phoneNumber ? `${formData.countryCode} ${formData.phoneNumber}` : '';
      await register({
        ...formData,
        phone,
      });
      navigate('/dashboard');
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
          setError('Registration failed');
        }
      } else {
        setError('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Join CareerConnect</h1>

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

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-status">
              <input
                type="text"
                id="username"
                name="username"
                className={`form-control ${errors.username ? 'input-error' : usernameAvailable === true ? 'input-success' : ''}`}
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
                required
              />
              {checkingUsername && <span className="input-status checking">...</span>}
              {!checkingUsername && usernameAvailable === true && <span className="input-status available">&#10003;</span>}
              {!checkingUsername && usernameAvailable === false && <span className="input-status taken">&#10007;</span>}
            </div>
            {errors.username && <div className="form-error">{errors.username}</div>}
            {!errors.username && usernameAvailable === false && <div className="form-error">Username is already taken</div>}
            {!errors.username && usernameAvailable === true && <div className="form-success">Username is available</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-status">
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'input-error' : emailAvailable === true ? 'input-success' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
              {checkingEmail && <span className="input-status checking">...</span>}
              {!checkingEmail && emailAvailable === true && <span className="input-status available">&#10003;</span>}
              {!checkingEmail && emailAvailable === false && <span className="input-status taken">&#10007;</span>}
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
            {!errors.email && emailAvailable === false && <div className="form-error">Email is already registered</div>}
            {!errors.email && emailAvailable === true && <div className="form-success">Email is available</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <div className="phone-input-group">
              {/* Custom Country Code Picker */}
              <div style={{ position: 'relative', width: '110px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsCountryOpen(o => !o)}
                  style={{
                    width: '100%', height: '100%',
                    padding: '13px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span>{formData.countryCode}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>▼</span>
                </button>
                {isCountryOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                    width: '260px', maxHeight: '240px', overflowY: 'auto',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border-color)',
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
                          display: 'flex', alignItems: 'center', gap: '10px',
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
                className={`form-control phone-number-input ${errors.phone ? 'input-error' : ''}`}
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>
            {errors.phone && <div className="form-error">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                title="Detect my current location"
                style={{
                  padding: '0 16px',
                  background: 'var(--primary-light)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--primary)',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isDetectingLocation ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {isDetectingLocation ? (
                  <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Detecting...</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                    Detect
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Employer-specific fields */}
          {formData.user_type === 'employer' && (
            <>
              <div className="form-group">
                <label htmlFor="employer_role">Employer Type</label>
                <select
                  id="employer_role"
                  name="employer_role"
                  className="form-control"
                  value={formData.employer_role}
                  onChange={handleChange}
                >
                  <option value="">Select Type</option>
                  <option value="hr">HR Professional</option>
                  <option value="company">Direct Company</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="organization_name">Organization Name</label>
                <input
                  type="text"
                  id="organization_name"
                  name="organization_name"
                  className="form-control"
                  value={formData.organization_name}
                  onChange={handleChange}
                  placeholder="Company Name"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${Object.values(passwordValidation).filter(Boolean).length * 20}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span style={{ color: passwordStrength.color, fontWeight: 500 }}>
                  {passwordStrength.strength}
                </span>
              </div>
            )}

            <div className="password-requirements">
              <p style={{ fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Password must contain:</p>
              <ul>
                <li className={passwordValidation.minLength ? 'valid' : ''}>
                  {passwordValidation.minLength ? '✓' : '○'} At least 8 characters
                </li>
                <li className={passwordValidation.hasUppercase ? 'valid' : ''}>
                  {passwordValidation.hasUppercase ? '✓' : '○'} One uppercase letter
                </li>
                <li className={passwordValidation.hasLowercase ? 'valid' : ''}>
                  {passwordValidation.hasLowercase ? '✓' : '○'} One lowercase letter
                </li>
                <li className={passwordValidation.hasNumber ? 'valid' : ''}>
                  {passwordValidation.hasNumber ? '✓' : '○'} One number
                </li>
                <li className={passwordValidation.hasSpecial ? 'valid' : ''}>
                  {passwordValidation.hasSpecial ? '✓' : '○'} One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword2 ? 'text' : 'password'}
                id="password2"
                name="password2"
                className="form-control"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword2(!showPassword2)}
                tabIndex={-1}
              >
                {showPassword2 ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formData.password2 && (
              <div className={`password-match ${passwordsMatch ? 'match' : 'no-match'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !passwordsMatch || !Object.values(passwordValidation).every(Boolean)}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Creating account...' : 'Agree & Join'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google Sign-Up Button */}
        <button
          type="button"
          className="btn btn-google"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
          style={{ width: '100%' }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}
        </button>

        <div className="auth-footer">
          <p>Already on CareerConnect? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
