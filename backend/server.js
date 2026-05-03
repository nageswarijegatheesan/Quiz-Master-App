const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const quizzes = {};
const participants = {}; // socketId -> participant data

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Admin creates a quiz
  socket.on('createQuiz', (quizData, callback) => {
    const quizId = uuidv4().substring(0, 8); // simple short ID
    quizzes[quizId] = {
      id: quizId,
      adminId: socket.id,
      adminName: quizData.adminName || 'Admin',
      questions: quizData.questions, // array of { question, options, correctOption, timeLimit }
      status: 'waiting', // waiting, active, finished
      currentQuestionIndex: -1,
      participants: {}, // participantId -> { socketId, name, avatar, score }
      participantNames: new Set(), // track names to prevent duplicates
      timer: null
    };
    socket.join(`admin-${quizId}`);
    callback({ success: true, quizId });
  });

  // Admin re-joins after navigation (new socket)
  socket.on('rejoinAdmin', (quizId, callback) => {
    const quiz = quizzes[quizId];
    if (!quiz) {
      if (callback) callback({ success: false });
      return;
    }
    // Update the adminId to the new socket so startQuiz works
    quiz.adminId = socket.id;
    socket.join(`admin-${quizId}`);

    // Send back existing participant list so admin sees them
    const existingParticipants = Object.entries(quiz.participants).map(([id, p]) => ({
      participantId: id,
      name: p.name,
      avatar: p.avatar
    }));

    if (callback) callback({ success: true, participants: existingParticipants });
  });

  // Participant joins a quiz
  socket.on('joinQuiz', ({ quizId, name, avatar }, callback) => {
    const quiz = quizzes[quizId];
    if (!quiz) {
      return callback({ success: false, message: 'Quiz not found. Please check the PIN.' });
    }
    if (quiz.status !== 'waiting') {
      return callback({ success: false, message: 'Quiz already started or finished.' });
    }
    if (!name || !name.trim()) {
      return callback({ success: false, message: 'Name is required.' });
    }

    // Prevent duplicate names
    const trimmedName = name.trim();
    if (quiz.participantNames.has(trimmedName.toLowerCase())) {
      return callback({ success: false, message: 'This name is already taken. Please choose a different name.' });
    }

    const participantId = uuidv4();
    quiz.participants[participantId] = {
      socketId: socket.id,
      name: trimmedName,
      avatar: avatar || '👤',
      score: 0,
      answeredCurrent: false
    };
    quiz.participantNames.add(trimmedName.toLowerCase());

    participants[socket.id] = { participantId, quizId };
    socket.join(`quiz-${quizId}`);

    // Notify admin
    io.to(`admin-${quizId}`).emit('participantJoined', {
      participantId,
      name: trimmedName,
      avatar: avatar || '👤',
      totalParticipants: Object.keys(quiz.participants).length
    });

    callback({ success: true, participantId, quizStatus: quiz.status });
  });

  // Participant re-joins the quiz room (for play screen)
  socket.on('rejoinQuiz', ({ quizId, participantId }, callback) => {
    const quiz = quizzes[quizId];
    if (!quiz) {
      return callback({ success: false, message: 'Quiz not found.' });
    }

    const participant = quiz.participants[participantId];
    if (!participant) {
      return callback({ success: false, message: 'Participant not found.' });
    }

    // Update socket ID for this participant
    participant.socketId = socket.id;
    participants[socket.id] = { participantId, quizId };
    socket.join(`quiz-${quizId}`);

    callback({ success: true, quizStatus: quiz.status });
  });

  // Admin starts the quiz
  socket.on('startQuiz', (quizId) => {
    const quiz = quizzes[quizId];
    if (quiz && quiz.adminId === socket.id) {
      quiz.status = 'active';
      nextQuestion(quizId);
    }
  });

  // Participant submits an answer
  socket.on('submitAnswer', ({ quizId, participantId, answerIndex, timeTaken }) => {
    const quiz = quizzes[quizId];
    if (!quiz || quiz.status !== 'active') return;

    const participant = quiz.participants[participantId];
    if (!participant || participant.answeredCurrent) return;

    participant.answeredCurrent = true;
    const currentQ = quiz.questions[quiz.currentQuestionIndex];

    if (answerIndex === currentQ.correctOption) {
      // Correct answer: 10 points
      let points = 10;
      // Bonus points based on speed (up to 5 extra points for answering immediately)
      const maxTime = currentQ.timeLimit;
      if (timeTaken < maxTime) {
        points += Math.floor(((maxTime - timeTaken) / maxTime) * 5);
      }
      participant.score += points;
    }
  });

  // Helper function to proceed to the next question
  function nextQuestion(quizId) {
    const quiz = quizzes[quizId];
    if (!quiz) return;

    quiz.currentQuestionIndex++;

    // Reset answered status
    Object.values(quiz.participants).forEach(p => p.answeredCurrent = false);

    if (quiz.currentQuestionIndex >= quiz.questions.length) {
      // Quiz finished
      quiz.status = 'finished';
      const leaderboard = Object.values(quiz.participants)
        .map(p => ({ name: p.name, avatar: p.avatar, score: p.score }))
        .sort((a, b) => b.score - a.score);

      io.to(`quiz-${quizId}`).emit('quizFinished', { leaderboard });
      io.to(`admin-${quizId}`).emit('quizFinished', { leaderboard });
      return;
    }

    const question = quiz.questions[quiz.currentQuestionIndex];
    const qToSend = {
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit,
      questionIndex: quiz.currentQuestionIndex,
      totalQuestions: quiz.questions.length
    };

    io.to(`quiz-${quizId}`).emit('newQuestion', qToSend);
    io.to(`admin-${quizId}`).emit('newQuestion', qToSend); // Admin sees it too

    // Set timer for this question
    quiz.timer = setTimeout(() => {
      showLeaderboard(quizId);
    }, question.timeLimit * 1000);
  }

  function showLeaderboard(quizId) {
    const quiz = quizzes[quizId];
    if (!quiz) return;

    const currentQ = quiz.questions[quiz.currentQuestionIndex];
    const leaderboard = Object.values(quiz.participants)
      .map(p => ({ name: p.name, avatar: p.avatar, score: p.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10

    io.to(`quiz-${quizId}`).emit('questionLeaderboard', {
      leaderboard,
      correctOption: currentQ.correctOption
    });
    io.to(`admin-${quizId}`).emit('questionLeaderboard', {
      leaderboard,
      correctOption: currentQ.correctOption
    });

    // Show leaderboard for 5 seconds, then next question
    setTimeout(() => {
      if (quiz.status === 'active') {
        nextQuestion(quizId);
      }
    }, 5000);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const pInfo = participants[socket.id];
    if (pInfo) {
      const quiz = quizzes[pInfo.quizId];
      if (quiz) {
        // We keep their score if they disconnect
      }
      delete participants[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});