import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      setEmailError(validateEmail(value));
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setMessage(response.data.message);
      setEmail('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; email?: string[] } } };
      setError(error.response?.data?.error || error.response?.data?.email?.[0] || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Forgot Password?</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          No worries! Enter your email and we'll send you a reset link.
        </p>
        
        {message && <div className="message message-success">{message}</div>}
        {error && <div className="message message-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className={`form-control ${emailError ? 'input-error' : ''}`}
              value={email}
              onChange={handleEmailChange}
              placeholder="your@email.com"
              required
            />
            {emailError && <div className="form-error">{emailError}</div>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading || !!emailError} 
            style={{ width: '100%' }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Sign in</Link></p>
          <p>New to CareerConnect? <Link to="/signup">Join now</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
