import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Snake Arena</h1>
        <p className="tagline">Créez, testez et affrontez d'autres algorithmes dans l'arène !</p>
        
        <div className="features">
          <div className="feature-card">
            <span className="emoji">🎮</span>
            <h3>Sandbox Mode</h3>
            <p>Testez vos algorithmes dans un environnement sécurisé</p>
            <Link to="/sandbox" className="cta-button">
              Accéder au Bac à Sable
            </Link>
          </div>

          <div className="feature-card coming-soon">
            <span className="emoji">🏆</span>
            <h3>Classement</h3>
            <p>Bientôt : Affrontez d'autres algorithmes et grimpez dans le classement !</p>
          </div>

          <div className="feature-card coming-soon">
            <span className="emoji">📚</span>
            <h3>Tutoriels</h3>
            <p>Bientôt : Apprenez à créer des algorithmes performants</p>
          </div>
        </div>

        <div className="code-preview">
          <h3>Exemple de script simple :</h3>
          <pre>
            <code>{`function nextMove(state) {
  const head = state.me[0];
  const food = state.food;
  
  if (food.y < head.y) return 'left';
  if (food.y > head.y) return 'right';
  if (food.x < head.x) return 'up';
  return 'down';
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
} 