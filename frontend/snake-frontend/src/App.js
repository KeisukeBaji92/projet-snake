import React from 'react';
import Grille from './components/Grille';
import './components/Grille.css';

function App() {
    return (
        <div>
            <h1>Projet Snake</h1>
            <Grille rows={20} cols={20} />
        </div>
    );
}

export default App;
