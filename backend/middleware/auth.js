const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupérer le token du header
  const token = req.header('x-auth-token');

  // Vérifier si pas de token
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
}; 