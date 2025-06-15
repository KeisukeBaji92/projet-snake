const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Récupérer le token du header Authorization
  const authHeader = req.header('Authorization');

  // Vérifier si pas de header Authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    // Extraire le token (format: "Bearer <token>")
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Format de token invalide' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Récupérer l'utilisateur complet pour avoir le rôle
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
}; 