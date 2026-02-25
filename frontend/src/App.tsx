import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleCallback from './pages/GoogleCallback';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import JobForm from './pages/JobForm';
import MyJobs from './pages/MyJobs';
import Apply from './pages/Apply';
import MyApplications from './pages/MyApplications';
import JobApplications from './pages/JobApplications';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function EmployerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user || user.user_type !== 'employer') {
    return <Navigate to="/jobs" replace />;
  }
  
  return <>{children}</>;
}

function JobSeekerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user || user.user_type !== 'job_seeker') {
    return <Navigate to="/jobs" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user || (user.user_type !== 'admin' && !user.email?.includes('admin'))) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/jobs" element={<JobList />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      
      {/* Protected Routes - All authenticated users */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/complete-profile" element={
        <ProtectedRoute><CompleteProfile /></ProtectedRoute>
      } />
      <Route path="/profile/edit" element={
        <ProtectedRoute><EditProfile /></ProtectedRoute>
      } />
      
      {/* Employer Routes */}
      <Route path="/jobs/create" element={
        <ProtectedRoute><EmployerRoute><JobForm /></EmployerRoute></ProtectedRoute>
      } />
      <Route path="/jobs/:id/edit" element={
        <ProtectedRoute><EmployerRoute><JobForm /></EmployerRoute></ProtectedRoute>
      } />
      <Route path="/my-jobs" element={
        <ProtectedRoute><EmployerRoute><MyJobs /></EmployerRoute></ProtectedRoute>
      } />
      <Route path="/jobs/:id/applications" element={
        <ProtectedRoute><EmployerRoute><JobApplications /></EmployerRoute></ProtectedRoute>
      } />
      
      {/* Job Seeker Routes */}
      <Route path="/jobs/:id/apply" element={
        <ProtectedRoute><JobSeekerRoute><Apply /></JobSeekerRoute></ProtectedRoute>
      } />
      <Route path="/my-applications" element={
        <ProtectedRoute><JobSeekerRoute><MyApplications /></JobSeekerRoute></ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="container">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
