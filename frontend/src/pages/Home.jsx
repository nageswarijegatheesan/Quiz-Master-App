import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldCheck, Zap, Users, Trophy } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container flex-center" style={{ flex: 1 }}>
      <div className="animate-fade-in" style={{ maxWidth: '700px', width: '100%', textAlign: 'center' }}>
        
        {/* Hero Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="hero-icon">⚡</div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--primary), #1E40AF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real-Time Quiz
          </h1>
          <p style={{ color: '#64748B', fontSize: '1.15rem', maxWidth: '450px', margin: '0 auto' }}>
            Create engaging quizzes or join one to compete in real-time with friends!
          </p>
        </div>

        {/* Role Cards */}
        <div className="role-cards-grid">
          
          {/* Participant Card */}
          <div className="role-card role-card-participant" onClick={() => navigate('/join')}>
            <div className="role-card-icon participant-icon">
              <Play size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Join as Player</h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Enter a quiz PIN, pick your avatar, and compete live!
            </p>
            <div className="role-card-features">
              <span><Users size={14} /> Compete live</span>
              <span><Trophy size={14} /> Win points</span>
              <span><Zap size={14} /> Speed bonus</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1.1rem', marginTop: '1.5rem' }}>
              <Play size={20} /> Join a Quiz
            </button>
          </div>

          {/* Admin Card */}
          <div className="role-card role-card-admin" onClick={() => navigate('/admin-login')}>
            <div className="role-card-icon admin-icon">
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Admin Panel</h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Create quizzes, set timers, and host live sessions.
            </p>
            <div className="role-card-features">
              <span><Zap size={14} /> Add questions</span>
              <span><Users size={14} /> QR code</span>
              <span><Trophy size={14} /> Leaderboard</span>
            </div>
            <button className="btn btn-outline" style={{ width: '100%', padding: '0.875rem', fontSize: '1.1rem', marginTop: '1.5rem' }}>
              <ShieldCheck size={20} /> Admin Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
