const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
    }
    
    next();
  } catch (error) {
    console.error('Erreur de vérification admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 