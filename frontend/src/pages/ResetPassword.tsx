import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function ResetPassword() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const passwordValidation = validatePassword(formData.newPassword);
  const passwordStrength = getPasswordStrength(passwordValidation);
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!uid || !token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const allValid = Object.values(passwordValidation).every(Boolean);
    if (!allValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword(uid, token, formData.newPassword, formData.confirmPassword);
      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; uid?: string[]; token?: string[]; new_password?: string[] } } };
      const errorData = error.response?.data;
      if (errorData?.uid) {
        setError('Invalid reset link. Please request a new password reset.');
      } else if (errorData?.token) {
        setError('This reset link has expired. Please request a new password reset.');
      } else if (errorData?.new_password) {
        setError(errorData.new_password.join(' '));
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h1>Invalid Reset Link</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Reset Your Password</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Create a strong password for your account.
        </p>
        
        {message && (
          <div className="message message-success">
            {message}
            <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Redirecting to login...</p>
          </div>
        )}
        {error && <div className="message message-error">{error}</div>}
        
        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  className="form-control"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
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
              
              {formData.newPassword && (
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
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.confirmPassword && (
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
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
