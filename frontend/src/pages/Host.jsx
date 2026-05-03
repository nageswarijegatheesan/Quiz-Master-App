import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, Trophy, Clock } from 'lucide-react';
import { io } from 'socket.io-client';

const Host = () => {
  const { quizId } = useParams();
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [quizState, setQuizState] = useState('lobby'); // lobby, active, leaderboard, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const joinUrl = `${window.location.origin}/join/${quizId}`;

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Rejoin admin room and get existing participants
    newSocket.on('connect', () => {
      newSocket.emit('rejoinAdmin', quizId, (response) => {
        if (response && response.success && response.participants) {
          setParticipants(response.participants.map(p => ({
            id: p.participantId,
            name: p.name,
            avatar: p.avatar
          })));
        }
      });
    });

    newSocket.on('participantJoined', (data) => {
      setParticipants(prev => {
        // Prevent duplicates in UI
        if (prev.some(p => p.id === data.participantId)) return prev;
        return [...prev, { id: data.participantId, name: data.name, avatar: data.avatar }];
      });
    });

    newSocket.on('newQuestion', (data) => {
      setQuizState('active');
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
    });

    newSocket.on('questionLeaderboard', (data) => {
      setQuizState('leaderboard');
      setLeaderboard(data.leaderboard);
    });

    newSocket.on('quizFinished', (data) => {
      setQuizState('finished');
      setLeaderboard(data.leaderboard);
    });

    return () => newSocket.close();
  }, [quizId]);

  // Countdown timer for active question
  useEffect(() => {
    if (quizState !== 'active' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizState, currentQuestion]);

  const startQuiz = () => {
    if (socket) {
      socket.emit('startQuiz', quizId);
    }
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (quizState === 'lobby') {
    return (
      <div className="container flex-center" style={{ flex: 1 }}>
        <div className="card animate-fade-in host-lobby-card">
          <h1 className="quiz-pin-display">Quiz PIN: <span>{quizId}</span></h1>
          
          <div className="lobby-content">
            <div className="qr-section">
              <div className="qr-wrapper">
                <QRCodeSVG value={joinUrl} size={180} />
              </div>
              <div className="qr-info">
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>📱 Scan to join</h3>
                <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.9rem' }}>or share this link:</p>
                <div className="share-link">{joinUrl}</div>
              </div>
            </div>

            <div className="lobby-participants-section">
              <div className="participant-count">
                <Users size={22} /> {participants.length} Player{participants.length !== 1 ? 's' : ''} Joined
              </div>

              <div className="participant-chips">
                {participants.length === 0 ? (
                  <p style={{ opacity: 0.6, textAlign: 'center', padding: '1rem' }}>Waiting for players to join...</p>
                ) : (
                  participants.map((p, i) => (
                    <span key={p.id} className="participant-chip animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <span className="chip-avatar">{p.avatar}</span>
                      {p.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button 
              className="btn btn-secondary start-btn" 
              onClick={startQuiz}
              disabled={participants.length === 0}
            >
              <Play size={28} /> Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizState === 'active' && currentQuestion) {
    const timePercent = currentQuestion.timeLimit > 0 ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
    return (
      <div className="container flex-center" style={{ flex: 1 }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold', color: '#64748B' }}>
            <span>Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: timeLeft <= 5 ? 'var(--danger)' : '#64748B' }}>
              <Clock size={18} /> {timeLeft}s
            </span>
          </div>
          
          <div className="timer-container">
            <div className={`timer-bar ${timePercent <= 30 ? 'warning' : ''}`} style={{ width: `${timePercent}%` }}></div>
          </div>
          
          <h2 style={{ fontSize: '2.2rem', margin: '2rem 0 3rem' }}>{currentQuestion.question}</h2>
          
          <div className="options-grid">
            {currentQuestion.options.map((opt, i) => (
              <div key={i} className="option-btn" style={{ background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)', cursor: 'default' }}>
                <span style={{ opacity: 0.6, marginRight: '0.5rem' }}>{['A', 'B', 'C', 'D'][i]}.</span> {opt}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Users size={18} /> {participants.length} participants answering...
          </div>
        </div>
      </div>
    );
  }

  if (quizState === 'leaderboard' || quizState === 'finished') {
    return (
      <div className="container flex-center" style={{ flex: 1 }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Trophy size={40} color="var(--secondary)" /> 
            {quizState === 'finished' ? 'Final Leaderboard' : 'Leaderboard'}
          </h2>

          <div className="flex-column gap-2">
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No scores yet!</div>
            ) : (
              leaderboard.map((p, i) => (
                <div key={i} className="leaderboard-item animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.3rem', width: '35px', textAlign: 'center' }}>{getRankEmoji(i)}</span>
                    <span style={{ fontSize: '1.3rem' }}>{p.avatar}</span>
                    <span style={{ fontSize: '1.1rem' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{p.score} pts</span>
                </div>
              ))
            )}
          </div>
          
          {quizState === 'finished' && (
             <div style={{ textAlign: 'center', marginTop: '2rem' }}>
               <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                 Back to Home
               </button>
             </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Host;
