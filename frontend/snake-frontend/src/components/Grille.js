import React from 'react';

const Grille = ({ rows, cols }) => {
    const grid = [];

    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(<div key={`${i}-${j}`} className="cell"></div>);
        }
        grid.push(<div key={i} className="row">{row}</div>);
    }

    return (
        <div className="grid">
            {grid}
        </div>
    );
};

export default Grille;
