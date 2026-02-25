import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const hasCalledRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate calls (React 18 StrictMode runs effects twice)
      if (hasCalledRef.current) return;
      hasCalledRef.current = true;

      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Google sign-in was cancelled or failed.');
        setIsLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received from Google.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.googleCallback(code);
        const { user, tokens, is_new_user, profile_complete } = response.data;

        // Store auth data
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update auth context
        setAuthData(user, tokens.access, tokens.refresh);

        // Redirect based on profile completion
        if (is_new_user || !profile_complete) {
          navigate('/complete-profile', { 
            state: { 
              isNewUser: is_new_user,
              message: 'Please complete your profile to continue.'
            }
          });
        } else {
          navigate('/dashboard');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string; details?: unknown } } };
        console.error('Google callback error:', error);
        setError(error.response?.data?.error || 'Authentication failed. Please try again.');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthData]);

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-form" style={{ textAlign: 'center' }}>
          <h2>Signing you in...</h2>
          <p>Please wait while we complete your Google sign-in.</p>
          <div className="loading-spinner" style={{ margin: '20px auto' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #0a66c2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Sign-in Failed</h2>
          <div className="message message-error">{error}</div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/login')}
            >
              Try Again
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default GoogleCallback;
