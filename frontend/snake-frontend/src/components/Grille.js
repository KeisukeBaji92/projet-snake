import React, { useState, useEffect } from 'react';

const Grille = ({ rows, cols }) => {
  // Directions des serpents
  const [direction1, setDirection1] = useState({ x: 0, y: 1 }); // Vers la droite
  const [direction2, setDirection2] = useState({ x: 0, y: -1 }); // Vers la gauche

  // Initialisation des serpents
  const [snake1, setSnake1] = useState([
    { x: 0, y: 2 },  // Tête
    { x: 0, y: 1 },  // Milieu
    { x: 0, y: 0 }   // Queue
  ]);

  const [snake2, setSnake2] = useState([
    { x: rows - 1, y: cols - 1 },  // Tête
    { x: rows - 1, y: cols - 2 },  // Milieu
    { x: rows - 1, y: cols - 3 }   // Queue
  ]);

  // Fonctions pour mettre à jour la direction
  const updateDirection1 = (newDirection) => setDirection1(newDirection);
  const updateDirection2 = (newDirection) => setDirection2(newDirection);

  // Fonction de déplacement des serpents
  const moveSnake1 = () => {
    setSnake1((prev) => {
      const newHead = {
        x: (prev[0].x + direction1.x + rows) % rows,
        y: (prev[0].y + direction1.y + cols) % cols,
      };
      const newBody = [newHead, ...prev.slice(0, -1)];
      return newBody;
    });
  };

  const moveSnake2 = () => {
    setSnake2((prev) => {
      const newHead = {
        x: (prev[0].x + direction2.x + rows) % rows,
        y: (prev[0].y + direction2.y + cols) % cols,
      };
      const newBody = [newHead, ...prev.slice(0, -1)];
      return newBody;
    });
  };

  // Déplacement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      moveSnake1();
      moveSnake2();
    }, 500); // Vitesse ajustée pour bien voir le déplacement
    return () => clearInterval(interval);
  }, [direction1, direction2]);

  // Création de la grille avec les serpents
  const createGrid = () => {
    let grid = [];
    for (let row = 0; row < rows; row++) {
      let currentRow = [];
      for (let col = 0; col < cols; col++) {
        const isSnake1 = snake1.some(segment => segment.x === row && segment.y === col);
        const isSnake2 = snake2.some(segment => segment.x === row && segment.y === col);
        currentRow.push(
          <div
            key={`${row}-${col}`}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: isSnake1 ? 'green' : isSnake2 ? 'blue' : 'lightgrey',
              border: '1px solid black',
            }}
          ></div>
        );
      }
      grid.push(
        <div key={row} style={{ display: 'flex' }}>
          {currentRow}
        </div>
      );
    }
    return grid;
  };

  return (
    <div>
      {createGrid()}
    </div>
  );
};

export default Grille;
