import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!adminName.trim()) {
      setError('Please enter your admin name.');
      return;
    }
    if (adminName.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setError('');
    // Store admin name in sessionStorage so Admin page can use it
    sessionStorage.setItem('adminName', adminName.trim());
    navigate('/admin');
  };

  return (
    <div className="container flex-center" style={{ flex: 1 }}>
      <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '3rem 2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="role-card-icon admin-icon" style={{ margin: '0 auto 1rem' }}>
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Admin Login</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
            Enter your name to access the quiz creator
          </p>
        </div>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <form onSubmit={handleLogin} className="flex-column gap-3">
          <div className="form-group">
            <label className="form-label">Admin Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Professor Smith" 
              value={adminName}
              onChange={(e) => { setAdminName(e.target.value); setError(''); }}
              maxLength={30}
              autoFocus
              style={{ fontSize: '1.1rem' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
          >
            <LogIn size={20} /> Continue to Dashboard
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            className="btn" 
            style={{ background: 'none', color: '#64748B', fontSize: '0.9rem', padding: '0.5rem' }}
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
