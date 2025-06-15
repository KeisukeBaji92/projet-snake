const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snake-arena', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/admin', require('./routes/admin'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Snake Arena' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
