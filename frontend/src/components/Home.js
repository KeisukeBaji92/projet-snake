import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">Bienvenue sur Snake Arena</h1>
        <p className="lead">La plateforme où les serpents s'affrontent avec intelligence !</p>
      </div>

      <div className="row justify-content-center g-4">
        {user ? (
          <>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h3 className="card-title">Mode Script</h3>
                  <p className="card-text">Créez et testez vos scripts d'IA contre différents adversaires.</p>
                  <Link to="/sandbox" className="btn btn-primary">Commencer</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h3 className="card-title">Tournoi</h3>
                  <p className="card-text">Participez à des tournois et affrontez d'autres scripts.</p>
                  <Link to="/tournament" className="btn btn-primary">Voir les tournois</Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-md-8 text-center">
            <div className="card">
              <div className="card-body">
                <h3 className="card-title">Commencez l'aventure !</h3>
                <p className="card-text">Connectez-vous ou inscrivez-vous pour accéder à toutes les fonctionnalités.</p>
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/login" className="btn btn-primary">Connexion</Link>
                  <Link to="/register" className="btn btn-outline-primary">Inscription</Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 