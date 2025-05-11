import React from 'react';
import Grille from './components/Grille';

function App() {
  return (
    <div>
      <h1>Projet Snake</h1>
      <Grille rows={30} cols={30} />
    </div>
  );
}

export default App;
