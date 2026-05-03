import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { io } from 'socket.io-client';

const AVATARS = ['😎', '🦊', '🐱', '🐶', '🦄', '🐸', '🦁', '🐼', '🐨', '🐯', '🦋', '🐙', '🦉', '🐲', '🎃', '🤖'];

const ParticipantJoin = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [pin, setPin] = useState(quizId || '');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    
    // Validation
    if (!pin.trim()) {
      setError('Please enter the Quiz PIN.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    setIsJoining(true);
    setError('');

    const socket = io("https://quiz-master-app-97b2.onrender.com");
    
    socket.emit('joinQuiz', { quizId: pin.trim(), name: name.trim(), avatar: selectedAvatar }, (response) => {
      if (response.success) {
        // Store participant data in sessionStorage (not location.state) for persistence
        sessionStorage.setItem('participantData', JSON.stringify({
          participantId: response.participantId,
          name: name.trim(),
          avatar: selectedAvatar,
          quizId: pin.trim()
        }));
        // Close this socket — ParticipantPlay will create its own and use rejoinQuiz
        socket.close();
        navigate(`/play/${pin.trim()}`);
      } else {
        setError(response.message || 'Failed to join quiz.');
        socket.close();
      }
      setIsJoining(false);
    });
  };

  return (
    <div className="container flex-center" style={{ flex: 1 }}>
      <div className="card animate-fade-in" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{selectedAvatar}</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Join Quiz</h2>
          <p style={{ color: '#64748B' }}>Enter your details and pick an avatar</p>
        </div>
        
        {error && (
          <div className="error-banner">{error}</div>
        )}

        <form onSubmit={handleJoin} className="flex-column gap-3">
          <div className="form-group">
            <label className="form-label">Quiz PIN</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. 8a7b6c5d" 
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              disabled={!!quizId}
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '3px', textTransform: 'lowercase', fontWeight: 700 }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter your nickname" 
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              maxLength={20}
              style={{ textAlign: 'center', fontSize: '1.1rem' }}
            />
          </div>

          {/* Avatar Picker */}
          <div className="form-group">
            <label className="form-label">Choose Your Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '1.1rem' }}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : <><LogIn size={20} /> Enter Quiz</>}
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

export default ParticipantJoin;
