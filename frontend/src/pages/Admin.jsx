import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { io } from 'socket.io-client';

const Admin = () => {
  const navigate = useNavigate();
  const adminName = sessionStorage.getItem('adminName');
  
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 10 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Redirect if no admin name
    if (!adminName) {
      navigate('/admin-login');
      return;
    }
    const socket = io("https://quiz-master-app-97b2.onrender.com");
    setSocket(newSocket);
    return () => newSocket.close();
  }, [adminName, navigate]);

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { question: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 10 }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const saveAndPublish = () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1}: Please enter the question text.`);
        return;
      }
      if (q.options.some(o => !o.trim())) {
        alert(`Question ${i + 1}: Please fill out all 4 options.`);
        return;
      }
    }

    setIsSaving(true);
    socket.emit('createQuiz', { questions, adminName }, (response) => {
      if (response.success) {
        // Store the quizId so Host can use it
        sessionStorage.setItem('hostQuizId', response.quizId);
        navigate(`/host/${response.quizId}`);
      } else {
        alert('Failed to create quiz');
        setIsSaving(false);
      }
    });
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="container animate-fade-in">
      <div className="admin-header-bar">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Create New Quiz</h1>
          <p style={{ color: '#64748B', margin: 0 }}>Welcome, <strong>{adminName}</strong></p>
        </div>
        <button className="btn btn-secondary" onClick={saveAndPublish} disabled={isSaving}>
          {isSaving ? 'Publishing...' : <><Save size={20} /> Publish & Get Code</>}
        </button>
      </div>

      <div className="flex-column gap-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="card question-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="question-badge">Question {qIndex + 1}</div>
              <button 
                className="btn btn-danger" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} 
                onClick={() => removeQuestion(qIndex)}
                disabled={questions.length === 1}
                title="Remove question"
              >
                <Trash2 size={16} /> Remove
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter your question here..." 
                value={q.question}
                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
              />
            </div>

            <label className="form-label" style={{ marginBottom: '0.75rem' }}>Answer Options <span style={{ color: '#64748B', fontWeight: 400 }}>— select the correct one</span></label>
            <div className="options-grid" style={{ marginBottom: '1.5rem', marginTop: 0 }}>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className={`option-input-wrapper ${q.correctOption === oIndex ? 'correct-option' : ''}`}>
                  <div 
                    className={`option-letter ${q.correctOption === oIndex ? 'active' : ''}`}
                    onClick={() => updateQuestion(qIndex, 'correctOption', oIndex)}
                    title="Mark as correct answer"
                  >
                    {optionLabels[oIndex]}
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder={`Option ${optionLabels[oIndex]}`}
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '0.5rem' }}
                  />
                </div>
              ))}
            </div>

            <div className="form-group" style={{ width: '220px', marginBottom: 0 }}>
              <label className="form-label">⏱ Time Limit</label>
              <select 
                className="form-control"
                value={q.timeLimit}
                onChange={(e) => updateQuestion(qIndex, 'timeLimit', parseInt(e.target.value))}
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="btn btn-outline" onClick={addQuestion} style={{ padding: '1rem 2rem' }}>
          <Plus size={20} /> Add Another Question
        </button>
      </div>
    </div>
  );
};

export default Admin;
