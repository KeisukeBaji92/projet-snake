import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Sandbox from './components/Sandbox';

// Définition de process.env si nécessaire
window.process = {
  env: {
    NODE_ENV: 'development'
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sandbox" element={<Sandbox />} />
      </Routes>
    </BrowserRouter>
  );
}
