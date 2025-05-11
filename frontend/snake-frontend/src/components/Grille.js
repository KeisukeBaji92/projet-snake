import React, { useState } from 'react';

function Grille({ rows, cols }) {
    // Initialisation des serpents
    const [snake1, setSnake1] = useState([
  { x: 0, y: 2 },  // Tête
  { x: 0, y: 1 },  // Milieu
  { x: 0, y: 0 }   // Queue
]);
  // Serpent 1 en haut à gauche
    const [snake2, setSnake2] = useState([
  { x: rows - 1, y: cols - 3 },  // Tête
  { x: rows - 1, y: cols - 2 },  // Milieu
  { x: rows - 1, y: cols - 1 }   // Queue
]);
  // Serpent 2 en bas à droite
    
    // Création de la grille avec les serpents
    const createGrid = () => {
        let grid = [];
        for (let row = 0; row < rows; row++) {
            let currentRow = [];
            for (let col = 0; col < cols; col++) {
                let isSnake1 = snake1.some(segment => segment.x === row && segment.y === col);
                let isSnake2 = snake2.some(segment => segment.x === row && segment.y === col);
                currentRow.push(
                    <div 
                        key={`${row}-${col}`} 
                        style={{
                            width: '20px', 
                            height: '20px', 
                            backgroundColor: isSnake1 ? 'green' : isSnake2 ? 'blue' : 'lightgrey', 
                            border: '1px solid black'
                        }}>
                    </div>
                );
            }
            grid.push(<div key={row} style={{ display: 'flex' }}>{currentRow}</div>);
        }
        return grid;
    };

    return (
        <div>
            {createGrid()}
        </div>
    );
}

export default Grille;
