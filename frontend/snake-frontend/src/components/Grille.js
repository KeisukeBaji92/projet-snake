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

  // Gestion des touches du clavier
  const handleKeyDown = (event) => {
    switch (event.key) {
      // Contrôles pour le serpent 1 (flèches)
      case "ArrowUp":
        if (direction1.x !== 1) setDirection1({ x: -1, y: 0 });
        break;
      case "ArrowDown":
        if (direction1.x !== -1) setDirection1({ x: 1, y: 0 });
        break;
      case "ArrowLeft":
        if (direction1.y !== 1) setDirection1({ x: 0, y: -1 });
        break;
      case "ArrowRight":
        if (direction1.y !== -1) setDirection1({ x: 0, y: 1 });
        break;

      // Contrôles pour le serpent 2 (WASD)
      case "w":
        if (direction2.x !== 1) setDirection2({ x: -1, y: 0 });
        break;
      case "s":
        if (direction2.x !== -1) setDirection2({ x: 1, y: 0 });
        break;
      case "a":
        if (direction2.y !== 1) setDirection2({ x: 0, y: -1 });
        break;
      case "d":
        if (direction2.y !== -1) setDirection2({ x: 0, y: 1 });
        break;
      default:
        break;
    }
  };

  // Attacher l'événement clavier globalement
  useEffect(() => {
    const handleKeyDownGlobal = (event) => handleKeyDown(event);
    window.addEventListener("keydown", handleKeyDownGlobal);

    return () => {
      window.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [direction1, direction2]);

  // Fonction de déplacement des serpents
  const moveSnake = (snake, direction) => {
    const newHead = {
      x: (snake[0].x + direction.x + rows) % rows,
      y: (snake[0].y + direction.y + cols) % cols,
    };
    const newSnake = [newHead, ...snake.slice(0, -1)];
    return newSnake;
  };

  // Déplacement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setSnake1((prev) => moveSnake(prev, direction1));
      setSnake2((prev) => moveSnake(prev, direction2));
    }, 200);
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
