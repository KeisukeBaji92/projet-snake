import React from 'react';
import Grille from './components/Grille';
import './components/Grille.css';

function App() {
    return (
        <div>
            <h1>Projet Snake</h1>
            <Grille rows={10} cols={10} />
        </div>
    );
}

export default App;
