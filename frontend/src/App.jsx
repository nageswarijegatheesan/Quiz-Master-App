import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Host from './pages/Host';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantPlay from './pages/ParticipantPlay';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <header className="header">
          <Link to="/" className="header-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="logo-icon">⚡</span>
            <span style={{ color: 'var(--text-light)' }}>Quiz</span>
            <span style={{ color: 'var(--secondary)' }}>Master</span>
          </Link>
        </header>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/host/:quizId" element={<Host />} />
            <Route path="/join" element={<ParticipantJoin />} />
            <Route path="/join/:quizId" element={<ParticipantJoin />} />
            <Route path="/play/:quizId" element={<ParticipantPlay />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
