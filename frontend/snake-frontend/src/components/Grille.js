import React, { useState, useEffect } from 'react';

function Grille({ rows, cols }) {
    // Directions initiales
    const [direction1, setDirection1] = useState({ x: 0, y: 1 }); // Droite
    const [direction2, setDirection2] = useState({ x: 0, y: -1 }); // Gauche

    // Fonctions pour mettre à jour la direction des serpents
    const updateDirection1 = (newDirection) => {
        setDirection1(newDirection);
    };
    const updateDirection2 = (newDirection) => {
        setDirection2(newDirection);
    };

    // Gestion des touches pour les déplacements
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowUp':
                updateDirection1({ x: -1, y: 0 });
                break;
            case 'ArrowDown':
                updateDirection1({ x: 1, y: 0 });
                break;
            case 'ArrowLeft':
                updateDirection1({ x: 0, y: -1 });
                break;
            case 'ArrowRight':
                updateDirection1({ x: 0, y: 1 });
                break;
            case 'w':
                updateDirection2({ x: -1, y: 0 });
                break;
            case 's':
                updateDirection2({ x: 1, y: 0 });
                break;
            case 'a':
                updateDirection2({ x: 0, y: -1 });
                break;
            case 'd':
                updateDirection2({ x: 0, y: 1 });
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Initialisation des serpents
    const [snake1, setSnake1] = useState([
        { x: 0, y: 2 }, // Tête
        { x: 0, y: 1 }, // Milieu
        { x: 0, y: 0 }, // Queue
    ]);

    const [snake2, setSnake2] = useState([
        { x: rows - 1, y: cols - 3 }, // Tête
        { x: rows - 1, y: cols - 2 }, // Milieu
        { x: rows - 1, y: cols - 1 }, // Queue
    ]);

    // Fonction de gestion des collisions avec les murs
    const checkCollision = (head) => {
        return (
            head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols
        );
    };

    // Mouvement des serpents avec gestion des collisions
    const moveSnake = (snake, direction, setSnake, snakeNumber) => {
        setSnake((prev) => {
            const newHead = {
                x: prev[0].x + direction.x,
                y: prev[0].y + direction.y,
            };

            if (checkCollision(newHead)) {
                alert(`Collision ! Serpent ${snakeNumber} a perdu.`);
                return prev;
            }

            const newBody = [newHead, ...prev.slice(0, -1)];
            return newBody;
        });
    };

    // Boucle de mouvement automatique
    useEffect(() => {
        const interval = setInterval(() => {
            moveSnake(snake1, direction1, setSnake1, 1);
            moveSnake(snake2, direction2, setSnake2, 2);
        }, 200);
        return () => clearInterval(interval);
    }, [direction1, direction2]);

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
                        }}
                    />
                );
            }
            grid.push(<div key={row} style={{ display: 'flex' }}>{currentRow}</div>);
        }
        return grid;
    };

    return <div>{createGrid()}</div>;
}

export default Grille;
