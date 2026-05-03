import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Trophy } from 'lucide-react';
import { io } from 'socket.io-client';

const ParticipantPlay = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('waiting'); // waiting, active, leaderboard, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(null);

  // Read participant data from sessionStorage (set by ParticipantJoin)
  const participantData = JSON.parse(sessionStorage.getItem('participantData') || 'null');

  useEffect(() => {
    if (!participantData?.participantId) {
      navigate(`/join/${quizId}`);
      return;
    }

    const socket = io("https://quiz-master-app-97b2.onrender.com");
    setSocket(newSocket);

    // Rejoin the quiz room without creating a duplicate participant
    newSocket.on('connect', () => {
      newSocket.emit('rejoinQuiz', {
        quizId,
        participantId: participantData.participantId
      }, (res) => {
        if (!res.success) {
          // If rejoin fails, redirect to join page
          navigate(`/join/${quizId}`);
        }
      });
    });

    newSocket.on('newQuestion', (data) => {
      setGameState('active');
      setCurrentQuestion(data);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
      setTimeLeft(data.timeLimit);
    });

    newSocket.on('questionLeaderboard', (data) => {
      setGameState('leaderboard');
      setLeaderboard(data.leaderboard);
      setCorrectAnswer(data.correctOption);
      const me = data.leaderboard.find(p => p.name === participantData.name);
      if (me) setMyScore(me.score);
    });

    newSocket.on('quizFinished', (data) => {
      setGameState('finished');
      setLeaderboard(data.leaderboard);
      const me = data.leaderboard.find(p => p.name === participantData.name);
      if (me) setMyScore(me.score);
    });

    return () => newSocket.close();
  }, [quizId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'active' || timeLeft <= 0) return;
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
  }, [gameState, currentQuestion]);

  const submitAnswer = (index) => {
    if (selectedOption !== null || gameState !== 'active') return;
    
    setSelectedOption(index);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    
    socket.emit('submitAnswer', {
      quizId,
      participantId: participantData.participantId,
      answerIndex: index,
      timeTaken
    });
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const optionColors = [
    { bg: '#EF4444', label: 'A' },
    { bg: '#3B82F6', label: 'B' },
    { bg: '#F59E0B', label: 'C' },
    { bg: '#10B981', label: 'D' }
  ];

  if (gameState === 'waiting') {
    return (
      <div className="container flex-center" style={{ flex: 1 }}>
        <div className="card" style={{ textAlign: 'center', background: 'var(--primary)', color: 'white', maxWidth: '500px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }} className="animate-pulse">{participantData?.avatar || '😎'}</div>
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>You're in, {participantData?.name}!</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>Waiting for the host to start the quiz...</p>
          <div className="waiting-dots" style={{ marginTop: '1.5rem' }}>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'active' && currentQuestion) {
    const timePercent = currentQuestion.timeLimit > 0 ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
    return (
      <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '700px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="score-badge">
            {participantData?.avatar} {myScore} pts
          </div>
          <div className="question-counter">
            {currentQuestion.questionIndex + 1} / {currentQuestion.totalQuestions}
          </div>
          <div className={`timer-badge ${timeLeft <= 5 ? 'danger' : ''}`}>
            <Clock size={16} /> {timeLeft}s
          </div>
        </div>

        <div className="timer-container">
          <div className={`timer-bar ${timePercent <= 30 ? 'warning' : ''}`} style={{ width: `${timePercent}%` }}></div>
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: '2rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentQuestion.question}
          </h2>

          <div className="options-grid">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${selectedOption === i ? 'selected' : ''}`}
                onClick={() => submitAnswer(i)}
                disabled={selectedOption !== null}
                style={{
                  opacity: selectedOption !== null && selectedOption !== i ? 0.4 : 1,
                  minHeight: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  background: selectedOption === i ? optionColors[i].bg : 'var(--card-bg)',
                  color: selectedOption === i ? 'white' : 'var(--text-dark)',
                  borderColor: selectedOption === i ? optionColors[i].bg : '#E2E8F0',
                  gap: '0.75rem'
                }}
              >
                {selectedOption === i && <CheckCircle size={22} />}
                <span style={{ opacity: 0.6, fontWeight: 400 }}>{optionColors[i].label}.</span> {opt}
              </button>
            ))}
          </div>

          {selectedOption !== null && (
            <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748B', fontWeight: 500 }}>
              ✅ Answer locked in! Waiting for others...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'leaderboard' || gameState === 'finished') {
    return (
      <div className="container flex-center" style={{ flex: 1 }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Trophy size={36} color="var(--secondary)" /> 
            {gameState === 'finished' ? 'Final Scoreboard' : 'Current Standings'}
          </h2>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {gameState === 'leaderboard' && (
              <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '12px', background: selectedOption === correctAnswer ? 'var(--success)' : 'var(--danger)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {selectedOption === correctAnswer ? '✨ Correct Answer! ✨' : '❌ Incorrect Answer'}
              </div>
            )}
            <span style={{ fontSize: '1rem', color: '#64748B' }}>Your Score: </span>
            <strong style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{myScore} pts</strong>
          </div>

          <div className="flex-column gap-2">
            {leaderboard.map((p, i) => {
              const isMe = p.name === participantData?.name;
              return (
                <div key={i} className={`leaderboard-item ${isMe ? 'is-me' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', width: '35px', textAlign: 'center' }}>{getRankEmoji(i)}</span>
                    <span style={{ fontSize: '1.3rem' }}>{p.avatar}</span>
                    <span style={{ fontSize: '1.1rem' }}>{p.name} {isMe && <span style={{ color: 'var(--primary)', fontWeight: 800 }}>(You)</span>}</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{p.score} pts</span>
                </div>
              );
            })}
          </div>
          
          {gameState === 'finished' && (
             <div style={{ textAlign: 'center', marginTop: '2rem' }}>
               <button className="btn btn-primary" onClick={() => { sessionStorage.removeItem('participantData'); navigate('/'); }}>
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

export default ParticipantPlay;
