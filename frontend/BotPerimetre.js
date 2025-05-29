/*  -------------------------------------------------------------
    Bot : Perimeter Clockwise
    Objectif : longer le cadre en boucle, sans collision murale
    ------------------------------------------------------------- */

function nextMove(state) {
  const { rows, cols, me } = state;
  const h = me[0];               // tête du serpent

  /* on suit le bord :   ┏━━►
                         ▼   │
                         │   ▲
                         ◄━━┛                         */

  // bande du haut : on va vers la droite
  if (h.x === 0           && h.y < cols - 1) return 'right';

  // bande de droite : on va vers le bas
  if (h.y === cols - 1    && h.x < rows - 1) return 'down';

  // bande du bas : on va vers la gauche
  if (h.x === rows - 1    && h.y > 0)        return 'left';

  // bande de gauche : on va vers le haut
  /* (position résiduelle : x > 0 car cas h.x === 0 déjà pris) */
  return 'up';
}
