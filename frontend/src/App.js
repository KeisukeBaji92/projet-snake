import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Sandbox from './components/Sandbox';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import MyScripts from './components/MyScripts';
import TournamentList from './components/TournamentList';
import TournamentDetail from './components/TournamentDetail';
import Leaderboard from './components/Leaderboard';
import Replays from './components/Replays';
import AdminPanel from './components/AdminPanel';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Définition de process.env si nécessaire
window.process = {
  env: {
    NODE_ENV: 'development'
    }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <div className="container mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sandbox" element={<Sandbox />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/scripts" element={<MyScripts />} />
              <Route path="/tournaments" element={<TournamentList />} />
              <Route path="/tournament/:id" element={<TournamentDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/replays" element={<Replays />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
        </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
