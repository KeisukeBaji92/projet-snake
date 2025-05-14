import React from 'react';
import Grille from './components/SnakeBoard';
import SnakeBoard from './components/SnakeBoard';

function App() {
  return (
    <div>
      <h1>Projet Snake</h1>
      <SnakeBoard rows={20} cols={20} />
    </div>
  );
}

export default App;
