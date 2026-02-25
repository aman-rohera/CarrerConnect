import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-landing">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          🚀 India's Fastest Growing Job Platform
        </div>

        <h1>
          Find Your <span className="hero-highlight">Dream Career</span><br />
          or Hire Top Talent
        </h1>

        <p>
          CareerConnect bridges ambitious professionals with world-class companies.
          Your next big opportunity is just one click away.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
              <Link to="/jobs" className="btn btn-secondary btn-lg">Browse Jobs</Link>
              {user?.user_type === 'employer' && (
                <Link to="/jobs/create" className="btn btn-primary btn-lg">Post a Job</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/jobs" className="btn btn-secondary btn-lg">Browse Jobs</Link>
            </>
          )}
        </div>

        <div className="hero-floats">
          <span className="hero-float-badge"><span>50K+</span> Active Jobs</span>
          <span className="hero-float-badge"><span>10K+</span> Companies</span>
          <span className="hero-float-badge"><span>2M+</span> Job Seekers</span>
          <span className="hero-float-badge"><span>98%</span> Satisfaction</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-item">
          <h3>50K+</h3>
          <p>Jobs Posted</p>
        </div>
        <div className="stat-item">
          <h3>10K+</h3>
          <p>Companies</p>
        </div>
        <div className="stat-item">
          <h3>2M+</h3>
          <p>Professionals</p>
        </div>
        <div className="stat-item">
          <h3>95%</h3>
          <p>Success Rate</p>
        </div>
      </div>

      {/* Features */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon-wrap">🎯</div>
          <h3>Smart Job Matching</h3>
          <p>Our intelligent algorithm connects you with roles that perfectly match your skills, experience, and career goals.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">🏢</div>
          <h3>Top Companies</h3>
          <p>Access exclusive opportunities from thousands of verified employers — from startups to Fortune 500 companies.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">📊</div>
          <h3>Track Applications</h3>
          <p>Stay on top of your job search with real-time status updates and a powerful application dashboard.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="home-cta">
        <h2>Ready to Take the Next Step?</h2>
        <p>Join millions of professionals who found their dream jobs through CareerConnect.</p>
        <div className="home-cta-actions">
          {isAuthenticated ? (
            <Link to="/jobs" className="btn btn-primary btn-lg">Explore Jobs</Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
